-- La Sombra del Pantocrátor — Módulo de Testers
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql)
--
-- Diseño de seguridad: la app solo tiene la clave "anon" (no hay service role
-- key en .env). Los tokens de descarga son secretos de un solo uso temporal,
-- así que en vez de exponer la tabla tester_tokens vía REST (donde "SELECT
-- USING (true)" permitiría LISTAR todos los tokens con la anon key pública),
-- todo el acceso a esa tabla pasa por funciones SECURITY DEFINER: son las
-- únicas que pueden leer/escribir tester_tokens. testers / tester_downloads /
-- reviews sí son legibles directamente (igual que visits/events/leads ya
-- existentes) porque no contienen secretos.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────
-- TESTERS — personas a las que se les pide reseña
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testers (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email       TEXT NOT NULL,
  name        TEXT,
  notes       TEXT,
  CONSTRAINT testers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS testers_created_at_idx ON testers (created_at DESC);

ALTER TABLE testers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testers_select" ON testers FOR SELECT TO anon USING (true);
-- Sin policy de INSERT/UPDATE para anon: se crean vía upsert_tester() (abajo)

-- ─────────────────────────────────────────────
-- TESTER_TOKENS — enlaces de descarga temporales
-- RLS habilitado y SIN policies: tabla inaccesible por REST/anon,
-- solo accesible desde las funciones SECURITY DEFINER de abajo.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tester_tokens (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  tester_id   BIGINT NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT false NOT NULL,
  CONSTRAINT tester_tokens_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS tester_tokens_tester_idx ON tester_tokens (tester_id);

ALTER TABLE tester_tokens ENABLE ROW LEVEL SECURITY;
-- (sin policies a propósito)

-- ─────────────────────────────────────────────
-- TESTER_DOWNLOADS — quién descargó qué y cuándo
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tester_downloads (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  tester_id   BIGINT NOT NULL REFERENCES testers(id) ON DELETE CASCADE,
  file_type   TEXT NOT NULL, -- 'epub' | 'pdf' | 'audio'
  ip_hash     TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS tester_downloads_tester_idx     ON tester_downloads (tester_id);
CREATE INDEX IF NOT EXISTS tester_downloads_created_at_idx ON tester_downloads (created_at DESC);

ALTER TABLE tester_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tester_downloads_select" ON tester_downloads FOR SELECT TO anon USING (true);
-- Sin policy de INSERT para anon: se crean vía register_tester_download() (abajo)

-- ─────────────────────────────────────────────
-- REVIEWS — reseñas dejadas por los testers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  tester_id   BIGINT REFERENCES testers(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  opinion     TEXT,
  CONSTRAINT reviews_tester_unique UNIQUE (tester_id)
);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews (created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT TO anon USING (true);
-- Sin policy de INSERT/UPDATE para anon: se crean vía submit_tester_review() (abajo)


-- ═════════════════════════════════════════════
-- FUNCIONES (SECURITY DEFINER — bypasean RLS con cuidado, validando dentro)
-- ═════════════════════════════════════════════

-- Crear o actualizar un tester (panel admin)
CREATE OR REPLACE FUNCTION upsert_tester(p_email TEXT, p_name TEXT, p_notes TEXT DEFAULT NULL)
RETURNS testers
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row testers;
BEGIN
  INSERT INTO testers (email, name, notes)
  VALUES (lower(trim(p_email)), p_name, p_notes)
  ON CONFLICT (email) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, testers.name),
        notes = COALESCE(EXCLUDED.notes, testers.notes)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Generar un token de descarga para un tester (panel admin)
CREATE OR REPLACE FUNCTION create_tester_token(p_tester_id BIGINT, p_ttl_hours INT DEFAULT 48)
RETURNS TABLE (token TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  v_token := encode(gen_random_bytes(24), 'hex');
  v_expires := NOW() + make_interval(hours => GREATEST(1, p_ttl_hours));

  INSERT INTO tester_tokens (tester_id, token, expires_at)
  VALUES (p_tester_id, v_token, v_expires);

  RETURN QUERY SELECT v_token, v_expires;
END;
$$;

-- Validar un token (usado por /tester/[token] y por la descarga)
CREATE OR REPLACE FUNCTION validate_tester_token(p_token TEXT)
RETURNS TABLE (ok BOOLEAN, tester_id BIGINT, tester_name TEXT, tester_email TEXT, expires_at TIMESTAMPTZ, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tt tester_tokens;
  v_t testers;
BEGIN
  SELECT * INTO v_tt FROM tester_tokens WHERE token = p_token;

  IF v_tt IS NULL THEN
    RETURN QUERY SELECT false, NULL::BIGINT, NULL::TEXT, NULL::TEXT, NULL::TIMESTAMPTZ, 'not_found';
    RETURN;
  END IF;

  IF v_tt.revoked THEN
    RETURN QUERY SELECT false, v_tt.tester_id, NULL::TEXT, NULL::TEXT, v_tt.expires_at, 'revoked';
    RETURN;
  END IF;

  IF v_tt.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_tt.tester_id, NULL::TEXT, NULL::TEXT, v_tt.expires_at, 'expired';
    RETURN;
  END IF;

  SELECT * INTO v_t FROM testers WHERE id = v_tt.tester_id;

  RETURN QUERY SELECT true, v_tt.tester_id, v_t.name, v_t.email, v_tt.expires_at, NULL::TEXT;
END;
$$;

-- Registrar una descarga (valida el token internamente)
CREATE OR REPLACE FUNCTION register_tester_download(
  p_token TEXT, p_file_type TEXT, p_ip_hash TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (ok BOOLEAN, reason TEXT, tester_id BIGINT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_valid RECORD;
BEGIN
  SELECT * INTO v_valid FROM validate_tester_token(p_token);

  IF NOT v_valid.ok THEN
    RETURN QUERY SELECT false, v_valid.reason, v_valid.tester_id;
    RETURN;
  END IF;

  INSERT INTO tester_downloads (tester_id, file_type, ip_hash, user_agent)
  VALUES (v_valid.tester_id, p_file_type, p_ip_hash, p_user_agent);

  RETURN QUERY SELECT true, NULL::TEXT, v_valid.tester_id;
END;
$$;

-- Guardar/actualizar la reseña de un tester (valida que el token exista,
-- pero admite tokens ya caducados: la reseña sigue teniendo valor)
CREATE OR REPLACE FUNCTION submit_tester_review(
  p_token TEXT, p_name TEXT, p_email TEXT, p_rating INT, p_opinion TEXT
)
RETURNS TABLE (ok BOOLEAN, reason TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tt tester_tokens;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RETURN QUERY SELECT false, 'invalid_rating';
    RETURN;
  END IF;

  SELECT * INTO v_tt FROM tester_tokens WHERE token = p_token;

  IF v_tt IS NULL OR v_tt.revoked THEN
    RETURN QUERY SELECT false, 'not_found';
    RETURN;
  END IF;

  INSERT INTO reviews (tester_id, name, email, rating, opinion)
  VALUES (v_tt.tester_id, p_name, p_email, p_rating, p_opinion)
  ON CONFLICT (tester_id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        rating = EXCLUDED.rating,
        opinion = EXCLUDED.opinion,
        created_at = NOW();

  RETURN QUERY SELECT true, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_tester(TEXT, TEXT, TEXT)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_tester_token(BIGINT, INT)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_tester_token(TEXT)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION register_tester_download(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_tester_review(TEXT, TEXT, TEXT, INT, TEXT) TO anon, authenticated;
