import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import DashboardLogin from '@/components/dashboard/DashboardLogin'
import AudiobookQAClient from '@/components/AudiobookQAClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Revisión audiolibro',
  robots: { index: false, follow: false },
}

// Herramienta interna de QA del audiolibro (no es una pantalla de comprador).
// Mismo patrón de protección que /admin/dashboard: la cookie httpOnly firmada
// (HMAC-SHA256) se verifica AQUÍ, en el servidor, antes de montar nada. Sin
// cookie válida solo se sirve el formulario de login.
//
// Vive bajo /admin y no en /panel a propósito: /panel es lo que ve un
// comprador tras pagar y el premium todavía no está aprobado para vender.
export default async function AdminAudiolibroPage() {
  const token = cookies().get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)

  return valid ? <AudiobookQAClient /> : <DashboardLogin title="Revisión audiolibro" />
}
