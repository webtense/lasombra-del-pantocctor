import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { hasValidAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard/analytics
//
// Analítica de audiencia y embudo para la pestaña "Analítica" del dashboard.
// Todo sale de datos YA instrumentados: `visits` (POST /api/track en cada
// cambio de ruta) y `events` (POST /api/event). No añade tracking nuevo.
//
// ── DECISIÓN: consulta directa, no RPC ──────────────────────────────────────
// `visits` y `events` tienen policy de SELECT abierta para anon
// (supabase-schema.sql), así que el servidor puede leerlas con la anon key sin
// DDL de por medio. Se agregan aquí en TypeScript en vez de en una función
// SQL: una RPC sería más eficiente, pero obligaría a ejecutar DDL en Supabase
// antes de que la pestaña mostrara NADA, y a mantener la lógica de agregación
// lejos del código que la consume.
//
// La única excepción es `purchases`: tiene RLS activo y CERO policies a
// propósito (guarda emails de comprador), así que la anon key no puede ni
// contarla. Para eso sí hace falta una función SECURITY DEFINER — ver
// supabase-schema-analytics.sql. Mientras no se ejecute, se cae a la RPC ya
// desplegada get_dashboard_stats(), que da el total histórico pero no acotado
// al rango; el endpoint lo indica en `funnel.purchasesScope` para que la UI no
// presente un número de otro periodo como si fuera del rango pedido.
//
// ── LO QUE ESTOS DATOS *NO* SON ─────────────────────────────────────────────
// Es telemetría de primera parte, no GA4: un adblocker, un cierre de pestaña
// antes del fetch o el JS desactivado hacen que la visita no se registre. Sirve
// para tendencias y proporciones, no como recuento contable.
// ─────────────────────────────────────────────────────────────────────────────

const RANGE_DAYS = 30
const TOP_N = 10

// PostgREST corta en 1000 filas por petición y no sabe hacer GROUP BY, así que
// las filas de visitas se traen paginadas. El tope evita que un pico de tráfico
// (o un bot) convierta esta ruta en cientos de round-trips: si se alcanza, se
// devuelve `truncated: true` y la UI lo dice, en vez de mentir por lo bajo.
const PAGE_SIZE = 1000
const MAX_ROWS = 50000

type VisitRow = {
  created_at: string
  page: string | null
  referrer: string | null
  device_type: string | null
  country: string | null
  ip_hash: string | null
  session_id: string | null
}

type EventDataRow = { event_data: Record<string, unknown> | null }

type Bucket = { label: string; count: number }

// Las fechas se agrupan en horario de Madrid, no en UTC: el servidor corre en
// UTC y bucketear ahí manda el tráfico de la tarde-noche española al día
// siguiente, que es justo cuando más se lee.
const MADRID_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function dayKey(iso: string): string {
  return MADRID_DAY.format(new Date(iso))
}

// Los días del eje X se generan anclando a las 12:00 UTC (13:00/14:00 en
// Madrid): así un salto de horario de verano nunca hace que restar 24 h cruce
// una frontera de día y se pierda o duplique una fecha.
function rangeDays(days: number): string[] {
  const anchor = new Date()
  anchor.setUTCHours(12, 0, 0, 0)
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    out.push(dayKey(new Date(anchor.getTime() - i * 86400000).toISOString()))
  }
  return out
}

function topBuckets(values: string[], n: number): Bucket[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)
  // Array.from y no spread: el target de tsconfig no permite iterar un
  // MapIterator sin downlevelIteration.
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([label, count]) => ({ label, count }))
}

// Un referrer completo con querystring haría que cada URL fuese su propia fila
// y el top 10 no diría nada. Se reduce a host: es lo que se quiere saber
// ("de dónde viene la gente"), y de paso quita los utm_* de la vista.
function referrerLabel(raw: string | null): string {
  const value = (raw || '').trim()
  if (!value) return 'Directo'
  try {
    return new URL(value).hostname.replace(/^www\./, '') || 'Directo'
  } catch {
    return value.slice(0, 60)
  }
}

