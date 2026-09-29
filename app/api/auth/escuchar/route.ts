import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    const correctPassword = process.env.ESCUCHAR_PASSWORD
    if (!correctPassword) {
      console.error('[auth/escuchar] ESCUCHAR_PASSWORD no configurada en el entorno')
      return NextResponse.json({ ok: false, error: 'Acceso no disponible' }, { status: 503 })
    }

    if (typeof password === 'string' && password === correctPassword) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Contraseña incorrecta' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Petición inválida' }, { status: 400 })
  }
}
