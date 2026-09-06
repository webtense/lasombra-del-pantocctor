// Token de descarga firmado para compradores (post-Stripe).
//
// Igual que lib/admin-session.ts, pero el payload aquí no es solo un
// usuario: es sessionId + email + formats comprados + expiración, para
// que /api/download/[file] pueda validar la compra SIN tener que ir a
// Supabase en cada request (solo lo hace para comprobar `revoked` y el
// límite de 5 descargas — ver register_purchase_download() en
// supabase-schema-purchases.sql). Web Crypto (crypto.subtle) + atob/btoa
// en vez de Buffer/node:crypto para que sirva tanto en Route Handlers
// (Node runtime) como en Edge, igual que admin-session.ts.

const DEFAULT_TTL_DAYS = 3650 // 10 años: el límite real de uso lo pone el
                               // contador de descargas en Supabase, no la
                               // expiración del token.

export type DownloadTokenPayload = {
  sid: string // stripe_session_id
  email: string
  formats: string[]
  exp: number // epoch ms
}

function getSecret(): string {
  return (
    process.env.DOWNLOAD_SECRET ||
    'lsp-download-dev-secret-cambiar-en-produccion'
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

export async function createDownloadToken(params: {
  sessionId: string
  email: string
  formats: string[]
  ttlDays?: number
}): Promise<{ token: string; expiresAt: string }> {
  const ttlDays = params.ttlDays ?? DEFAULT_TTL_DAYS
  const exp = Date.now() + ttlDays * 24 * 3600 * 1000

  const payload: DownloadTokenPayload = {
    sid: params.sessionId,
    email: params.email,
    formats: params.formats,
    exp,
  }

  const encoder = new TextEncoder()
  const payloadBytes = encoder.encode(JSON.stringify(payload))
  const key = await getKey()
  const sigBuf = await crypto.subtle.sign('HMAC', key, payloadBytes)
  const token = `${toBase64Url(payloadBytes.buffer as ArrayBuffer)}.${toBase64Url(sigBuf)}`

  return { token, expiresAt: new Date(exp).toISOString() }
}

export async function verifyDownloadToken(
  token: string | undefined | null
): Promise<
  | { valid: true; sessionId: string; email: string; formats: string[] }
  | { valid: false }
> {
  if (!token) return { valid: false }
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false }

  try {
    const [payloadB64, sigB64] = parts
    const payloadBytes = fromBase64Url(payloadB64)
    const sigBytes = fromBase64Url(sigB64)

    const key = await getKey()
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      payloadBytes as unknown as BufferSource
    )
    if (!ok) return { valid: false }

    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as DownloadTokenPayload
    if (
      !payload ||
      typeof payload.sid !== 'string' ||
      typeof payload.email !== 'string' ||
      !Array.isArray(payload.formats) ||
      typeof payload.exp !== 'number'
    ) {
      return { valid: false }
    }
    if (Date.now() > payload.exp) return { valid: false }

    return { valid: true, sessionId: payload.sid, email: payload.email, formats: payload.formats }
  } catch {
    return { valid: false }
  }
}
