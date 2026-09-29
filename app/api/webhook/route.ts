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

  // ───────────────────────────────────────────────────────────────────────
  // Entrega: reserva (claim) → credenciales → email → confirmar o revertir
  //
  // Antes se marcaba email_sent = true ANTES de llamar a Brevo. Si Brevo
  // fallaba (hoy devuelve 401 por IP no autorizada) el flag ya estaba puesto,
  // el reintento de Stripe salía por el return temprano y register_user_login
  // (ON CONFLICT DO NOTHING) no regeneraba la contraseña: comprador con login
  // creado, sin contraseña, sin email y sin recuperación posible.
  //
  // Estrategia elegida: claim + revert.
  //   1) try_mark_purchase_email_sent() sigue siendo el compare-and-set, pero
  //      ahora se lee como "reservo el envío", no como "ya lo he enviado". Es
  //      atómico en Postgres (UPDATE ... WHERE email_sent = false), así que dos
  //      entregas concurrentes del mismo evento de Stripe siguen sin poder
  //      enviar dos emails: solo una se lleva la reserva.
  //   2) Si Brevo confirma el envío, el flag se queda a true y ya no se vuelve
  //      a enviar nunca.
  //   3) Si Brevo falla, se revierte a false para que el siguiente reintento
  //      de Stripe (o una reejecución manual del evento) vuelva a intentarlo.
  //
  // Riesgo residual asumido: si Brevo entregó el email pero la respuesta HTTP
  // se perdió, se revierte y el reintento envía un email duplicado. Se prefiere
  // un email duplicado a un comprador sin contraseña y sin vía de recuperación.
  // ───────────────────────────────────────────────────────────────────────
  const { data: claimed, error: claimError } = await sb.rpc('try_mark_purchase_email_sent', {
    p_stripe_session_id: session.id,
  })
  if (claimError) {
    console.error('[webhook] try_mark_purchase_email_sent error', claimError)
    return
  }
  if (!claimed) {
    console.log('[webhook] email de compra ya enviado antes, se omite', session.id)
    return
  }

  // A partir de aquí la reserva es nuestra: cualquier salida sin email enviado
  // TIENE que revertirla, o el comprador se queda sin entrega.
  const releaseClaim = async (motivo: string) => {
    const { error } = await sb.rpc('reset_purchase_email_sent', {
      p_stripe_session_id: session.id,
    })
    if (error) {
      console.error(
        '[webhook] 🔴 NO se pudo revertir email_sent tras fallo de envío —',
        'el comprador queda sin email hasta intervención manual.',
        session.id, motivo, error
      )
    } else {
      console.warn('[webhook] email_sent revertido, el reintento de Stripe volverá a enviarlo', session.id, motivo)
    }
  }

  // Credenciales de acceso a /panel. Va después de la reserva (así un
  // reintento que no la consigue no toca nada), pero antes del email porque
  // la contraseña viaja dentro.
  //
  // register_or_reset_user_login SÍ regenera la contraseña cuando la fila
  // existente es de ESTA misma compra — que es justo el caso del reintento
  // tras un envío fallido. Para un cliente recurrente (fila de otra compra
  // anterior) devuelve false y NO pisa su contraseña.
  let panelPassword: string | null = null
  if (purchaseId) {
    const generated = generatePassword()
    const passwordHash = hashPassword(generated)
    let { data: created, error: loginError } = await sb.rpc('register_or_reset_user_login', {
      p_email: email,
      p_password_hash: passwordHash,
      p_purchase_id: purchaseId,
    })

    // Fallback mientras SQL_FIXES_PENDIENTE_EJECUTAR.sql no se haya ejecutado
    // en Supabase: la función nueva todavía no existe (PostgREST PGRST202).
    if (loginError && (loginError as { code?: string }).code === 'PGRST202') {
      console.warn('[webhook] register_or_reset_user_login no existe todavía — usando register_user_login (ejecutar SQL_FIXES_PENDIENTE_EJECUTAR.sql)')
      const legacy = await sb.rpc('register_user_login', {
        p_email: email,
        p_password_hash: passwordHash,
        p_purchase_id: purchaseId,
      })
      created = legacy.data
      loginError = legacy.error
    }

    if (loginError) {
      console.error('[webhook] register_or_reset_user_login error', loginError)
    } else if (created) {
      panelPassword = generated
    } else {
      console.log('[webhook] el comprador ya tenía login de otra compra, se conserva su contraseña', email)
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

  let result: { sent: boolean; error?: string }
  try {
    result = await sendPurchaseEmail({
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
  } catch (err) {
    result = { sent: false, error: err instanceof Error ? err.message : 'excepción desconocida' }
  }

  if (!result.sent) {
    console.warn('[webhook] email de compra NO enviado', session.id, result.error)
    await releaseClaim(result.error || 'envío fallido')
    return
  }

  console.log('✅ Email de compra enviado a', email, session.id)
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
