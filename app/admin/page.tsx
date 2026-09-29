import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import DashboardLogin from '@/components/dashboard/DashboardLogin'
import AdminPanelClient from '@/components/admin/AdminPanelClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Panel Admin',
  robots: { index: false, follow: false },
}

// Server Component: la protección real ocurre AQUÍ, leyendo la cookie httpOnly
// firmada en el servidor. Antes esta página era un Client Component que
// decidía con un flag en sessionStorage — el contenido y las consultas a
// Supabase se montaban en el navegador y bastaba con poner ese flag a mano.
export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  return valid ? <AdminPanelClient /> : <DashboardLogin title="Panel Admin" />
}
