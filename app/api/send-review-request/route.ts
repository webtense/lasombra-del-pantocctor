import { sendReviewRequestEmail } from '@/lib/brevo'

/**
 * POST /api/send-review-request
 *
 * Endpoint para enviar email de solicitud de reseña a compradores.
 *
 * PUEDE ser:
 * 1. Llamado manualmente por admin/cli con parámetros específicos
 * 2. Disparado automáticamente por n8n/cron 7-14 días después de la compra
 * 3. Usado en batch para enviar a múltiples compradores
 *
 * Body esperado:
 * {
 *   "toEmail": "comprador@example.com",
 *   "toName": "Juan Pérez",              // opcional
 *   "bookTitle": "La Sombra del Pantocrátor",  // opcional
 *   "amazonUrl": "...",                  // opcional, enlace directo
 *   "daysOwnedCount": 7,                 // opcional, para personalizar el texto
 *   "adminKey": "..."                    // para validación (futuro)
 * }
 */

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { toEmail, toName, bookTitle, amazonUrl, goodreadsUrl, googleBooksUrl, daysOwnedCount } = body

    // Validación básica
    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return Response.json(
        { error: 'toEmail inválido' },
        { status: 400 }
      )
    }

    // Enviar el email
    const result = await sendReviewRequestEmail({
      toEmail: toEmail.toLowerCase().trim(),
      toName: toName || null,
      bookTitle: bookTitle || 'La Sombra del Pantocrátor',
      amazonUrl: amazonUrl || undefined,
      goodreadsUrl: goodreadsUrl || undefined,
      googleBooksUrl: googleBooksUrl || undefined,
      daysOwnedCount: daysOwnedCount || 7,
    })

    if (!result.sent) {
      console.error('[send-review-request] fallo enviando a', toEmail, result.error)
      return Response.json(
        { error: result.error || 'No se pudo enviar el email' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Email de solicitud de reseña enviado correctamente',
      email: toEmail,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'error desconocido'
    console.error('[send-review-request] excepción:', msg)
    return Response.json(
      { error: msg },
      { status: 500 }
    )
  }
}

/**
 * GET /api/send-review-request
 *
 * Endpoint de info/health check. Devuelve la configuración actual
 * y permite verificar que el endpoint está operativo.
 */
export async function GET() {
  return Response.json({
    endpoint: '/api/send-review-request',
    method: 'POST',
    description: 'Envía email de solicitud de reseña a compradores',
    config: {
      hasBrevoKey: Boolean(process.env.BREVO_API_KEY),
      daysDefault: 7,
      emailsPerDay: 'ilimitados (Brevo free: 300/día)',
    },
    usage: {
      toEmail: 'email@example.com (requerido)',
      toName: 'nombre (opcional)',
      bookTitle: 'La Sombra del Pantocrátor (opcional)',
      amazonUrl: 'enlace directo a Amazon (opcional)',
      daysOwnedCount: '7 (opcional)',
    },
  })
}
