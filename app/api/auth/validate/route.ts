import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthToken, AUTH_SESSION_COOKIE } from '@/lib/auth-session'

export const dynamic = 'force-dynamic'

/**
 * Valida la sesión del usuario basándose en el JWT cookie.
 * Usado por Server Components para proteger páginas.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_SESSION_COOKIE)?.value

    const { valid, email, purchaseId } = await verifyAuthToken(token)

    if (!valid) {
      return NextResponse.json(
        { ok: false, error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      email,
      purchaseId,
    })
  } catch (error) {
    console.error('[auth/validate] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'Error interno' },
      { status: 500 }
    )
  }
}
