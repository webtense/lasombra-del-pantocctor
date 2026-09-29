// Sesión JWT para acceso post-pago (/escuchar, descargas, etc).
//
// Similar a admin-session.ts pero con JWT en lugar de HMAC simple.
// El servidor firma con HS256 (HMAC-SHA256) y el cliente almacena en
// cookie httpOnly. Cada request valida el token en middleware antes de
// permitir acceso a recursos restringidos.
//
// Campos del token: { email, purchase_id, iat, exp }
// — email: correo del usuario autenticado
// — purchase_id: id de la compra en Supabase (para audit y revoke)
// — iat: issued at (timestamp)
// — exp: expiration (timestamp)

export const AUTH_SESSION_COOKIE = 'lsp_auth_token'
const AUTH_SESSION_TTL_HOURS = 72 // 3 días

interface JWTPayload {
  email: string
  purchase_id: number
  iat: number
  exp: number
}

// Fail-closed: AUTH_SESSION_SECRET es OBLIGATORIO. Antes caía en cascada a
// ADMIN_PASSWORD y, en última instancia, a un literal en el repo. La variable
// solo estaba puesta en Production, así que TODO despliegue de Preview firmaba
// las sesiones de comprador con la contraseña de admin o con el literal —
// cualquiera con acceso al código podía forjar una cookie lsp_auth_token
// válida y entrar en /panel. Ahora, si la variable no está puesta, se lanza:
// mejor que el despliegue falle de forma visible a que funcione en silencio
// con un secreto conocido.
function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret) {
    throw new Error(
      'AUTH_SESSION_SECRET no está configurado: la sesión de comprador no puede firmarse ni verificarse'
    )
  }
  return secret
}

// true si el entorno puede emitir sesiones de comprador. /api/auth/login la
// consulta para devolver un 500 explícito en vez de reventar dentro del try
// después de haber validado ya la contraseña.
export function isAuthSessionConfigured(): boolean {
  return Boolean(process.env.AUTH_SESSION_SECRET)
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

export async function createAuthToken(
  email: string,
  purchaseId: number
): Promise<{ token: string; maxAgeSeconds: number }> {
  const maxAgeSeconds = AUTH_SESSION_TTL_HOURS * 3600
  const now = Math.floor(Date.now() / 1000)
  const exp = now + maxAgeSeconds

  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JWTPayload = { email, purchase_id: purchaseId, iat: now, exp }

  const encoder = new TextEncoder()
  const headerEncoded = toBase64Url(encoder.encode(JSON.stringify(header)).buffer as ArrayBuffer)
  const payloadEncoded = toBase64Url(encoder.encode(JSON.stringify(payload)).buffer as ArrayBuffer)
  const headerPayload = `${headerEncoded}.${payloadEncoded}`

  const key = await getKey()
  const sigBuf = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(headerPayload)
  )
  const signature = toBase64Url(sigBuf)

  const token = `${headerPayload}.${signature}`
  return { token, maxAgeSeconds }
}

export async function verifyAuthToken(
  token: string | undefined | null
): Promise<{ valid: boolean; email?: string; purchaseId?: number }> {
  if (!token) return { valid: false }

  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false }

  try {
    const [headerB64, payloadB64, sigB64] = parts
    const payloadBytes = fromBase64Url(payloadB64)
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as JWTPayload

    // Validar expiración
    const now = Math.floor(Date.now() / 1000)
    if (now > payload.exp) return { valid: false }

    // Validar firma
    const sigBytes = fromBase64Url(sigB64)
    const headerPayload = `${headerB64}.${payloadB64}`
    const encoder = new TextEncoder()
    const key = await getKey()
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      encoder.encode(headerPayload)
    )

    if (!ok) return { valid: false }

    return {
      valid: true,
      email: payload.email,
      purchaseId: payload.purchase_id,
    }
  } catch {
    // Cubre también el throw de getSecret(): sin AUTH_SESSION_SECRET ninguna
    // sesión se da por válida (fail-closed), en lugar de aceptar tokens
    // firmados con el secreto por defecto de antes.
    return { valid: false }
  }
}
