import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import { logAdminActionAwaited } from '@/lib/admin-audit'
import { isBrevoConfigured, sendCampaignNow } from '@/lib/brevo-marketing'

export const dynamic = 'force-dynamic'

// POST /api/admin/dashboard/mailing/campaign/send
// Body: { campaignId, recipientCount? }
//
// PASO 2 de dos, e IRREVERSIBLE: dispara el envío real de la campaña ya
// creada. Va en una ruta propia justamente para que no pueda ocurrir como
// efecto colateral de crear el borrador.
export async function POST(req: NextRequest) {
  // Como en /sync: se necesita el username para la auditoría, así que se
  // verifica la firma una sola vez y se usa el resultado para las dos cosas.
  const { valid, username } = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!valid) {
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

  const campaignId = Number(body?.campaignId)
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json({ error: 'campaignId no válido' }, { status: 400 })
  }

  const recipientCount = Number.isFinite(Number(body?.recipientCount))
    ? Number(body.recipientCount)
    : null

  const sent = await sendCampaignNow(campaignId)
  if (!sent.ok) {
    // El intento fallido también se audita: si Brevo rechaza el envío (tope
    // diario agotado, remitente no verificado…) queda constancia de que se
    // llegó a pulsar el botón.
    await logAdminActionAwaited('campaign_send_failed', {
      actor: username || 'admin',
      target: `brevo:campaign:${campaignId}`,
      details: { campaignId, recipientCount, error: sent.error },
      req,
    })
    return NextResponse.json({ error: sent.error }, { status: 502 })
  }

  // Esperado a propósito: un envío no se puede deshacer, así que su rastro
  // en la auditoría no puede depender de que la lambda siga viva.
  await logAdminActionAwaited('campaign_sent', {
    actor: username || 'admin',
    target: `brevo:campaign:${campaignId}`,
    details: { campaignId, recipientCount },
    req,
  })

  return NextResponse.json({ ok: true, campaignId, recipientCount })
}
