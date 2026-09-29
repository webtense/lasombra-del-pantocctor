import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  return new Stripe(key) as unknown as Stripe
}

// GET /api/admin/dashboard/stripe
// Últimas transacciones reales de Stripe (checkout sessions completadas) +
// ingresos totales y ticket medio, para el resumen de negocio y el CAC/LTV
// de marketing.
export async function GET() {
  const stripe = getStripe()

  if (!stripe) {
    return NextResponse.json({
      configured: false,
      docsUrl: 'https://dashboard.stripe.com/apikeys',
      message: 'STRIPE_SECRET_KEY no configurada o pendiente.',
    })
  }

  try {
    const sessions = await stripe.checkout.sessions.list({ limit: 20 })

    const paid = sessions.data.filter((s) => s.payment_status === 'paid')
    const revenueTotal = paid.reduce((a, s) => a + (s.amount_total || 0), 0)
    const avgOrderValue = paid.length > 0 ? revenueTotal / paid.length : 0

    const transactions = sessions.data.map((s) => ({
      id: s.id,
      created: s.created ? new Date(s.created * 1000).toISOString() : null,
      status: s.payment_status,
      amount: (s.amount_total || 0) / 100,
      currency: s.currency,
      customerEmail: s.customer_details?.email || null,
    }))

    return NextResponse.json({
      configured: true,
      revenueTotal: revenueTotal / 100,
      avgOrderValue: avgOrderValue / 100,
      paidCount: paid.length,
      transactions,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe'
    console.error('[dashboard/stripe]', msg)
    return NextResponse.json({ configured: true, error: msg, transactions: [] }, { status: 500 })
  }
}