async function fetchAllVisits(
  sb: NonNullable<ReturnType<typeof getServerSupabase>>,
  since: string
): Promise<{ rows: VisitRow[]; truncated: boolean }> {
  const rows: VisitRow[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await sb
      .from('visits')
      .select('created_at, page, referrer, device_type, country, ip_hash, session_id')
      // Ascendente a propósito: las visitas nuevas que entren mientras se
      // pagina se añaden al final y no desplazan las páginas ya leídas.
      .order('created_at', { ascending: true })
      .gte('created_at', since)
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`visits: ${error.message}`)
    const batch = (data as VisitRow[] | null) || []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) return { rows, truncated: false }
  }
  return { rows, truncated: true }
}

async function fetchEventData(
  sb: NonNullable<ReturnType<typeof getServerSupabase>>,
  since: string,
  eventType: string
): Promise<EventDataRow[]> {
  const rows: EventDataRow[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await sb
      .from('events')
      .select('event_data')
      .eq('event_type', eventType)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`events(${eventType}): ${error.message}`)
    const batch = (data as EventDataRow[] | null) || []
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) return rows
  }
  return rows
}

// Recuento por tipo de evento con head:true — solo viaja el count, no las filas.
async function countEvents(
  sb: NonNullable<ReturnType<typeof getServerSupabase>>,
  since: string,
  types: string[]
): Promise<number> {
  const { count, error } = await sb
    .from('events')
    .select('*', { count: 'exact', head: true })
    .in('event_type', types)
    .gte('created_at', since)
  if (error) throw new Error(`events count ${types.join('/')}: ${error.message}`)
  return count || 0
}

// Compras REALES (tabla purchases), nunca el evento `purchase` de `events`.
// Preferimos get_purchases_since() porque acota al rango; si aún no está
// creada, get_dashboard_stats() da el total histórico y lo marcamos como tal.
async function fetchPurchases(
  sb: NonNullable<ReturnType<typeof getServerSupabase>>,
  since: string
): Promise<{ count: number | null; scope: 'range' | 'total' | 'unavailable' }> {
  const ranged = await sb.rpc('get_purchases_since', { p_since: since })
  if (!ranged.error) {
    const row = (Array.isArray(ranged.data) ? ranged.data[0] : ranged.data) as
      | { purchases_in_range: number }
      | undefined
    if (row) return { count: Number(row.purchases_in_range) || 0, scope: 'range' }
  } else {
    console.error('[dashboard/analytics] get_purchases_since', ranged.error.message)
  }

  const stats = await sb.rpc('get_dashboard_stats')
  if (!stats.error) {
    const row = (Array.isArray(stats.data) ? stats.data[0] : stats.data) as
      | { total_purchases: number }
      | undefined
    if (row) return { count: Number(row.total_purchases) || 0, scope: 'total' }
  } else {
    console.error('[dashboard/analytics] get_dashboard_stats', stats.error.message)
  }

  return { count: null, scope: 'unavailable' }
}

