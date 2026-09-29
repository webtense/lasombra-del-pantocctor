import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import DashboardLogin from '@/components/dashboard/DashboardLogin'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

// Server Component: la protección real ocurre AQUÍ (y en middleware.ts para
// las llamadas a /api/admin/dashboard/*), leyendo la cookie httpOnly en el
// servidor — nunca comprobando una contraseña en el cliente. Sin cookie
// válida, ni siquiera se monta el bundle del dashboard con datos.
export default async function AdminDashboardPage() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  return valid ? <DashboardClient /> : <DashboardLogin />
}
