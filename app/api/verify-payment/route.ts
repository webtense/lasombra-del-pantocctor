import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  return new Stripe(key) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ valid: false, error: 'Sin session_id' })
  }

  const stripe = getStripe()
  if (!stripe) {
    // Stripe no configurado → en desarrollo/test permitir acceso con session_id de prueba
    if (sessionId.startsWith('cs_test_') || sessionId === 'test') {
      return NextResponse.json({ valid: true, customerEmail: 'test@test.com', mode: 'dev' })
    }
    return NextResponse.json({ valid: false, error: 'Pago no configurado' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const valid = session.payment_status === 'paid'
    return NextResponse.json({
      valid,
      customerEmail: session.customer_details?.email || null,
      amount: session.amount_total,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Sesión inválida o expirada' })
  }
}
