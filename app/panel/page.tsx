import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyAuthToken, AUTH_SESSION_COOKIE } from '@/lib/auth-session'
import AudiobookPlayer from '@/components/AudiobookPlayer'

/**
 * Panel protegido post-login.
 * Server Component que valida la sesión antes de renderizar.
 * Si no autenticado → redirect a /login
 * Si autenticado → muestra el reproductor AudioPlayer
 */
export default async function PanelPage() {
  // 1. Obtener token de cookies
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value

  // 2. Validar token
  const { valid, email, purchaseId } = await verifyAuthToken(token)

  // 3. Si no es válido → redirigir a login
  if (!valid) {
    redirect('/login')
  }

  // 4. Si es válido → renderizar reproductor
  return <AudiobookPlayer />
}
