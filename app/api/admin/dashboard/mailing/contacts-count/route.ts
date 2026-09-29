import { NextRequest, NextResponse } from 'next/server'
import { hasValidAdminSession } from '@/lib/admin-session'
import { collectSources } from '@/lib/mailing-sources'
import { BREVO_DAILY_SEND_LIMIT, getAccountPlan, isBrevoConfigured, listLists } from '@/lib/brevo-marketing'

export const dynamic = 'force-dynamic'

// GET /api/admin/dashboard/mailing/contacts-count
//
// Lo que la pestaña "Mailing" necesita saber antes de tocar nada:
//   · cuántos emails hay en cada fuente propia (compradores, testers) y, si
//     una no se puede leer, POR QUÉ — nunca un 0 mudo;
//   · qué listas existen ya en Brevo (para el selector de destinatarios);
//   · el límite de envío diario del plan, leído de la cuenta.
//
// La comprobación de sesión se repite aquí además de en middleware.ts para que
// la ruta no dependa de que el matcher siga cubriéndola.
export async function GET(req: NextRequest) {
  if (!(await hasValidAdminSession(req))) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { statuses, truncated } = await collectSources(['purchases', 'testers'])

  if (!isBrevoConfigured()) {
    return NextResponse.json({
      brevoConfigured: false,
      brevoMessage: 'BREVO_API_KEY no configurada — no se pueden sincronizar contactos ni crear campañas.',
      sources: statuses,
      truncated,
      lists: [],
      dailySendLimit: BREVO_DAILY_SEND_LIMIT,
    })
  }

  const [listsRes, planRes] = await Promise.all([listLists(), getAccountPlan()])

  // OJO: en el plan Free, plan.credits con creditsType='sendLimit' es lo que
  // QUEDA por enviar hoy, no el tope. Se comprobó en vivo: tras enviar 3
  // correos de prueba pasó de 300 a 297. Son dos cifras distintas y la UI
  // necesita las dos — confundirlas hacía que el "tope diario" bajase solo.
  const creditsRemaining =
    planRes.ok && planRes.data.creditsType === 'sendLimit' ? planRes.data.credits : null

  return NextResponse.json({
    brevoConfigured: true,
    sources: statuses,
    truncated,
    lists: listsRes.ok ? listsRes.data : [],
    listsError: listsRes.ok ? null : listsRes.error,
    plan: planRes.ok ? planRes.data : null,
    dailySendLimit: BREVO_DAILY_SEND_LIMIT,
    creditsRemaining,
  })
}