// Cada bloque de datos se pide por separado y su fallo se queda contenido: hoy
// mismo `visits` no existe en el proyecto de Supabase de producción (solo se
// llegó a crear `events`), y sin esto un 404 de esa tabla dejaría también sin
// embudo y sin datos de audiolibro, que sí se pueden leer.
async function attempt<T>(fn: () => Promise<T>): Promise<{ value: T | null; error: string | null }> {
  try {
    return { value: await fn(), error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[dashboard/analytics]', message)
    return { value: null, error: message }
  }
}

// PostgREST devuelve "Could not find the table ... in the schema cache" cuando
// la tabla no existe. Sin traducir, en el dashboard eso no le dice nada a nadie.
function hintFor(error: string | null): string | null {
  if (!error) return null
  if (/schema cache|does not exist/i.test(error)) {
    return 'Esa tabla no existe en el proyecto de Supabase. Falta ejecutar supabase-schema.sql en el SQL Editor.'
  }
  return null
}

export async function GET(req: NextRequest) {
  if (!(await hasValidAdminSession(req))) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({
      configured: false,
      error: 'Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    })
  }

  const since = new Date(Date.now() - RANGE_DAYS * 86400000).toISOString()

  const [visitsA, viewA, interestA, intentA, purchasesA, chapterStartsA, chapterCompletesA] =
    await Promise.all([
      attempt(() => fetchAllVisits(sb, since)),
      attempt(() => countEvents(sb, since, ['view_book', 'view_sample'])),
      attempt(() => countEvents(sb, since, ['listen_sample', 'read_sample'])),
      attempt(() => countEvents(sb, since, ['view_buy_cta'])),
      attempt(() => fetchPurchases(sb, since)),
      attempt(() => fetchEventData(sb, since, 'chapter_start')),
      attempt(() => countEvents(sb, since, ['chapter_complete'])),
    ])

  // ── Visitas ─────────────────────────────────────────────────────────────
  let visits = null
  if (visitsA.value) {
    const { rows, truncated } = visitsA.value

    // Relleno a cero: un día sin tráfico debe verse como un hueco en la
    // gráfica, no desaparecer del eje.
    const perDayCounts = new Map<string, number>()
    for (const r of rows) {
      const k = dayKey(r.created_at)
      perDayCounts.set(k, (perDayCounts.get(k) || 0) + 1)
    }
    const perDay = rangeDays(RANGE_DAYS).map((date) => ({
      date,
      count: perDayCounts.get(date) || 0,
    }))

    visits = {
      total: rows.length,
      truncated,
      perDay,
      uniqueIps: new Set(rows.map((r) => r.ip_hash).filter(Boolean)).size,
      uniqueSessions: new Set(rows.map((r) => r.session_id).filter(Boolean)).size,
      topPages: topBuckets(rows.map((r) => r.page || '/'), TOP_N),
      topReferrers: topBuckets(rows.map((r) => referrerLabel(r.referrer)), TOP_N),
      devices: topBuckets(rows.map((r) => r.device_type || 'desconocido'), TOP_N),
      countries: topBuckets(rows.map((r) => r.country || 'Desconocido'), TOP_N),
    }
  }

  // ── Embudo ──────────────────────────────────────────────────────────────
  const purchases = purchasesA.value || { count: null, scope: 'unavailable' as const }
  const stages = [
    { key: 'view', label: 'Vista', count: viewA.value, source: 'events: view_book · view_sample' },
    { key: 'interest', label: 'Interés', count: interestA.value, source: 'events: listen_sample · read_sample' },
    { key: 'intent', label: 'Intención', count: intentA.value, source: 'events: view_buy_cta' },
    {
      key: 'purchase',
      label: 'Compra',
      count: purchases.count,
      source: purchases.scope === 'range' ? 'tabla purchases (rango)' : 'tabla purchases (total histórico)',
    },
  ]

  // ── Capítulos del audiolibro ────────────────────────────────────────────
  // AudiobookPlayer.tsx emite chapter_start con { chapter_idx, chapter_title,
  // quality }. El campo es `chapter_title`, no `chapter`.
  const chapterLabels = (chapterStartsA.value || [])
    .map((r) => {
      const d = r.event_data
      const title = typeof d?.chapter_title === 'string' ? d.chapter_title.trim() : ''
      if (title) return title
      const idx = d?.chapter_idx
      return idx === undefined || idx === null ? '' : `Capítulo ${idx}`
    })
    .filter(Boolean)

  const eventsError = viewA.error || interestA.error || intentA.error || chapterStartsA.error

  return NextResponse.json({
    configured: true,
    rangeDays: RANGE_DAYS,
    since,
    visits,
    visitsError: visitsA.error,
    visitsHint: hintFor(visitsA.error),
    funnel: {
      stages,
      purchasesScope: purchases.scope,
      error: eventsError,
      hint: hintFor(eventsError),
    },
    audio: {
      topChapters: topBuckets(chapterLabels, TOP_N),
      chapterStarts: chapterStartsA.value?.length ?? null,
      chapterCompletes: chapterCompletesA.value,
      // No se inventa una media: chapter_complete se emite con
      // { chapter_idx, chapter_title, quality } y ningún campo de duración ni
      // marca de tiempo de inicio, así que no hay nada que promediar.
      avgListenSeconds: null,
      avgListenReason:
        'El evento chapter_complete no guarda duración ni instante de inicio (AudiobookPlayer.tsx solo envía chapter_idx, chapter_title y quality), así que no hay dato del que sacar una media.',
    },
  })
}
