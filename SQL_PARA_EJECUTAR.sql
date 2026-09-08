-- ═══════════════════════════════════════════════════════════════════════════
-- La Sombra del Pantocrátor — SQL COMBINADO PARA EJECUTAR EN SUPABASE
-- Proyecto: pllmguryaubhnynubfpk (eu-west-1)
-- SQL Editor: https://supabase.com/dashboard/project/pllmguryaubhnynubfpk/sql/new
--
-- Generado automáticamente concatenando, EN ESTE ORDEN:
--   1) supabase-schema-purchases.sql
--   2) supabase-schema-user-logins.sql   (depende de purchases(id))
--
-- Instrucciones: copiar TODO este fichero, pegarlo en el SQL Editor y pulsar RUN.
-- Es idempotente (CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE FUNCTION),
-- se puede reejecutar sin romper nada.
--
-- IMPORTANTE: todo se crea en el esquema `public`. Los esquemas expuestos del
-- proyecto son `api, public, graphql_public` y supabase-js usa `public`. NO
-- cambiar el search_path de las funciones.
-- ═══════════════════════════════════════════════════════════════════════════


-- ###########################################################################
-- ### PARTE 1/2 — supabase-schema-purchases.sql
-- ###########################################################################

-- La Sombra del Pantocrátor — Módulo de Compras (post-Stripe)
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql)
--
-- Diseño de seguridad: igual que supabase-schema-testers.sql, la app solo
-- tiene la clave "anon" (no hay service role key en .env). purchases guarda
-- el email del comprador (dato sensible: no debe poder listarse vía REST
-- con la anon key pública), así que NO tiene policy de SELECT — todo el
-- acceso pasa por funciones SECURITY DEFINER. purchase_downloads tampoco
-- expone policy de SELECT/INSERT para anon por el mismo motivo (relaciona
-- compras con IPs/user-agents).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- PURCHASES — una fila por sesión de pago de Stripe completada
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  stripe_session_id TEXT NOT NULL,
  email             TEXT NOT NULL,
  formats           TEXT[] NOT NULL DEFAULT ARRAY['epub','pdf','mobi','audio_m4b'],
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked           BOOLEAN DEFAULT false NOT NULL,
  email_sent        BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT purchases_stripe_session_unique UNIQUE (stripe_session_id)
);

CREATE INDEX IF NOT EXISTS purchases_created_at_idx ON purchases (created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_email_idx       ON purchases (email);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito — solo accesible vía funciones de abajo)

-- ─────────────────────────────────────────────
-- PURCHASE_DOWNLOADS — descargas registradas, para limitar a N por formato
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_downloads (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  file_type   TEXT NOT NULL, -- 'epub' | 'pdf' | 'mobi' | 'audio_m4b'
  ip_hash     TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS purchase_downloads_purchase_idx      ON purchase_downloads (purchase_id);
CREATE INDEX IF NOT EXISTS purchase_downloads_purchase_type_idx ON purchase_downloads (purchase_id, file_type);
CREATE INDEX IF NOT EXISTS purchase_downloads_created_at_idx    ON purchase_downloads (created_at DESC);

ALTER TABLE purchase_downloads ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito)


-- ═════════════════════════════════════════════
-- FUNCIONES (SECURITY DEFINER — bypasean RLS con cuidado, validando dentro)
-- ═════════════════════════════════════════════

-- Registrar (o recuperar, idempotente) la compra tras checkout.session.completed.
-- Idempotente por stripe_session_id: el webhook de Stripe puede reintentar el
-- mismo evento y esto no debe duplicar filas ni pisar expires_at/email_sent.
CREATE OR REPLACE FUNCTION register_purchase(
  p_stripe_session_id TEXT,
  p_email TEXT,
  p_formats TEXT[] DEFAULT ARRAY['epub','pdf','mobi','audio_m4b'],
  p_ttl_days INT DEFAULT 3650
)
RETURNS purchases
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row purchases;
BEGIN
  INSERT INTO purchases (stripe_session_id, email, formats, expires_at)
  VALUES (
    p_stripe_session_id,
    lower(trim(p_email)),
    p_formats,
    NOW() + make_interval(days => GREATEST(1, p_ttl_days))
  )
  ON CONFLICT (stripe_session_id) DO UPDATE
    SET email = COALESCE(NULLIF(purchases.email, ''), EXCLUDED.email)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Marca la compra como "email enviado" solo la primera vez (compare-and-set).
