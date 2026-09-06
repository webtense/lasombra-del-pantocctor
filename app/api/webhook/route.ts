import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getServerSupabase } from '@/lib/supabase'
import { createDownloadToken } from '@/lib/download-token'
import { sendPurchaseEmail } from '@/lib/brevo'
import { generatePassword, hashPassword } from '@/lib/auth-password-helper'

// scrypt (hash de la contraseña) requiere Node runtime, no Edge.
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

const PURCHASE_FORMATS = ['epub', 'pdf', 'mobi', 'audio_m4b'] as const

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return

  const email = session.customer_details?.email || session.customer_email
  if (!email) {
    console.warn('[webhook] checkout.session.completed sin email, no se puede entregar', session.id)
    return
  }

  const sb = getServerSupabase()
  if (!sb) {
    console.error('[webhook] Supabase no configurado — no se puede registrar la compra', session.id)
    return
  }

  const { data: purchaseRow, error: registerError } = await sb.rpc('register_purchase', {
    p_stripe_session_id: session.id,
    p_email: email,
    p_formats: PURCHASE_FORMATS,
  })
  if (registerError) {
    console.error('[webhook] register_purchase error', registerError)
    return
  }

  const purchase = Array.isArray(purchaseRow) ? purchaseRow[0] : purchaseRow
  const purchaseId: number | undefined = purchase?.id

  // Idempotencia: si Stripe reintenta el mismo evento, esto devuelve false
  // la segunda vez y no se reenvía el email.
  const { data: shouldSend, error: markError } = await sb.rpc('try_mark_purchase_email_sent', {
    p_stripe_session_id: session.id,
  })
  if (markError) {
    console.error('[webhook] try_mark_purchase_email_sent error', markError)
    return
  }
  if (!shouldSend) {
    console.log('[webhook] email de compra ya enviado antes, se omite', session.id)
    return
  }

  // Crear las credenciales de acceso a /panel. Va DESPUÉS del compare-and-set
  // de arriba, así que un reintento de Stripe ni regenera la contraseña ni
  // reenvía el email. register_user_login es además idempotente por email:
  // si el comprador ya tenía login (recompra), devuelve false y NO pisa su
  // contraseña — en ese caso el email no promete una contraseña nueva.
  let panelPassword: string | null = null
  if (purchaseId) {
    const generated = generatePassword()
    const { data: created, error: loginError } = await sb.rpc('register_user_login', {
      p_email: email,
      p_password_hash: hashPassword(generated),
      p_purchase_id: purchaseId,
    })
    if (loginError) {
      console.error('[webhook] register_user_login error', loginError)
    } else if (created) {
      panelPassword = generated
    } else {
      console.log('[webhook] el comprador ya tenía login, se conserva su contraseña', email)
    }
  } else {
    console.error('[webhook] register_purchase no devolvió id — sin login para', session.id)
  }

  const { token, expiresAt } = await createDownloadToken({
    sessionId: session.id,
    email,
    formats: [...PURCHASE_FORMATS],
  })

  const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
  const dtoken = encodeURIComponent(token)

  const result = await sendPurchaseEmail({
    toEmail: email,
    toName: session.customer_details?.name || null,
    downloadLinks: {
      epub: `${base}/api/download/epub?dtoken=${dtoken}`,
      pdf: `${base}/api/download/pdf?dtoken=${dtoken}`,
      mobi: `${base}/api/download/mobi?dtoken=${dtoken}`,
      audio_m4b: `${base}/api/download/audio_m4b?dtoken=${dtoken}`,
    },
    expiresAt,
    panelUrl: `${base}/login`,
    panelEmail: email,
    panelPassword,
  })

  if (!result.sent) {
    console.warn('[webhook] email de compra no enviado', session.id, result.error)
  } else {
    console.log('✅ Email de compra enviado a', email, session.id)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Manejar eventos de pago
  switch (event.type) {
    case 'checkout.session.completed':
      try {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      } catch (err) {
        console.error('[webhook] error procesando checkout.session.completed', err)
      }
      break

    case 'charge.succeeded':
      console.log('✅ Pago recibido:', {
        id: (event.data.object as Stripe.Charge).id,
        amount: (event.data.object as Stripe.Charge).amount,
        email: (event.data.object as Stripe.Charge).billing_details?.email,
      })
      break

    case 'payment_intent.succeeded':
      console.log('✅ Intención de pago exitosa:', {
        id: (event.data.object as Stripe.PaymentIntent).id,
        amount: (event.data.object as Stripe.PaymentIntent).amount,
      })
      break

    case 'payment_intent.payment_failed':
      console.warn('❌ Pago fallido:', (event.data.object as Stripe.PaymentIntent).id)
      break

    default:
      console.log('Evento no manejado:', event.type)
  }

  return Response.json({ received: true })
}
