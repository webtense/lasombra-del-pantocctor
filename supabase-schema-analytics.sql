-- La Sombra del Pantocrátor — Analítica del panel admin (pestaña "Analítica")
-- Ejecutar en: Supabase > SQL Editor (después de supabase-schema.sql y
-- supabase-schema-purchases.sql)
--
-- ─────────────────────────────────────────────────────────────────────────────
-- POR QUÉ ESTE FICHERO ES TAN CORTO
--
-- La pestaña de analítica agrega visitas y eventos, pero NO necesita una RPC
-- para casi nada: `visits` y `events` ya tienen policy de SELECT abierta para
-- anon (ver supabase-schema.sql), así que /api/admin/dashboard/analytics las
-- consulta directamente con la anon key y agrega en TypeScript. Menos piezas,
-- nada de DDL que ejecutar para que la pestaña funcione.
--
-- La ÚNICA excepción es `purchases`: a propósito no tiene ninguna policy
-- (guarda el email del comprador — ver la cabecera de
-- supabase-schema-purchases.sql), así que la anon key no puede contarla ni
-- siquiera con count/head. Y el embudo necesita la compra REAL, no el evento
-- `purchase` de la tabla `events` (que es solo telemetría del navegador y se
-- pierde con un adblocker o un cierre de pestaña).
--
-- Ya existe get_dashboard_stats() (supabase-schema-user-logins.sql), pero solo
-- devuelve el total histórico y las de hoy — no sirve para un embudo acotado a
-- los últimos N días. De ahí esta función.
--
-- MIENTRAS ESTA FUNCIÓN NO SE EJECUTE: la pestaña sigue funcionando. El
-- endpoint detecta que la RPC no existe y cae a get_dashboard_stats(), y la
-- fase de compra del embudo se marca como total histórico en vez de acotada al
-- rango. No hay crash ni pantalla vacía.
-- ─────────────────────────────────────────────────────────────────────────────

-- Recuento de compras reales en una ventana temporal.
-- Devuelve SOLO números — ningún email ni dato personal — para que la anon key
-- no pueda extraer PII por esta vía (mismo criterio que get_dashboard_stats).
CREATE OR REPLACE FUNCTION get_purchases_since(p_since TIMESTAMPTZ)
RETURNS TABLE (
  purchases_in_range BIGINT,
  purchases_total    BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM purchases WHERE created_at >= p_since),
    (SELECT count(*) FROM purchases);
END;
$$;

GRANT EXECUTE ON FUNCTION get_purchases_since(TIMESTAMPTZ) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- ÍNDICES DE APOYO (opcionales pero recomendados)
--
-- El endpoint filtra events por created_at + event_type a la vez. Ya existen
-- índices sueltos sobre cada columna (supabase-schema.sql); este compuesto
-- evita el bitmap-and cuando la tabla crezca.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS events_type_created_at_idx ON events (event_type, created_at DESC);
