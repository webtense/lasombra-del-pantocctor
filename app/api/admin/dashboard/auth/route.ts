import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// Mismas credenciales que el panel /admin legacy (ADMIN_USERNAME/ADMIN_PASSWORD)
// pero aquí, si son correctas, se emite una cookie httpOnly firmada en vez de
// solo devolver { ok: true } para que el cliente la guarde en sessionStorage.
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    const correctUser = process.env.ADMIN_USERNAME || 'asanchez'
    const correctPass = process.env.ADMIN_PASSWORD || '3802Mario!'

    if (username !== correctUser || password !== correctPass) {
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const { token, maxAgeSeconds } = await createSessionToken(username)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Petición inválida' }, { status: 400 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
