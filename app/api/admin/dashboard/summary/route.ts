import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

async function countSince(
  sb: ReturnType<typeof getServerSupabase>,
  table: string,
  since: string,
  extra?: (q: any) => any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  if (!sb) return 0
  let q = sb.from(table).select('*', { count: 'exact', head: true }).gte('created_at', since)
  if (extra) q = extra(q)
  const { count, error } = await q
  if (error) {
    console.error(`[dashboard/summary] count ${table}`, error.message)
    return 0
  }
  return count || 0
}

// GET /api/admin/dashboard/summary
// Resumen de negocio: visitas web, compras directas (vía tabla events —
// ver también /api/admin/dashboard/stripe para las transacciones reales),
// testers inscritos y reseñas recibidas.
export async function GET() {
  const sb = getServerSupabase()

  if (!sb) {
    return NextResponse.json({
      configured: false,
      error: 'Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    })
  }

  const since7d = daysAgoIso(7)
  const since30d = daysAgoIso(30)

  const [
    visits7d,
    visits30d,
    purchaseEvents7d,
    purchaseEventsAll,
    testersCount,
    reviewsRes,
  ] = await Promise.all([
    countSince(sb, 'visits', since7d),
    countSince(sb, 'visits', since30d),
    sb.from('events').select('event_data').eq('event_type', 'purchase').gte('created_at', since7d),
    sb.from('events').select('event_data').eq('event_type', 'purchase'),
    countSince(sb, 'testers', '1970-01-01T00:00:00.000Z'),
    sb.from('reviews').select('rating'),
  ])

  const purchases7dRows = (purchaseEvents7d.data as { event_data: Record<string, unknown> | null }[] | null) || []
  const purchasesAllRows = (purchaseEventsAll.data as { event_data: Record<string, unknown> | null }[] | null) || []

  const amountOf = (row: { event_data: Record<string, unknown> | null }) => {
    const raw = row.event_data?.amount
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : 0
  }

  const revenue7d = purchases7dRows.reduce((a, r) => a + amountOf(r), 0)
  const purchasesCount7d = purchases7dRows.length
  const avgPrice7d = purchasesCount7d > 0 ? revenue7d / purchasesCount7d : 0

  const revenueTotal = purchasesAllRows.reduce((a, r) => a + amountOf(r), 0)
  const purchasesCountTotal = purchasesAllRows.length

  const ratings = ((reviewsRes.data as { rating: number }[] | null) || []).map((r) => r.rating)
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  return NextResponse.json({
    configured: true,
    visits: { last7d: visits7d, last30d: visits30d },
    purchases: {
      last7d: purchasesCount7d,
      revenueLast7d: Math.round(revenue7d) / 100, // amount_data se guarda en céntimos (Stripe)
      avgPriceLast7d: Math.round(avgPrice7d) / 100,
      totalCount: purchasesCountTotal,
      revenueTotal: Math.round(revenueTotal) / 100,
    },
    testers: { count: testersCount },
    reviews: { count: ratings.length, avgRating },
    ga4Links: {
      realtime: 'https://analytics.google.com/analytics/web/#/p/realtime/rt-overview',
      acquisition: 'https://analytics.google.com/analytics/web/#/p/reports/reportinghub',
    },
  })
}
