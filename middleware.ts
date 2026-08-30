import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'

// Protege /admin/dashboard y su API. La verificación ocurre en el servidor
// (Edge middleware) antes de que la petición llegue a la página o a la
// Route Handler — un cliente no puede saltarse esto manipulando JS/DOM,
// a diferencia del panel /admin legacy (sessionStorage).
export async function middleware(req: NextRequest) {
  const isApi = req.nextUrl.pathname.startsWith('/api/admin/dashboard')
  // El propio endpoint de login/logout no requiere sesión previa
  if (req.nextUrl.pathname === '/api/admin/dashboard/auth') {
    return NextResponse.next()
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  if (valid) return NextResponse.next()

  if (isApi) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // La página /admin/dashboard es un Server Component que, sin cookie
  // válida, renderiza el formulario de login (ver app/admin/dashboard/page.tsx).
  // No hace falta redirigir: dejamos pasar y es la propia página quien decide.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/dashboard/:path*'],
}
