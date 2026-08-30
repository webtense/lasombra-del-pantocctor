// Autenticación de cuenta de servicio de Google (JWT Bearer, RFC 7523) sin
// depender de la librería `googleapis` (no está en package.json y añadir
// una dependencia pesada solo para 2 llamadas REST no compensa).
//
// Se usa para GA4 (Google Analytics Data API) y Google Search Console
// (Search Console API), ambas gated: si faltan las variables de entorno
// del service account, las rutas que llaman a esto devuelven
// `{ configured: false }` sin lanzar nada.
//
// Variables de entorno esperadas (compartidas por GA4 y GSC):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   (con \n literales o reales)

import { createSign } from 'crypto'

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function getServiceAccountCreds(): { email: string; privateKey: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !privateKey) return null
  // Vercel/consolas suelen guardar el \n escapado como texto literal
  privateKey = privateKey.replace(/\\n/g, '\n')
  return { email, privateKey }
}

// Obtiene un access_token OAuth2 para los scopes pedidos, firmando un JWT
// con la clave privada del service account (RS256) e intercambiándolo en
// el endpoint de token de Google.
export async function getGoogleAccessToken(scope: string): Promise<string | null> {
  const creds = getServiceAccountCreds()
  if (!creds) return null

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: creds.email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsigned)
  signer.end()
  const signature = signer.sign(creds.privateKey)
  const jwt = `${unsigned}.${base64url(signature)}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[google-service-account] token exchange failed', res.status, body)
    return null
  }

  const json = (await res.json()) as { access_token?: string }
  return json.access_token || null
}
