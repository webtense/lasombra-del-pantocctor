-- La Sombra del Pantocrátor — Tracking manual de Instagram
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql)
--
-- Tabla para anotar posts de Instagram a mano (URL, fecha, caption y
-- métricas esperadas) mientras no está conectada la Instagram Graph API,
-- o como registro paralelo aunque sí lo esté. Mismo criterio de acceso
-- que marketing_campaigns: sin datos sensibles, protegido por la cookie
-- de sesión de /admin/dashboard (ver middleware.ts), no por RLS granular.

CREATE TABLE IF NOT EXISTS instagram_manual_posts (
  id                 BIGSERIAL PRIMARY KEY,
  created_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  url                TEXT NOT NULL,
  fecha              DATE NOT NULL,
  caption            TEXT,
  likes_esperados    INTEGER,
  comments_esperados INTEGER,
  saves_esperados    INTEGER,
  notas              TEXT
);

CREATE INDEX IF NOT EXISTS instagram_manual_posts_fecha_idx ON instagram_manual_posts (fecha);

ALTER TABLE instagram_manual_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instagram_manual_posts_select" ON instagram_manual_posts FOR SELECT TO anon USING (true);
CREATE POLICY "instagram_manual_posts_insert" ON instagram_manual_posts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "instagram_manual_posts_update" ON instagram_manual_posts FOR UPDATE TO anon USING (true);
CREATE POLICY "instagram_manual_posts_delete" ON instagram_manual_posts FOR DELETE TO anon USING (true);
