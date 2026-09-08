import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { getStripeClient, getStripeSales } from '@/lib/stripe-sales'

export const dynamic = 'force-dynamic'

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function daysAgoUnix(days: number) {
  return Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000)
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

type DashboardStats = {
  total_purchases: number
  purchases_today: number
  downloads_total: number
  downloads_epub: number
  downloads_pdf: number
  downloads_mobi: number
  downloads_audio: number
}

// GET /api/admin/dashboard/summary
//
// Resumen de negocio. Cada cifra viene de su fuente de verdad, nunca de la
// tabla `events`:
//
//   · nº de compras entregadas → tabla `purchases` de Supabase, leída con la
//     RPC get_dashboard_stats() (SECURITY DEFINER: `purchases` tiene RLS activo
//     y cero policies, la anon key no puede hacer SELECT directo).
//   · ingresos y ticket medio   → Stripe (checkout sessions payment_status=paid).
//     El precio NO se guarda en `purchases`, así que Stripe es la única fuente.
//   · testers / reseñas / visitas → sus propias tablas de Supabase.
//
// Antes esto se calculaba contando filas de events con event_type='purchase' y
// sumando event_data.amount: una contabilidad paralela, alimentada solo si el
// navegador del comprador conseguía disparar el evento, y por tanto siempre
// desincronizada de Stripe y de purchases.
export async function GET() {
  const sb = getServerSupabase()
  const stripe = getStripeClient()

  if (!sb) {
    return NextResponse.json({
      configured: false,
      error: 'Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    })
  }

  const since7d = daysAgoIso(7)
  const since30d = daysAgoIso(30)
  const since7dUnix = daysAgoUnix(7)

  const [visits7d, visits30d, statsRes, testersCount, reviewsRes, salesTotal, sales7d] =
    await Promise.all([
      countSince(sb, 'visits', since7d),
      countSince(sb, 'visits', since30d),
      sb.rpc('get_dashboard_stats'),
      countSince(sb, 'testers', '1970-01-01T00:00:00.000Z'),
      sb.from('reviews').select('rating'),
      stripe
        ? getStripeSales(stripe).catch((e) => {
            console.error('[dashboard/summary] stripe total', e instanceof Error ? e.message : e)
            return null
          })
        : Promise.resolve(null),
      stripe
        ? getStripeSales(stripe, since7dUnix).catch((e) => {
            console.error('[dashboard/summary] stripe 7d', e instanceof Error ? e.message : e)
            return null
          })
        : Promise.resolve(null),
    ])

  if (statsRes.error) {
    console.error('[dashboard/summary] get_dashboard_stats', statsRes.error.message)
  }

  // La RPC devuelve TABLE(...), es decir un array con una sola fila.
  const stats = (Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data) as
    | DashboardStats
    | undefined

  const ratings = ((reviewsRes.data as { rating: number }[] | null) || []).map((r) => r.rating)
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  return NextResponse.json({
    configured: true,
    stripeConfigured: !!stripe,
    visits: { last7d: visits7d, last30d: visits30d },
    purchases: {
      // Supabase · tabla purchases (RPC get_dashboard_stats)
      totalCount: stats?.total_purchases ?? null,
      today: stats?.purchases_today ?? null,
      // Stripe · checkout sessions pagadas
      last7d: sales7d?.paidCount ?? null,
      revenueLast7d: sales7d?.revenue ?? null,
      avgPriceLast7d: sales7d?.avgOrderValue ?? null,
      revenueTotal: salesTotal?.revenue ?? null,
      // Mismo concepto que totalCount pero medido en Stripe. Si los dos no
      // cuadran, es que hay cobros que el webhook no llegó a registrar en
      // `purchases` (o sesiones de prueba): merece mirarse, no promediarse.
      stripePaidTotal: salesTotal?.paidCount ?? null,
    },
    downloads: {
      total: stats?.downloads_total ?? null,
      epub: stats?.downloads_epub ?? null,
      pdf: stats?.downloads_pdf ?? null,
      mobi: stats?.downloads_mobi ?? null,
      audio: stats?.downloads_audio ?? null,
    },
    testers: { count: testersCount },
    reviews: { count: ratings.length, avgRating },
    sources: {
      visits: 'supabase:visits',
      purchaseCounts: 'supabase:purchases (rpc get_dashboard_stats)',
      revenue: 'stripe:checkout.sessions (payment_status=paid)',
      downloads: 'supabase:purchase_downloads (rpc get_dashboard_stats)',
    },
    ga4Links: {
      realtime: 'https://analytics.google.com/analytics/web/#/p/realtime/rt-overview',
      acquisition: 'https://analytics.google.com/analytics/web/#/p/reports/reportinghub',
    },
  })
}
