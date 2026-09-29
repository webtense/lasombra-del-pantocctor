// Sesión firmada para /admin/dashboard.
//
// A diferencia del panel /admin (legacy), que solo guarda un flag en
// sessionStorage del navegador, aquí la protección la hace el SERVIDOR:
// el login valida usuario/contraseña en una Route Handler y devuelve una
// cookie httpOnly firmada (HMAC-SHA256). Cada request a /admin/dashboard
// y a /api/admin/dashboard/* se verifica en middleware.ts ANTES de tocar
// ningún dato — sin depender de nada que el cliente pueda falsificar.
//
// Usa Web Crypto (crypto.subtle) + atob/btoa en vez de Buffer/node:crypto
// para que la misma función sirva tanto en Route Handlers (Node runtime)
// como en middleware.ts (Edge runtime).

export const SESSION_COOKIE = 'lsp_dashboard_session'
const SESSION_TTL_HOURS = 12

// Fail-closed: ADMIN_SESSION_SECRET es OBLIGATORIO. Antes caía en cascada a
// ADMIN_PASSWORD y, en última instancia, a un literal en el repo — cualquiera
// con acceso al código podía firmar cookies de sesión válidas. Ahora, si la
// variable no está puesta, se lanza: mejor que el despliegue falle de forma
// visible a que funcione en silencio con un secreto conocido.
function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error(
      'ADMIN_SESSION_SECRET no está configurado: la sesión de admin no puede firmarse ni verificarse'
    )
  }
  return secret
}

// true si el entorno tiene todo lo necesario para autenticar a un admin.
// Las rutas de login la consultan para devolver un 500 explícito en vez de
// un 401 genérico (que haría pensar en credenciales mal tecleadas).
export function isAdminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET
  )
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(b64url: string): Uint8Array {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (padded.length % 4)) % 4
  const b64 = padded + '='.repeat(pad)
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(username: string): Promise<{ token: string; maxAgeSeconds: number }> {
  const maxAgeSeconds = SESSION_TTL_HOURS * 3600
  const exp = Date.now() + maxAgeSeconds * 1000
  const payload = `${username}:${exp}`
  const encoder = new TextEncoder()
  const payloadBytes = encoder.encode(payload)
  const key = await getKey()
  const sigBuf = await crypto.subtle.sign('HMAC', key, payloadBytes)
  const token = `${toBase64Url(payloadBytes.buffer as ArrayBuffer)}.${toBase64Url(sigBuf)}`
  return { token, maxAgeSeconds }
}

// Comprueba la cookie de sesión de admin en el propio handler/página.
// Tipado por estructura (no importa next/server) para poder usarse igual con
// el NextRequest de una Route Handler, con cookies() de next/headers en un
// Server Component y con el NextRequest del middleware (runtime Edge).
export async function hasValidAdminSession(source: {
  cookies: { get(name: string): { value: string } | undefined }
}): Promise<boolean> {
  const token = source.cookies.get(SESSION_COOKIE)?.value
  const { valid } = await verifySessionToken(token)
  return valid
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; username?: string }> {
  if (!token) return { valid: false }
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false }

  try {
    const [payloadB64, sigB64] = parts
    const payloadBytes = fromBase64Url(payloadB64)
    const sigBytes = fromBase64Url(sigB64)
    const payload = new TextDecoder().decode(payloadBytes)
    const sep = payload.lastIndexOf(':')
    if (sep === -1) return { valid: false }
    const username = payload.slice(0, sep)
    const exp = Number(payload.slice(sep + 1))
    if (!username || !Number.isFinite(exp) || Date.now() > exp) return { valid: false }

    const key = await getKey()
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    )
    return ok ? { valid: true, username } : { valid: false }
  } catch {
    return { valid: false }
  }
}
