-- La Sombra del Pantocrátor — Módulo de campañas de marketing
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql)
--
-- Tabla de planificación simple para /admin/dashboard (pestaña Marketing).
-- Igual que visits/events/leads, no hay datos sensibles aquí (solo
-- planificación interna), así que se permite acceso anon completo desde
-- el servidor de la app (las rutas /api/admin/dashboard/campaigns/* ya
-- están protegidas por cookie de sesión + middleware.ts).

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha        DATE NOT NULL,
  plataforma   TEXT NOT NULL,
  presupuesto  NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'planificada'
               CHECK (estado IN ('planificada', 'en_curso', 'pausada', 'finalizada')),
  notas        TEXT
);

CREATE INDEX IF NOT EXISTS marketing_campaigns_fecha_idx ON marketing_campaigns (fecha);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_campaigns_select" ON marketing_campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "marketing_campaigns_insert" ON marketing_campaigns FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "marketing_campaigns_update" ON marketing_campaigns FOR UPDATE TO anon USING (true);
CREATE POLICY "marketing_campaigns_delete" ON marketing_campaigns FOR DELETE TO anon USING (true);
