import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, isAdminAuthConfigured } from '@/lib/admin-session'
import { logAdminAction } from '@/lib/admin-audit'

export const dynamic = 'force-dynamic'

// Único punto de login de admin: valida ADMIN_USERNAME/ADMIN_PASSWORD y, si
// son correctos, emite una cookie httpOnly firmada (HMAC-SHA256).
//
// Fail-closed: sin las variables de entorno NO se autentica a nadie. Antes
// había credenciales por defecto en el código ('asanchez' / la contraseña en
// claro), de modo que un despliegue sin configurar quedaba abierto a
// cualquiera que hubiese leído el repositorio.
export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthConfigured()) {
      console.error(
        '[api/admin/dashboard/auth] faltan ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET'
      )
      return NextResponse.json(
        { ok: false, error: 'Autenticación de admin no configurada en el servidor' },
        { status: 500 }
      )
    }

    const { username, password } = await req.json()

    const correctUser = process.env.ADMIN_USERNAME
    const correctPass = process.env.ADMIN_PASSWORD

    // Auditoría: se registra SIEMPRE el intento, acertado o no. Lo que se
    // guarda es el username tecleado — la contraseña no se loguea nunca, ni
    // siquiera parcialmente ni hasheada, para que el log de auditoría no se
    // convierta en un diccionario de contraseñas probadas.
    if (username !== correctUser || password !== correctPass) {
      logAdminAction('login_failed', {
        actor: typeof username === 'string' ? username : '(sin username)',
        details: { reason: username !== correctUser ? 'usuario_incorrecto' : 'password_incorrecta' },
        req,
      })
      return NextResponse.json({ ok: false, error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const { token, maxAgeSeconds } = await createSessionToken(username)
    logAdminAction('login_success', { actor: username, req })
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
