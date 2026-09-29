import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  return new Stripe(key) as unknown as Stripe
}

// GET /api/admin/dashboard/kpis
// CAC, LTV y conversion rate. El gasto en Ads (AD_SPEND_LAST_30D) es una
// variable de servidor a propósito: sin integración de Meta/Google Ads
// todavía, se introduce a mano y no tiene por qué viajar al bundle del
// cliente como NEXT_PUBLIC_*.
export async function GET() {
  const sb = getServerSupabase()
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const visits30d = sb
    ? (await sb.from('visits').select('*', { count: 'exact', head: true }).gte('created_at', since30d)).count || 0
    : null

  const stripe = getStripe()
  let paidCount: number | null = null
  let avgOrderValue: number | null = null

  if (stripe) {
    try {
      const sessions = await stripe.checkout.sessions.list({ limit: 100 })
      const paid = sessions.data.filter((s) => s.payment_status === 'paid')
      paidCount = paid.length
      const revenue = paid.reduce((a, s) => a + (s.amount_total || 0), 0)
      avgOrderValue = paid.length > 0 ? revenue / paid.length / 100 : 0
    } catch (err) {
      console.error('[dashboard/kpis] stripe error', err instanceof Error ? err.message : err)
    }
  }

  const adSpendRaw = process.env.AD_SPEND_LAST_30D
  const adSpend = adSpendRaw ? Number(adSpendRaw) : null
  const cac = adSpend && paidCount ? adSpend / paidCount : null

  const conversionRate = visits30d && paidCount !== null && visits30d > 0 ? paidCount / visits30d : null

  return NextResponse.json({
    stripeConfigured: !!stripe,
    adSpendConfigured: adSpend !== null && Number.isFinite(adSpend),
    visits30d,
    paidCount,
    cac,
    ltv: avgOrderValue,
    conversionRate,
  })
}
