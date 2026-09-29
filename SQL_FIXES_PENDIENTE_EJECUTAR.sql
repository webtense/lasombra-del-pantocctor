-- ═══════════════════════════════════════════════════════════════════════════
-- La Sombra del Pantocrátor — SQL PENDIENTE DE EJECUTAR
-- Proyecto Supabase: pllmguryaubhnynubfpk (eu-west-1)
-- SQL Editor: https://supabase.com/dashboard/project/pllmguryaubhnynubfpk/sql/new
--
-- ⚠️  ESTE FICHERO NO SE HA EJECUTADO. Hay que copiarlo entero en el SQL
--     Editor de Supabase y pulsar RUN. Todo es idempotente (CREATE TABLE IF
--     NOT EXISTS / CREATE OR REPLACE FUNCTION / DROP POLICY IF EXISTS), se
--     puede reejecutar sin romper nada.
--
-- Contenido:
--   PARTE 1 — tabla public.events            (FIX 3: PGRST205 en cada descarga)
--   PARTE 2 — reset_purchase_email_sent()    (FIX 2: revertir el flag si Brevo falla)
--   PARTE 3 — register_or_reset_user_login() (FIX 2: no perder la contraseña)
--   PARTE 4 — reset_user_password()          (FIX 2: /api/auth/reset-password)
--   PARTE 5 — LIMPIEZA de filas de prueba    (ejecutar SOLO cuando se quiera)
--
-- Todo vive en el esquema `public`. Los esquemas expuestos del proyecto son
-- `api, public, graphql_public`; supabase-js usa `public`. NO cambiar el
-- search_path de las funciones.
-- ═══════════════════════════════════════════════════════════════════════════


-- ###########################################################################
-- ### PARTE 1/5 — TABLA public.events
-- ###########################################################################
--
-- Motivo: logEvent() en app/api/download/[file]/route.ts y POST /api/event
-- insertan en `events`, pero la tabla nunca llegó a crearse en este proyecto
-- (Supabase respondía PGRST205 "Could not find the table 'public.events'").
-- Resultado: rechazo silencioso en CADA descarga y analítica perdida.
--
-- Es la misma definición que ya estaba en supabase-schema.sql (que tampoco se
-- ejecutó nunca en este proyecto), reescrita para ser reejecutable.

CREATE TABLE IF NOT EXISTS public.events (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_id  TEXT,
  ip_hash     TEXT,
  event_type  TEXT NOT NULL,
  event_data  JSONB,
  device_type TEXT,
  country     TEXT,
  referrer    TEXT
);

