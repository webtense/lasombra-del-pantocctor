import { NextRequest, NextResponse } from 'next/server'
import { AUTH_SESSION_COOKIE } from '@/lib/auth-session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true })

    // Limpiar la cookie de sesión
    response.cookies.set(AUTH_SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[auth/logout] Error:', error)
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 })
  }
}
