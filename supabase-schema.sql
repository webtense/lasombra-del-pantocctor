-- La Sombra del Pantocrátor — Supabase schema
-- Ejecutar en: Supabase > SQL Editor

-- ─────────────────────────────────────────────
-- VISITS — page views
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_hash     TEXT,
  user_agent  TEXT,
  device_type TEXT,
  country     TEXT,
  page        TEXT,
  referrer    TEXT,
  session_id  TEXT
);

CREATE INDEX IF NOT EXISTS visits_created_at_idx ON visits (created_at DESC);
CREATE INDEX IF NOT EXISTS visits_page_idx        ON visits (page);
CREATE INDEX IF NOT EXISTS visits_session_idx     ON visits (session_id);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_insert" ON visits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "visits_select" ON visits FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- EVENTS — acciones de usuario
-- event_type: 'download_epub' | 'download_audio' | 'listen_sample'
--             | 'play_start' | 'chapter_start' | 'chapter_complete'
--             | 'purchase'
-- event_data: { chapter_idx, chapter_title, progress_pct, file_type, amount }
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
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

CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_type_idx       ON events (event_type);
CREATE INDEX IF NOT EXISTS events_session_idx    ON events (session_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_insert" ON events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "events_select" ON events FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────
-- LEADS — emails capturados
-- source: 'amazon_notify' | 'newsletter'
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  email       TEXT NOT NULL,
  source      TEXT,
  session_id  TEXT,
  CONSTRAINT leads_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_source_idx     ON leads (source);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_insert" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "leads_select" ON leads FOR SELECT TO anon USING (true);

-- Limpieza opcional: mantener últimos 180 días en visits/events
-- DELETE FROM visits WHERE created_at < NOW() - INTERVAL '180 days';
-- DELETE FROM events  WHERE created_at < NOW() - INTERVAL '180 days';