CREATE INDEX IF NOT EXISTS events_created_at_idx ON public.events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_type_idx       ON public.events (event_type);
CREATE INDEX IF NOT EXISTS events_session_idx    ON public.events (session_id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Insert abierto a anon: la app solo tiene la anon key y la analítica se
-- escribe desde el servidor con esa misma clave. No hay PII (solo ip_hash).
DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events FOR INSERT TO anon WITH CHECK (true);

-- Select abierto a anon: lo necesita el dashboard, que también usa la anon key.
-- (Si en algún momento se añade service role key, conviene quitar esta policy
--  y leer los KPIs solo por RPC, como ya se hace en get_dashboard_stats.)
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT TO anon USING (true);


-- ###########################################################################
-- ### PARTE 2/5 — reset_purchase_email_sent()
-- ###########################################################################
--
-- Motivo (FIX 2): el webhook marcaba email_sent = true ANTES de llamar a
-- Brevo. Si Brevo fallaba (ahora mismo devuelve 401 por IP no autorizada), el
-- flag quedaba a true, el reintento de Stripe salía por el return temprano y
-- el comprador se quedaba sin email, sin contraseña y sin recuperación.
--
-- Con esta función el webhook usa try_mark_purchase_email_sent() como
-- "reserva" (claim) y, SOLO si el envío falla, revierte el flag para que el
-- siguiente reintento de Stripe vuelva a intentarlo.

CREATE OR REPLACE FUNCTION public.reset_purchase_email_sent(p_stripe_session_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE purchases
     SET email_sent = false
   WHERE stripe_session_id = p_stripe_session_id
     AND email_sent = true;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;


-- ###########################################################################
-- ### PARTE 3/5 — register_or_reset_user_login()
-- ###########################################################################
--
-- Motivo (FIX 2): register_user_login() hace ON CONFLICT (email) DO NOTHING.
-- En un reintento tras un envío fallido la fila ya existe, así que devolvía
-- false, el webhook ponía panelPassword = null y el email decía "usa la
-- contraseña de tu compra anterior"… una contraseña que nunca se envió.
--
-- Esta versión SÍ pisa el hash, pero ÚNICAMENTE cuando la fila existente
-- pertenece a ESTA MISMA compra (purchase_id igual). Es decir:
--   • reintento de la misma compra  → regenera la contraseña (nunca se entregó)
--   • cliente recurrente con compra nueva → NO toca su contraseña, devuelve false
-- register_user_login() se conserva por compatibilidad, pero el webhook ya no
-- la usa.

CREATE OR REPLACE FUNCTION public.register_or_reset_user_login(
  p_email         TEXT,
  p_password_hash TEXT,
  p_purchase_id   BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rows INT;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' OR p_password_hash IS NULL THEN
    RETURN false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM purchases WHERE id = p_purchase_id) THEN
    RETURN false;
  END IF;

  INSERT INTO user_logins (email, password_hash, purchase_id)
  VALUES (lower(trim(p_email)), p_password_hash, p_purchase_id)
  ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         updated_at    = NOW()
   WHERE user_logins.purchase_id = EXCLUDED.purchase_id;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;


-- ###########################################################################
-- ### PARTE 4/5 — reset_user_password()
-- ###########################################################################
--
-- Motivo (FIX 2): vía de recuperación para el comprador que se quedó sin
-- contraseña. La usa POST /api/auth/reset-password. A diferencia de
-- register_user_login(), esta SÍ sobrescribe siempre el hash.
--
-- Solo actúa si la compra asociada sigue viva (ni revocada ni caducada),
-- igual que get_user_login(). Devuelve true si ha actualizado una fila.
-- El endpoint responde SIEMPRE lo mismo exista o no el email, así que este
-- booleano no filtra nada al exterior.

CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_email         TEXT,
  p_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rows INT;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' OR p_password_hash IS NULL
     OR p_password_hash NOT LIKE 'scrypt$%' THEN
    RETURN false;
  END IF;

  UPDATE user_logins ul
     SET password_hash = p_password_hash,
         updated_at    = NOW()
    FROM purchases p
   WHERE p.id = ul.purchase_id
     AND ul.email = lower(trim(p_email))
     AND p.revoked = false
     AND p.expires_at > NOW();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;


-- ───────────────────────────────────────────────────────────────────────────
-- GRANTS de las tres funciones nuevas
-- ───────────────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.reset_purchase_email_sent(TEXT)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_or_reset_user_login(TEXT, TEXT, BIGINT)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_user_password(TEXT, TEXT)                     TO anon, authenticated;


-- ###########################################################################
-- ### PARTE 5/5 — LIMPIEZA DE FILAS DE PRUEBA
-- ###########################################################################
--
-- Las filas de la prueba end-to-end ensucian los KPIs (1 compra + 9 descargas
-- que no son reales). No se pueden borrar desde la app: purchases,
-- purchase_downloads y user_logins tienen RLS activo y CERO policies, así que
-- un DELETE con la anon key devuelve 200 [] sin borrar nada. Hay que
-- ejecutarlo aquí, en el SQL Editor, que corre como postgres.
--
-- El orden importa: user_logins y purchase_downloads referencian purchases.
-- (purchase_downloads y user_logins tienen ON DELETE CASCADE, pero se borran
--  explícitamente para dejar constancia de lo que se elimina.)
--
-- Nota: la verificación de estos fixes (06/09/2026) añadió 2 compras de prueba
-- más con ESE MISMO email (stripe_session_id 'cs_test_fix1_…' y
-- 'cs_test_claim_…') y 5 filas en purchase_downloads. Los tres DELETE de abajo
-- las cubren todas, no hace falta tocar nada.
--
-- Comprobación previa recomendada:
--   SELECT id, stripe_session_id, email, created_at FROM public.purchases WHERE email = 'test-compra@lasombra.local';

DELETE FROM public.user_logins        WHERE email IN ('test-compra@lasombra.local','test-login@lasombra.local');
DELETE FROM public.purchase_downloads WHERE purchase_id IN (SELECT id FROM public.purchases WHERE email = 'test-compra@lasombra.local');
DELETE FROM public.purchases          WHERE email = 'test-compra@lasombra.local';

-- Verificación posterior (debe devolver 0 compras y 0 descargas):
--   SELECT * FROM public.get_dashboard_stats();
