import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

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
        client_email: (event.data.object as Stripe.PaymentIntent).charges.data[0]?.billing_details?.email,
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
