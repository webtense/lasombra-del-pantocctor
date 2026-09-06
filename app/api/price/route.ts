import { NextResponse } from 'next/server'
import { getBookPrice } from '@/lib/stripe-price'

// Revalida cada hora — evita que quede servido como estático congelado para siempre.
export const revalidate = 3600

// Endpoint público de solo lectura para que los Client Components (ej. gracias/page.tsx)
// puedan obtener el precio real de Stripe sin hardcodearlo.
export async function GET() {
  const price = await getBookPrice()
  return NextResponse.json(price)
}
