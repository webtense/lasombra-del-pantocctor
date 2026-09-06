import Stripe from 'stripe'
import { unstable_cache } from 'next/cache'

// Precio de reserva SOLO para el caso en que Stripe no esté configurado
// (entorno local sin claves) o la llamada a la API falle. No debe mostrarse
// en producción con Stripe operativo — ahí siempre se usa el precio real
// devuelto por stripe.prices.retrieve().
const FALLBACK_AMOUNT_EUR = 12.99

export interface BookPrice {
  /** Importe en euros, ej. 12.99 */
  amount: number
  /** Importe formateado en es-ES, ej. "12,99 €" */
  formatted: string
  /** true si el precio viene realmente de Stripe (no del fallback) */
  live: boolean
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Stripe(key) as any
}

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
    // Intl usa NBSP ( ) antes del símbolo; normalizamos a espacio normal
    .replace(/ /g, ' ')
}

async function fetchBookPrice(): Promise<BookPrice> {
  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID

  if (!stripe || !priceId) {
    return { amount: FALLBACK_AMOUNT_EUR, formatted: formatEuro(FALLBACK_AMOUNT_EUR), live: false }
  }

  try {
    const price = await stripe.prices.retrieve(priceId)
    const amount = (price.unit_amount ?? FALLBACK_AMOUNT_EUR * 100) / 100
    return { amount, formatted: formatEuro(amount), live: true }
  } catch (err) {
    console.error('[stripe-price] Error al recuperar el precio desde Stripe', err)
    return { amount: FALLBACK_AMOUNT_EUR, formatted: formatEuro(FALLBACK_AMOUNT_EUR), live: false }
  }
}

// Cacheado 1h — evita llamar a Stripe en cada request/render de cada página.
export const getBookPrice = unstable_cache(fetchBookPrice, ['book-price'], {
  revalidate: 3600,
})
