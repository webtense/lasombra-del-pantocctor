import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Stripe se inicializa en cada request para evitar error en build
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key === 'PENDIENTE_CLAVE_SECRETA') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(key) as any
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: 'Pago no disponible — Stripe pendiente de configurar' }, { status: 503 })
    }

    const { priceId, successUrl, cancelUrl } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_ID || '',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'}/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'}/descargar`,
      locale: 'es',
      metadata: {
        product: 'La Sombra del Pantocrátor — Ebook + Audiolibro',
      },
      // Después del pago, el usuario recibe email automático con links de descarga
      payment_intent_data: {
        metadata: {
          book: 'lsp-v3',
        },
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    console.error('[create-checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
