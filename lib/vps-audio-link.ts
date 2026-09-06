import { createHash } from 'crypto'

/**
 * Genera una URL firmada de corta duración para servir el M4B del audiolibro
 * desde el VPS (webtenseenergy.com/lsp-audiobook/...), protegido con el
 * módulo nginx secure_link (ngx_http_secure_link_module) sobre rutas *.m4b.
 *
 * El VPS calcula: secure_link_md5 = md5("$expires$uri secret") en base64url
 * sin padding. Debe coincidir exactamente con el algoritmo de
 * /etc/easypanel/nginx-configs/lsp-audiobook/default.conf del contenedor
 * lsp_audiobook (Traefik hace stripPrefix de "/lsp-audiobook" antes de
 * reenviar, así que $uri visto por nginx NO incluye ese prefijo).
 *
 * Requiere las env vars:
 *   VPS_AUDIO_SECRET          - secreto compartido con nginx secure_link_md5
 *   NEXT_PUBLIC_AUDIO_BASE_URL - ya existe, p.ej. https://webtenseenergy.com/lsp-audiobook
 *
 * Devuelve null si falta el secreto (permite fallback a DRIVE_AUDIO_URL
 * mientras no esté configurado en Vercel).
 */

type AudioQuality = 'normal' | 'premium'

function signPath(uriPath: string, secret: string, ttlSeconds: number): { expires: number; md5: string } {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const raw = `${expires}${uriPath} ${secret}`
  const md5 = createHash('md5')
    .update(raw)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return { expires, md5 }
}

export function getSignedAudiobookUrl(
  quality: AudioQuality = 'normal',
  ttlSeconds = 300
): string | null {
  const secret = process.env.VPS_AUDIO_SECRET
  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL
  if (!secret || !base) return null

  const filename = quality === 'premium' ? 'audiolibro_premium.m4b' : 'audiolibro_normal.m4b'
  // uri tal y como lo ve nginx DENTRO del contenedor, tras el stripPrefix de Traefik
  const uriPath = `/${quality}/${filename}`
  const { expires, md5 } = signPath(uriPath, secret, ttlSeconds)

  return `${base}${uriPath}?md5=${md5}&expires=${expires}`
}
