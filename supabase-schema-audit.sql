-- ═══════════════════════════════════════════════════════════════════════════
-- La Sombra del Pantocrátor — AUDITORÍA DEL PANEL ADMIN
-- Proyecto Supabase: pllmguryaubhnynubfpk (eu-west-1)
-- SQL Editor: https://supabase.com/dashboard/project/pllmguryaubhnynubfpk/sql/new
--
-- ⚠️  ESTE FICHERO NO SE HA EJECUTADO TODAVÍA. Hay que copiarlo entero en el
--     SQL Editor de Supabase y pulsar RUN. Todo es idempotente (CREATE TABLE
--     IF NOT EXISTS / CREATE OR REPLACE FUNCTION), se puede reejecutar sin
--     romper nada.
--
-- Ejecutar DESPUÉS de supabase-schema-purchases.sql y
-- supabase-schema-user-logins.sql: get_purchases_activity() lee purchases,
-- purchase_downloads y user_logins.
--
-- Contenido:
--   PARTE 1 — tabla admin_audit_log          (quién hizo qué en el panel)
--   PARTE 2 — log_admin_action()             (escritura, la usa lib/admin-audit.ts)
--   PARTE 3 — admin_audit_config + clave de lectura
--   PARTE 4 — get_admin_audit_log()          (lectura paginada del log)
--   PARTE 5 — get_purchases_activity()       (actividad de compradores)
--   PARTE 6 — PASO MANUAL: fijar la clave de lectura
--
-- ─── Diseño de seguridad ───────────────────────────────────────────────────
-- Igual que purchases/user_logins/testers: la app SOLO tiene la clave "anon"
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY, pública por definición: viaja al navegador).
-- No hay service role key. Por eso:
--
--   · Las tablas tienen RLS activo y CERO policies → no son listables vía REST.
--   · Todo el acceso pasa por funciones SECURITY DEFINER.
--   · Las funciones de LECTURA devuelven PII (emails de compradores, usuarios
--     admin, targets). Con la anon key siendo pública, concederlas "a pelo" a
--     anon equivaldría a publicar la lista de clientes en internet — justo lo
--     que supabase-schema-purchases.sql evita a propósito. Por eso exigen una
--     CLAVE DE LECTURA (p_admin_key) que solo conoce el servidor
--     (variable de entorno ADMIN_AUDIT_READ_KEY, nunca NEXT_PUBLIC_*).
--     Fail-closed: sin clave configurada en la BD, no devuelven nada.
--   · La función de ESCRITURA (log_admin_action) sí es anon, porque la app la
--     invoca con la anon key. Consecuencia asumida y conocida: quien tenga la
--     anon key puede insertar filas de auditoría falsas (ruido), igual que
--     puede llamar a register_purchase. No puede LEER el log ni borrarlo.
-- ═══════════════════════════════════════════════════════════════════════════


-- ###########################################################################
-- ### PARTE 1/6 — TABLA admin_audit_log
-- ###########################################################################

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor      TEXT NOT NULL,   -- username del admin (o el intentado, en login_failed)
  action     TEXT NOT NULL,   -- 'login_success' | 'login_failed' | 'tester_created' | 'mailing_sync' | 'campaign_sent' | ...
  target     TEXT,            -- email / id afectado (opcional)
  details    JSONB,
  ip_hash    TEXT             -- sha256(ip + salt) truncado a 16 chars, NUNCA la IP en claro
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx     ON public.admin_audit_log (action);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx      ON public.admin_audit_log (actor);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito — solo accesible vía las funciones de abajo)


