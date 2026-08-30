-- La Sombra del Pantocrátor — captación de la landing /muestra
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql)
--
-- TODO (pendiente de ejecutar en Supabase): esta tabla NO existe todavía en
-- producción. Mientras no se cree, POST /api/muestra-lead responde ok:true
-- (skipped) y el alta queda solo en el log del servidor — igual que el
-- patrón defensivo ya usado en lib/subscribe-newsletter.ts.
--
-- Se mantiene separada de `leads` (que solo guarda email, ver
-- supabase-schema.sql) porque el formulario de /muestra pide también el
-- nombre y el origen es siempre esa página de muestra gratuita.

CREATE TABLE IF NOT EXISTS newsletter_muestra (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  session_id  TEXT,
  CONSTRAINT newsletter_muestra_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS newsletter_muestra_created_at_idx ON newsletter_muestra (created_at DESC);

ALTER TABLE newsletter_muestra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_muestra_insert" ON newsletter_muestra FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "newsletter_muestra_select" ON newsletter_muestra FOR SELECT TO anon USING (true);
