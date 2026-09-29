import { NextRequest, NextResponse } from 'next/server'
import { subscribeToNewsletter } from '@/lib/subscribe-newsletter'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json()

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Email no válido' }, { status: 400 })
    }

    const result = await subscribeToNewsletter({ email, source: typeof source === 'string' ? source : undefined })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error || 'Error al suscribir' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Petición inválida' }, { status: 400 })
  }
}
