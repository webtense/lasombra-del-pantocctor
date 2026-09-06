import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSupabase } from '@/lib/supabase'
import { createDownloadToken } from '@/lib/download-token'

export const dynamic = 'force-dynamic'

const PURCHASE_FORMATS = ['epub', 'pdf', 'mobi', 'audio_m4b']

// Registra la compra (idempotente) y devuelve un dtoken válido para
// /api/download/[file]. Se llama tanto si el webhook ya procesó la compra
// como si no (register_purchase hace upsert por stripe_session_id) — así
// /gracias siempre puede construir sus enlaces de descarga aunque el
// webhook de Stripe todavía no haya llegado.
async function registerPurchaseAndGetToken(sessionId: string, email: string): Promise<string | null> {
  const sb = getServerSupabase()
  if (!sb) return null

  const { error } = await sb.rpc('register_purchase', {
    p_stripe_session_id: sessionId,
    p_email: email,
    p_formats: PURCHASE_FORMATS,
  })
  if (error) {
    console.error('[verify-payment] register_purchase error', error)
    return null
  }

  const { token } = await createDownloadToken({ sessionId, email, formats: PURCHASE_FORMATS })
  return token
}

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
      const email = 'test@test.com'
      const dtoken = await registerPurchaseAndGetToken(sessionId, email)
      return NextResponse.json({ valid: true, customerEmail: email, mode: 'dev', dtoken })
    }
    return NextResponse.json({ valid: false, error: 'Pago no configurado' })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const valid = session.payment_status === 'paid'
    const customerEmail = session.customer_details?.email || null

    let dtoken: string | null = null
    if (valid && customerEmail) {
      dtoken = await registerPurchaseAndGetToken(sessionId, customerEmail)
    }

    return NextResponse.json({
      valid,
      customerEmail,
      amount: session.amount_total,
      dtoken,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Sesión inválida o expirada' })
  }
}