-- ###########################################################################
-- ### PARTE 2/6 — log_admin_action() — escritura del log
-- ###########################################################################
--
-- La llama lib/admin-audit.ts en modo fire-and-forget: nunca debe romper la
-- operación auditada, así que valida y RECORTA en vez de lanzar excepciones.
-- Devuelve el id de la fila insertada, o NULL si la acción venía vacía.

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_actor   TEXT,
  p_action  TEXT,
  p_target  TEXT  DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_hash TEXT  DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF p_action IS NULL OR trim(p_action) = '' THEN
    RETURN NULL;
  END IF;

  -- Recorte defensivo: `actor` y `target` pueden venir de entrada del usuario
  -- (en login_failed, el username tecleado por quien intenta entrar), así que
  -- se acotan para que nadie pueda inflar la tabla con cadenas gigantes.
  INSERT INTO public.admin_audit_log (actor, action, target, details, ip_hash)
  VALUES (
    left(COALESCE(NULLIF(trim(p_actor), ''), 'desconocido'), 200),
    left(trim(p_action), 100),
    left(NULLIF(trim(COALESCE(p_target, '')), ''), 300),
    p_details,
    left(NULLIF(trim(COALESCE(p_ip_hash, '')), ''), 64)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- ###########################################################################
-- ### PARTE 3/6 — admin_audit_config: clave de lectura
-- ###########################################################################
--
-- Una sola fila. Guarda el SHA-256 (hex) de la clave, nunca la clave en claro.
-- RLS activo y sin policies → ni siquiera el hash es legible vía REST.

CREATE TABLE IF NOT EXISTS public.admin_audit_config (
  id            INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  read_key_hash TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_config ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito)

-- Comparación de la clave recibida contra el hash guardado.
-- Fail-closed en los tres casos peligrosos: sin clave configurada en la BD,
-- sin clave en la llamada, o clave vacía → false.
-- Se usa sha256() de pg_catalog (no pgcrypto/digest): pgcrypto en Supabase
-- vive en el esquema `extensions` y estas funciones fijan search_path=public,
-- así que digest() no resolvería.
CREATE OR REPLACE FUNCTION public.admin_audit_key_ok(p_admin_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_hash TEXT;
BEGIN
  IF p_admin_key IS NULL OR length(p_admin_key) = 0 THEN
    RETURN false;
  END IF;

  SELECT read_key_hash INTO v_hash FROM public.admin_audit_config WHERE id = 1;
  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN v_hash = encode(sha256(convert_to(p_admin_key, 'UTF8')), 'hex');
END;
$$;

-- No se concede EXECUTE a anon sobre admin_audit_key_ok a propósito: sería un
-- oráculo para probar claves. Las funciones de lectura la llaman por dentro
-- (son SECURITY DEFINER, corren como su propietario).
REVOKE ALL ON FUNCTION public.admin_audit_key_ok(TEXT) FROM PUBLIC, anon, authenticated;


-- ###########################################################################
-- ### PARTE 4/6 — get_admin_audit_log() — lectura paginada del log
-- ###########################################################################
--
-- Más recientes primero. Si la clave no es válida devuelve CERO filas (no
-- lanza excepción: así el dashboard puede mostrar "no configurado" en vez de
-- un error 500 feo).
--
-- Nota de firma: p_admin_key va primero pero TODOS los argumentos tienen
-- default, así que PostgREST admite llamarla con argumentos con nombre
-- ({p_admin_key, p_limit, p_offset}).

CREATE OR REPLACE FUNCTION public.get_admin_audit_log(
  p_admin_key TEXT DEFAULT NULL,
  p_limit     INT  DEFAULT 100,
  p_offset    INT  DEFAULT 0
)
RETURNS TABLE (
  id         BIGINT,
  created_at TIMESTAMPTZ,
  actor      TEXT,
  action     TEXT,
  target     TEXT,
  details    JSONB,
  ip_hash    TEXT,
  total      BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limit  INT := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
  v_total  BIGINT;
BEGIN
  IF NOT public.admin_audit_key_ok(p_admin_key) THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_total FROM public.admin_audit_log;

  RETURN QUERY
  SELECT l.id, l.created_at, l.actor, l.action, l.target, l.details, l.ip_hash, v_total
    FROM public.admin_audit_log l
   ORDER BY l.created_at DESC, l.id DESC
   LIMIT v_limit OFFSET v_offset;
END;
$$;


-- ###########################################################################
-- ### PARTE 5/6 — get_purchases_activity() — actividad de compradores
-- ###########################################################################
--
-- Una fila por compra, con sus descargas agregadas y si tiene login creado.
-- NUNCA devuelve user_logins.password_hash: solo el booleano has_login y la
-- fecha de creación del login. De purchase_downloads devuelve formato, fecha
-- e ip_hash (el hash, no la IP); user_agent se omite por no aportar al panel.
--
-- Misma puerta de clave que get_admin_audit_log(): sin clave válida, 0 filas.

CREATE OR REPLACE FUNCTION public.get_purchases_activity(
  p_admin_key TEXT DEFAULT NULL,
  p_limit     INT  DEFAULT 100,
  p_offset    INT  DEFAULT 0
)
RETURNS TABLE (
  purchase_id      BIGINT,
  created_at       TIMESTAMPTZ,
  email            TEXT,
  formats          TEXT[],
  revoked          BOOLEAN,
  expires_at       TIMESTAMPTZ,
  email_sent       BOOLEAN,
  has_login        BOOLEAN,
  login_created_at TIMESTAMPTZ,
  downloads_total  BIGINT,
  downloads        JSONB,
  total            BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limit  INT := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
  v_total  BIGINT;
BEGIN
  IF NOT public.admin_audit_key_ok(p_admin_key) THEN
    RETURN;
  END IF;

  SELECT count(*) INTO v_total FROM public.purchases;

  RETURN QUERY
  SELECT
    p.id,
    p.created_at,
    p.email,
    p.formats,
    p.revoked,
    p.expires_at,
    p.email_sent,
    (ul.id IS NOT NULL)         AS has_login,
    ul.created_at               AS login_created_at,
    COALESCE(d.n, 0)               AS downloads_total,
    COALESCE(d.dl_rows, '[]'::jsonb) AS downloads,
    v_total
  FROM public.purchases p
  -- LATERAL con LIMIT 1 en vez de LEFT JOIN directo: user_logins.purchase_id
  -- NO es único (lo único es el email), así que dos logins apuntando a la
  -- misma compra duplicarían la fila del comprador en el panel.
  LEFT JOIN LATERAL (
    SELECT u.id, u.created_at
      FROM public.user_logins u
     WHERE u.purchase_id = p.id
     ORDER BY u.created_at ASC
     LIMIT 1
  ) ul ON true
  LEFT JOIN LATERAL (
    SELECT
      count(*) AS n,
      -- `rows` sería un alias desafortunado (ROWS es palabra reservada en las
      -- cláusulas de ventana), de ahí dl_rows.
      jsonb_agg(
        jsonb_build_object(
          'file_type',  pd.file_type,
          'created_at', pd.created_at,
          'ip_hash',    pd.ip_hash
        )
        ORDER BY pd.created_at DESC
      ) AS dl_rows
    FROM public.purchase_downloads pd
    WHERE pd.purchase_id = p.id
  ) d ON true
  ORDER BY p.created_at DESC, p.id DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;


-- ─────────────────────────────────────────────
-- GRANTS
-- ─────────────────────────────────────────────
-- Escritura: sí a anon (la app la llama con la anon key).
GRANT EXECUTE ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;

-- Lectura: también a anon (no hay otra clave), pero inútil sin la clave de
-- lectura, que solo vive en la variable de entorno del servidor.
GRANT EXECUTE ON FUNCTION public.get_admin_audit_log(TEXT, INT, INT)     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_purchases_activity(TEXT, INT, INT)  TO anon, authenticated;


-- ###########################################################################
-- ### PARTE 6/6 — PASO MANUAL: fijar la clave de lectura
-- ###########################################################################
--
-- Hasta que se haga esto, la pestaña "Auditoría" del dashboard mostrará
-- "No configurado" (fail-closed a propósito).
--
--   1) Genera una clave larga y aleatoria, por ejemplo:
--        openssl rand -hex 32
--
--   2) Ejecuta AQUÍ el INSERT de abajo sustituyendo <CLAVE>:
--
--        INSERT INTO public.admin_audit_config (id, read_key_hash)
--        VALUES (1, encode(sha256(convert_to('<CLAVE>', 'UTF8')), 'hex'))
--        ON CONFLICT (id) DO UPDATE
--          SET read_key_hash = EXCLUDED.read_key_hash,
--              updated_at    = NOW();
--
--   3) Pon esa MISMA clave en el entorno del servidor (Vercel > Settings >
--      Environment Variables, y en .env.local para desarrollo):
--
--        ADMIN_AUDIT_READ_KEY=<CLAVE>
--
--      Sin prefijo NEXT_PUBLIC_ — nunca debe llegar al navegador.
--
--   4) Redespliega para que Vercel tome la variable.
--
-- Verificación (debe devolver 0 filas, no un error, porque la clave es falsa):
--   SELECT * FROM public.get_admin_audit_log('clave-incorrecta', 10, 0);
-- Y con la buena, las filas reales:
--   SELECT * FROM public.get_admin_audit_log('<CLAVE>', 10, 0);