-- Devuelve true si este era el envío que debe disparar el email (primera vez),
-- false si ya se había enviado antes o la compra no existe — así el webhook,
-- que Stripe puede reintentar, nunca manda el email de descarga duplicado.
CREATE OR REPLACE FUNCTION try_mark_purchase_email_sent(p_stripe_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE purchases
    SET email_sent = true
    WHERE stripe_session_id = p_stripe_session_id
      AND email_sent = false;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Valida + registra una descarga en un solo paso: comprueba que la compra
-- existe, no está revocada, no ha caducado y que el formato pedido estaba
-- incluido en la compra; cuenta las descargas ya hechas de ese formato y,
-- si no se ha superado el límite (por defecto 5), inserta el registro.
CREATE OR REPLACE FUNCTION register_purchase_download(
  p_stripe_session_id TEXT,
  p_file_type TEXT,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (ok BOOLEAN, reason TEXT, downloads_used INT, downloads_limit INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_p purchases;
  v_count INT;
BEGIN
  SELECT * INTO v_p FROM purchases WHERE stripe_session_id = p_stripe_session_id;

  IF v_p IS NULL THEN
    RETURN QUERY SELECT false, 'not_found', 0, p_limit;
    RETURN;
  END IF;

  IF v_p.revoked THEN
    RETURN QUERY SELECT false, 'revoked', 0, p_limit;
    RETURN;
  END IF;

  IF v_p.expires_at < NOW() THEN
    RETURN QUERY SELECT false, 'expired', 0, p_limit;
    RETURN;
  END IF;

  IF NOT (p_file_type = ANY (v_p.formats)) THEN
    RETURN QUERY SELECT false, 'format_not_purchased', 0, p_limit;
    RETURN;
  END IF;

  SELECT count(*) INTO v_count
    FROM purchase_downloads
    WHERE purchase_id = v_p.id AND file_type = p_file_type;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, 'limit_reached', v_count, p_limit;
    RETURN;
  END IF;

  INSERT INTO purchase_downloads (purchase_id, file_type, ip_hash, user_agent)
  VALUES (v_p.id, p_file_type, p_ip_hash, p_user_agent);

  RETURN QUERY SELECT true, NULL::TEXT, v_count + 1, p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION register_purchase(TEXT, TEXT, TEXT[], INT)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION try_mark_purchase_email_sent(TEXT)                      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION register_purchase_download(TEXT, TEXT, TEXT, TEXT, INT) TO anon, authenticated;


-- ###########################################################################
-- ### PARTE 2/2 — supabase-schema-user-logins.sql
-- ###########################################################################

-- La Sombra del Pantocrátor — Autenticación post-pago (tabla user_logins)
-- Ejecutar en: Supabase > SQL Editor (DESPUÉS de supabase-schema-purchases.sql,
-- porque user_logins.purchase_id referencia purchases(id)).
--
-- Diseño de seguridad: igual que purchases/testers, la app solo dispone de la
-- clave "anon" (no hay service role key). password_hash NO puede quedar
-- listable vía REST con la anon key pública, así que la tabla tiene RLS
-- activo y CERO policies: todo el acceso pasa por funciones SECURITY DEFINER
-- declaradas abajo, que validan sus argumentos antes de tocar nada.

-- ─────────────────────────────────────────────
-- USER_LOGINS — credenciales de acceso a /panel generadas tras la compra
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_logins (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,   -- formato: scrypt$N$r$p$salt_b64$hash_b64
  purchase_id   BIGINT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  CONSTRAINT user_logins_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS user_logins_email_idx       ON user_logins (email);
CREATE INDEX IF NOT EXISTS user_logins_purchase_id_idx ON user_logins (purchase_id);

ALTER TABLE user_logins ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito — solo accesible vía funciones de abajo)


-- ═════════════════════════════════════════════
-- FUNCIONES (SECURITY DEFINER)
-- ═════════════════════════════════════════════

-- Crea el login del comprador tras checkout.session.completed.
-- IDEMPOTENTE: si el email ya tiene login (recompra, o reintento del webhook
-- de Stripe), NO pisa la contraseña existente y devuelve false. El webhook usa
-- ese false para no prometer en el email una contraseña que no se ha guardado.
-- Devuelve true solo cuando ha creado realmente la fila.
CREATE OR REPLACE FUNCTION register_user_login(
  p_email         TEXT,
  p_password_hash TEXT,
  p_purchase_id   BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inserted INT;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' OR p_password_hash IS NULL THEN
    RETURN false;
  END IF;

  -- La compra debe existir (audit trail + evita logins huérfanos).
  IF NOT EXISTS (SELECT 1 FROM purchases WHERE id = p_purchase_id) THEN
    RETURN false;
  END IF;

  INSERT INTO user_logins (email, password_hash, purchase_id)
  VALUES (lower(trim(p_email)), p_password_hash, p_purchase_id)
  ON CONFLICT (email) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

-- Devuelve el hash del usuario para que /api/auth/login lo verifique en Node
-- (scrypt no está disponible en Postgres). Solo devuelve fila si la compra
-- asociada sigue viva: ni revocada ni caducada.
CREATE OR REPLACE FUNCTION get_user_login(p_email TEXT)
RETURNS TABLE (id BIGINT, password_hash TEXT, purchase_id BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT ul.id, ul.password_hash, ul.purchase_id
    FROM user_logins ul
    JOIN purchases p ON p.id = ul.purchase_id
   WHERE ul.email = lower(trim(p_email))
     AND p.revoked = false
     AND p.expires_at > NOW();
END;
$$;

-- KPIs agregados para /dashboard. Devuelve SOLO recuentos — ningún email ni
-- dato personal — para que la anon key no pueda extraer PII por esta vía.
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_purchases   BIGINT,
  purchases_today   BIGINT,
  downloads_total   BIGINT,
  downloads_epub    BIGINT,
  downloads_pdf     BIGINT,
  downloads_mobi    BIGINT,
  downloads_audio   BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM purchases),
    (SELECT count(*) FROM purchases WHERE created_at >= date_trunc('day', NOW())),
    (SELECT count(*) FROM purchase_downloads),
    (SELECT count(*) FROM purchase_downloads WHERE file_type = 'epub'),
    (SELECT count(*) FROM purchase_downloads WHERE file_type = 'pdf'),
    (SELECT count(*) FROM purchase_downloads WHERE file_type = 'mobi'),
    (SELECT count(*) FROM purchase_downloads WHERE file_type = 'audio_m4b');
END;
$$;

GRANT EXECUTE ON FUNCTION register_user_login(TEXT, TEXT, BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_login(TEXT)                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats()                   TO anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- FIN. Verificación rápida (opcional, ejecutar aparte):
--   SELECT * FROM get_dashboard_stats();
--   SELECT * FROM get_user_login('noexiste@example.com');   -- debe dar 0 filas
-- ═══════════════════════════════════════════════════════════════════════════
