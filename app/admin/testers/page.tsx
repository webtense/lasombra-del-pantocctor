import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import DashboardLogin from '@/components/dashboard/DashboardLogin'
import AdminTestersClient from '@/components/admin/AdminTestersClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Testers',
  robots: { index: false, follow: false },
}

// Mismo patrón que /admin y /admin/dashboard: sin cookie httpOnly válida solo
// se sirve el formulario de login. Además, las rutas que este panel consume
// (/api/admin/testers y /api/admin/testers/link) verifican la sesión por su
// cuenta, así que la protección no depende de la pantalla.
export default async function AdminTestersPage() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  return valid ? <AdminTestersClient /> : <DashboardLogin title="Testers" />
}
