import Stripe from 'stripe'

// Fuente única de las cifras de venta reales.
//
// El importe cobrado NO está en Supabase: la tabla `purchases` solo guarda
// stripe_session_id / email / formats / expires_at, nunca el precio. Por eso
// cualquier cifra en euros tiene que salir de Stripe, y el recuento de compras
// entregadas de `purchases` (vía RPC get_dashboard_stats, porque la tabla no
// tiene policy de SELECT para la anon key).

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  return new Stripe(key) as unknown as Stripe
}

export type StripeSales = {
  /** Checkout sessions con payment_status === 'paid' en la ventana pedida. */
  paidCount: number
  /** Suma de amount_total de esas sesiones, en euros. */
  revenue: number
  /** Ticket medio en euros. 0 si no hay ninguna sesión pagada. */
  avgOrderValue: number
}

const EMPTY_SALES: StripeSales = { paidCount: 0, revenue: 0, avgOrderValue: 0 }

// Tope de sesiones a recorrer. Stripe pagina de 100 en 100; con un catálogo de
// un solo libro esto cubre de sobra el histórico y evita que el dashboard se
// quede colgado paginando si algún día crece mucho.
const MAX_SESSIONS = 1000

/**
 * Agrega las checkout sessions pagadas de Stripe.
 * @param sinceUnix timestamp UNIX (segundos); si se omite, cuenta el histórico completo.
 */
export async function getStripeSales(stripe: Stripe, sinceUnix?: number): Promise<StripeSales> {
  const params: Stripe.Checkout.SessionListParams = { limit: 100 }
  if (sinceUnix !== undefined) params.created = { gte: sinceUnix }

  const sessions = await stripe.checkout.sessions
    .list(params)
    .autoPagingToArray({ limit: MAX_SESSIONS })

  const paid = sessions.filter((s) => s.payment_status === 'paid')
  if (paid.length === 0) return EMPTY_SALES

  const cents = paid.reduce((a, s) => a + (s.amount_total || 0), 0)
  return {
    paidCount: paid.length,
    revenue: cents / 100,
    avgOrderValue: cents / paid.length / 100,
  }
}
