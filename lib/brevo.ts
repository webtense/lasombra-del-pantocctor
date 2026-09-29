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

// ─────────────────────────────────────────────────────────────────────────────
// Email de solicitud de reseña (POST-COMPRA)
//
// Se envía 7-14 días después de la compra al comprador para solicitar reseña
// en Amazon, Goodreads y Google Books. Incluye CTAs directos a cada plataforma.
// ─────────────────────────────────────────────────────────────────────────────
type SendReviewRequestEmailParams = {
  toEmail: string
  toName?: string | null
  bookTitle?: string
  amazonUrl?: string
  goodreadsUrl?: string
  googleBooksUrl?: string
  daysOwnedCount?: number // Ej: "Han pasado 14 días desde..."
}

export async function sendReviewRequestEmail(
  {
    toEmail,
    toName,
    bookTitle = 'La Sombra del Pantocrátor',
    amazonUrl = 'https://www.amazon.es/s?k=la+sombra+del+pantocrator',
    goodreadsUrl = 'https://www.goodreads.com',
    googleBooksUrl = 'https://books.google.com',
    daysOwnedCount = 7,
  }: SendReviewRequestEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY

  if (!apiKey) {
    console.error('[brevo] BREVO_API_KEY no configurada — no se puede enviar la solicitud de reseña a', toEmail)
    return { sent: false, error: 'BREVO_API_KEY no configurada' }
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="color:#8B6914; font-size:20px;">${escapeHtml(bookTitle)}</h2>
      <p>Hola${toName ? ` ${toName}` : ''},</p>
      <p>Han pasado ${daysOwnedCount} días desde que compraste <strong>${escapeHtml(bookTitle)}</strong> y esperamos que lo estés disfrutando.</p>
      <p>Si has tenido un buen rato leyendo (o escuchando) la novela, nos encantaría que compartiera tu opinión en:</p>

      <div style="margin:24px 0;">
        <p style="margin:12px 0;">
          <a href="${amazonUrl}" style="display:inline-block; background:#FF9900; color:#fff; padding:12px 20px; text-decoration:none; border-radius:4px; font-weight:bold;">📖 Reseña en Amazon</a>
        </p>
        <p style="margin:12px 0; font-size:13px; color:#666;">Deja tu puntuación y comentario donde la compraste</p>
      </div>

      <div style="margin:24px 0; padding:16px; background:#faf7ef; border-left:4px solid #8B6914; border-radius:4px;">
        <p style="margin:0 0 12px; font-weight:bold; color:#8B6914;">Otras plataformas:</p>
        <p style="margin:8px 0;">
          <a href="${goodreadsUrl}" style="color:#8B6914; text-decoration:none; font-weight:bold;">📚 Goodreads</a>
        </p>
        <p style="margin:8px 0;">
          <a href="${googleBooksUrl}" style="color:#8B6914; text-decoration:none; font-weight:bold;">🔍 Google Books</a>
        </p>
      </div>

      <p style="margin:24px 0; font-size:13px; color:#666;">
        Las reseñas de lectores como tú ayudan a otros a decidir si quieren leer el libro, y nos motivan a seguir escribiendo. ¡Gracias!
      </p>

      <p>Un saludo,<br/>Andrés Sánchez Serrano<br/><em>Autor de La Sombra del Pantocrátor</em></p>

      <p style="font-size:11px; color:#999; border-top:1px solid #ddd; padding-top:12px; margin-top:32px;">
        Recibiste este correo porque compraste el libro. Si prefieres no recibir más comunicaciones, puedes darte de baja aquí.
      </p>
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
        sender: { name: 'Andrés Sánchez Serrano', email: SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || undefined }],
        subject: `¿Qué te pareció ${bookTitle}? 📖`,
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[brevo] error enviando solicitud de reseña', res.status, body)
      return { sent: false, error: `Brevo ${res.status}` }
    }

    console.log('✅ Email de solicitud de reseña enviado a', toEmail)
    return { sent: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error desconocido'
    console.error('[brevo] excepción enviando solicitud de reseña', msg)
    return { sent: false, error: msg }
  }
}
