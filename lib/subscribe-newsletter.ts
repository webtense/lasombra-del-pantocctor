// Alta de un email en la lista de newsletter (Brevo/Sendinblue).
// Mismo patrón defensivo que lib/send-tester-email.ts: si no hay
// BREVO_API_KEY configurada, se deja constancia en el log del servidor
// y no se bloquea el flujo (el formulario siempre responde ok al usuario).

type SubscribeParams = {
  email: string
  source?: string
}

export async function subscribeToNewsletter(
  { email, source = 'muestra' }: SubscribeParams
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  const listId = process.env.BREVO_NEWSLETTER_LIST_ID

  if (!apiKey) {
    console.log(`[newsletter] BREVO_API_KEY no configurada — alta pendiente: ${email} (origen: ${source})`)
    return { ok: true }
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        attributes: { ORIGEN: source },
        listIds: listId ? [Number(listId)] : undefined,
        updateEnabled: true,
      }),
    })

    // Brevo devuelve 204 en alta correcta y 400 "duplicate_parameter" si el
    // contacto ya existe — ambos casos son un éxito desde el punto de vista
    // del usuario (ya está suscrito).
    if (res.ok || res.status === 400) {
      return { ok: true }
    }

    const body = await res.text().catch(() => '')
    console.error('[newsletter] Brevo error', res.status, body)
    return { ok: false, error: `Brevo ${res.status}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error desconocido'
    console.error('[newsletter] excepción suscribiendo email', msg)
    return { ok: false, error: msg }
  }
}
