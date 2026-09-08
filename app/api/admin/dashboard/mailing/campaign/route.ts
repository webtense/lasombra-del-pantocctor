import { NextRequest, NextResponse } from 'next/server'
import { hasValidAdminSession } from '@/lib/admin-session'
import {
  BREVO_DAILY_SEND_LIMIT,
  createCampaign,
  getListRecipientCount,
  isBrevoConfigured,
  plainTextToHtml,
} from '@/lib/brevo-marketing'

export const dynamic = 'force-dynamic'

// POST /api/admin/dashboard/mailing/campaign
// Body: { subject, htmlContent | bodyText, listId, name? }
//
// PASO 1 de dos: solo CREA el borrador en Brevo y devuelve su campaignId.
// No envía nada — el envío es una acción aparte
// (/api/admin/dashboard/mailing/campaign/send) porque es irreversible.
//
// Se devuelve también el nº real de destinatarios de la lista (leído de
// Brevo) para que la UI pueda avisar del tope diario ANTES de que nadie
// pulse "Enviar ahora".
export async function POST(req: NextRequest) {
  if (!(await hasValidAdminSession(req))) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  if (!isBrevoConfigured()) {
    return NextResponse.json({ error: 'BREVO_API_KEY no configurada' }, { status: 503 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 })
  }

  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const listId = Number(body?.listId)

  if (!subject) return NextResponse.json({ error: 'Falta el asunto' }, { status: 400 })
  if (!Number.isInteger(listId) || listId <= 0) {
    return NextResponse.json({ error: 'Falta la lista de destinatarios' }, { status: 400 })
  }

  // El panel manda texto plano y aquí se convierte a HTML (un <p> por
  // párrafo). Se acepta htmlContent ya montado por si en el futuro hay un
  // editor, pero no es lo que usa la UI actual.
  const htmlContent =
    typeof body?.htmlContent === 'string' && body.htmlContent.trim()
      ? body.htmlContent
      : typeof body?.bodyText === 'string' && body.bodyText.trim()
        ? plainTextToHtml(body.bodyText, subject)
        : ''

  if (!htmlContent) return NextResponse.json({ error: 'Falta el cuerpo del correo' }, { status: 400 })

  // Brevo rechaza dos campañas con el mismo nombre, así que se le pega la
  // fecha y hora — el nombre es interno, el destinatario solo ve el asunto.
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const name =
    typeof body?.name === 'string' && body.name.trim()
      ? body.name.trim().slice(0, 120)
      : `${subject.slice(0, 90)} · ${stamp}`

  const created = await createCampaign({ name, subject, htmlContent, listIds: [listId] })
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 502 })
  }

  const recipientCount = await getListRecipientCount(listId)

  return NextResponse.json({
    ok: true,
    campaignId: created.data.campaignId,
    name,
    subject,
    listId,
    recipientCount,
    dailySendLimit: BREVO_DAILY_SEND_LIMIT,
    exceedsDailyLimit: recipientCount != null && recipientCount > BREVO_DAILY_SEND_LIMIT,
  })
}
