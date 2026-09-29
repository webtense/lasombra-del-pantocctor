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
