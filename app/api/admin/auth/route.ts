import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const correctUser = process.env.ADMIN_USERNAME || 'asanchez'
    const correctPass = process.env.ADMIN_PASSWORD || '3802Mario!'

    if (username === correctUser && password === correctPass) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: 'Credenciales incorrectas' }, { status: 401 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
