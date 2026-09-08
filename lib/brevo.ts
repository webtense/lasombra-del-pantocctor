// Envío del email post-compra con los 4 enlaces de descarga.
// Mismo patrón que lib/send-tester-email.ts: si hay BREVO_API_KEY se envía
// de verdad vía Brevo (Sendinblue); si no, se deja constancia en el log
// del servidor (no bloquea el webhook: el comprador siempre puede volver
// a /gracias?session_id=... y regenerar sus enlaces vía /api/verify-payment).

type DownloadLinks = {
  epub: string
  pdf: string
  mobi: string
  audio_m4b: string
}

type SendPurchaseEmailParams = {
  toEmail: string
  toName?: string | null
  downloadLinks: DownloadLinks
  expiresAt: string
  // Acceso a /panel (reproductor online). panelPassword es null cuando el
  // comprador ya tenía cuenta: en ese caso no se inventa una contraseña
  // nueva, se le recuerda que use la que ya tiene.
  panelUrl?: string
  panelEmail?: string
  panelPassword?: string | null
}

const SENDER_NAME = 'La Sombra del Pantocrátor'
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-responder@lasombradelpantocrator.com'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendPurchaseEmail(
  {
    toEmail,
    toName,
    downloadLinks,
    expiresAt,
    panelUrl,
    panelEmail,
    panelPassword,
  }: SendPurchaseEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY

  const expiresLabel = new Date(expiresAt).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  if (!apiKey) {
    // Nunca volcar la contraseña en claro al log del servidor.
    console.log(
      `[brevo] BREVO_API_KEY no configurada — enlaces de descarga para ${toEmail}:`,
      downloadLinks
    )
    return { sent: false, error: 'BREVO_API_KEY no configurada' }
  }

  // Bloque de acceso al panel online.
  let accessBlock = ''
  if (panelUrl && panelEmail) {
    const credentials = panelPassword
      ? `
        <p style="margin:6px 0; font-size:14px;">Usuario: <strong>${escapeHtml(panelEmail)}</strong></p>
        <p style="margin:6px 0; font-size:14px;">Contraseña:
          <strong style="font-family: monospace; letter-spacing:1px; background:#fff; padding:2px 6px; border:1px solid #ddd; border-radius:4px;">${escapeHtml(panelPassword)}</strong>
        </p>
        <p style="margin:10px 0 0; font-size:12px; color:#666;">Guarda esta contraseña: por seguridad no la almacenamos en claro y no podemos volver a mostrártela.</p>`
      : `
        <p style="margin:6px 0; font-size:14px;">Usuario: <strong>${escapeHtml(panelEmail)}</strong></p>
        <p style="margin:6px 0; font-size:14px;">Entra con la contraseña que ya recibiste en tu compra anterior.</p>`

    accessBlock = `
      <div style="margin:24px 0; padding:16px; background:#faf7ef; border:1px solid #E0C97A; border-radius:8px;">
        <p style="margin:0 0 10px; font-weight:bold; color:#8B6914;">🔐 Escúchalo online en tu panel</p>
        ${credentials}
        <p style="margin:14px 0 0;">
          <a href="${panelUrl}" style="color:#8B6914; font-weight:bold;">Entrar en mi panel →</a>
        </p>
      </div>
    `
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color:#8B6914;">La Sombra del Pantocrátor</h2>
      <p>Hola${toName ? ` ${toName}` : ''},</p>
      <p>Gracias por tu compra. Aquí tienes tus enlaces de descarga personales
      (cada uno permite hasta 5 descargas):</p>
      <div style="margin: 24px 0;">
        <p style="margin: 10px 0;">
          <a href="${downloadLinks.epub}" style="color:#8B6914; font-weight:bold;">📚 Descargar EPUB</a>
        </p>
        <p style="margin: 10px 0;">
          <a href="${downloadLinks.pdf}" style="color:#8B6914; font-weight:bold;">📄 Descargar PDF</a>
        </p>
        <p style="margin: 10px 0;">
          <a href="${downloadLinks.mobi}" style="color:#8B6914; font-weight:bold;">📖 Descargar MOBI (Kindle)</a>
        </p>
        <p style="margin: 10px 0;">
          <a href="${downloadLinks.audio_m4b}" style="color:#8B6914; font-weight:bold;">🎧 Descargar Audiolibro</a>
        </p>
      </div>
      ${accessBlock}
      <p style="font-size: 13px; color:#666;">Guarda este correo: son tus enlaces de descarga para siempre
      (hasta ${expiresLabel} de margen), aunque solo se permiten 5 descargas por formato.</p>
      <p>Un saludo,<br/>Andrés</p>
    </div>
  `

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      // cache:'no-store' obligatorio: Next.js cachea también las POST salientes
      // y un reintento con el mismo body devolvería la respuesta guardada sin
      // llegar a enviar el email.
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || undefined }],
        subject: 'Tus descargas — La Sombra del Pantocrátor',
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[brevo] error enviando email de compra', res.status, body)
      return { sent: false, error: `Brevo ${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error desconocido'
    console.error('[brevo] excepción enviando email de compra', msg)
    return { sent: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email de recuperación de contraseña (POST /api/auth/reset-password).
//
// No es un "enlace mágico": el endpoint genera una contraseña nueva, la
// guarda hasheada y la manda aquí en claro por email — mismo modelo que el
// email post-compra, que es la única contraseña que el comprador ha visto.
// ─────────────────────────────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  { toEmail, newPassword, panelUrl }: { toEmail: string; newPassword: string; panelUrl: string }
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    // Nunca volcar la contraseña en claro al log del servidor.
    console.error('[brevo] BREVO_API_KEY no configurada — no se puede enviar el reset a', toEmail)
    return { sent: false, error: 'BREVO_API_KEY no configurada' }
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color:#8B6914;">La Sombra del Pantocrátor</h2>
      <p>Has pedido una contraseña nueva para tu panel de lectura y escucha.</p>
      <div style="margin:24px 0; padding:16px; background:#faf7ef; border:1px solid #E0C97A; border-radius:8px;">
        <p style="margin:6px 0; font-size:14px;">Usuario: <strong>${escapeHtml(toEmail)}</strong></p>
        <p style="margin:6px 0; font-size:14px;">Contraseña nueva:
          <strong style="font-family: monospace; letter-spacing:1px; background:#fff; padding:2px 6px; border:1px solid #ddd; border-radius:4px;">${escapeHtml(newPassword)}</strong>
        </p>
        <p style="margin:10px 0 0; font-size:12px; color:#666;">La anterior ya no funciona. Guarda esta: por seguridad no la almacenamos en claro y no podemos volver a mostrártela.</p>
        <p style="margin:14px 0 0;">
          <a href="${panelUrl}" style="color:#8B6914; font-weight:bold;">Entrar en mi panel →</a>
        </p>
      </div>
      <p style="font-size: 13px; color:#666;">Si no has sido tú, ignora este correo: nadie ha podido acceder a tu cuenta con la contraseña anterior.</p>
      <p>Un saludo,<br/>Andrés</p>
    </div>
  `

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail }],
        subject: 'Tu contraseña nueva — La Sombra del Pantocrátor',
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[brevo] error enviando reset de contraseña', res.status, body)
      return { sent: false, error: `Brevo ${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error desconocido'
    console.error('[brevo] excepción enviando reset de contraseña', msg)
    return { sent: false, error: msg }
  }
}
