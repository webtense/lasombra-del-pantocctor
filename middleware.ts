import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'

// Protege todo /admin y las APIs de admin. La verificación ocurre en el
// servidor (Edge middleware) antes de que la petición llegue a la página o a
// la Route Handler — un cliente no puede saltarse esto manipulando JS/DOM,
// a diferencia del panel /admin anterior (flag en sessionStorage).
export async function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith('/api/')
  // Los endpoints de login/logout no requieren sesión previa
  if (
    req.nextUrl.pathname === '/api/admin/dashboard/auth' ||
    req.nextUrl.pathname === '/api/admin/auth'
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  if (valid) return NextResponse.next()

  if (isApi) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Las páginas bajo /admin son Server Components que, sin cookie válida,
  // renderizan el formulario de login. No hace falta redirigir: dejamos pasar
  // y es la propia página quien decide qué servir.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/dashboard/:path*',
    '/api/admin/testers/:path*',
  ],
}
