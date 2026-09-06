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
