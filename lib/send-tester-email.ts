// Envío del email con el link de descarga al tester.
// Si hay BREVO_API_KEY configurada, se envía de verdad vía Brevo (Sendinblue).
// Si no, se deja constancia en el log del servidor (no bloquea el flujo:
// el admin siempre recibe el link en la respuesta del panel).

type SendTesterLinkParams = {
  toEmail: string
  toName: string | null
  url: string
  expiresAt: string
}

const SENDER_NAME = 'La Sombra del Pantocrátor'
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-responder@lasombradelpantocrator.com'

export async function sendTesterLinkEmail(
  { toEmail, toName, url, expiresAt }: SendTesterLinkParams
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY

  const expiresLabel = new Date(expiresAt).toLocaleString('es-ES', {
    day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  if (!apiKey) {
    console.log(
      `[tester-email] BREVO_API_KEY no configurada — link para ${toEmail}: ${url} (caduca ${expiresLabel})`
    )
    return { sent: false, error: 'BREVO_API_KEY no configurada' }
  }

  const html = `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color:#8B6914;">La Sombra del Pantocrátor</h2>
      <p>Hola${toName ? ` ${toName}` : ''},</p>
      <p>Gracias por ayudarnos a probar el libro. Aquí tienes tu acceso personal para leer/escuchar
      <strong>La Sombra del Pantocrátor</strong> y dejarnos tu reseña:</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${url}" style="background:#C9A84C; color:#050810; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
          Acceder al libro
        </a>
      </p>
      <p style="font-size: 13px; color:#666;">Este enlace caduca el ${expiresLabel}.</p>
      <p>Un saludo,<br/>Andrés</p>
    </div>
  `

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: toEmail, name: toName || undefined }],
        subject: 'Tu acceso a La Sombra del Pantocrátor',
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[tester-email] Brevo error', res.status, body)
      return { sent: false, error: `Brevo ${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error desconocido'
    console.error('[tester-email] excepción enviando email', msg)
    return { sent: false, error: msg }
  }
}
