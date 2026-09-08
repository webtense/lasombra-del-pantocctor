import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/admin-session'
import { logAdminAction } from '@/lib/admin-audit'
import { collectSources, type SourceId } from '@/lib/mailing-sources'
import { dedupeEmails, getOrCreateList, isBrevoConfigured, syncContactsToBrevo } from '@/lib/brevo-marketing'

export const dynamic = 'force-dynamic'

// POST /api/admin/dashboard/mailing/sync
// Body: { sources: ('purchases'|'testers'|'external')[], externalEmails?: string[], listName?: string }
//
// Junta los emails de las fuentes pedidas, los deduplica y los sube a una
// lista de Brevo (que se crea si no existe).

const DEFAULT_LIST_NAME = 'La Sombra del Pantocrátor — Lectores'
const MAX_EXTERNAL = 5000

const VALID_SOURCES = ['purchases', 'testers', 'external'] as const
type RequestSource = (typeof VALID_SOURCES)[number]

export async function POST(req: NextRequest) {
  // Equivale a hasValidAdminSession(req), pero devolviendo además el username:
  // hace falta como `actor` de la auditoría, y verificar la firma dos veces
  // para obtenerlo sería trabajo repetido.
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

  const requested: RequestSource[] = Array.isArray(body?.sources)
    ? body.sources.filter((s: unknown): s is RequestSource => VALID_SOURCES.includes(s as RequestSource))
    : []

  if (requested.length === 0) {
    return NextResponse.json({ error: 'Indica al menos una fuente de contactos' }, { status: 400 })
  }

  const dbSources = requested.filter((s): s is SourceId => s === 'purchases' || s === 'testers')
  const { emails: dbEmails, statuses, truncated } = dbSources.length
    ? await collectSources(dbSources)
    : { emails: [] as string[], statuses: [], truncated: false }

  const externalRaw: string[] = requested.includes('external') && Array.isArray(body?.externalEmails)
    ? body.externalEmails.slice(0, MAX_EXTERNAL).map((e: unknown) => String(e))
    : []
  const externalEmails = dedupeEmails(externalRaw)

  if (requested.includes('external') && externalEmails.length === 0) {
    return NextResponse.json(
      { error: 'La lista externa no contiene ningún email válido' },
      { status: 400 }
    )
  }

  const emails = dedupeEmails([...dbEmails, ...externalEmails])
  if (emails.length === 0) {
    return NextResponse.json(
      { error: 'No hay ningún email que sincronizar en las fuentes elegidas', sources: statuses },
      { status: 400 }
    )
  }

  const listName = typeof body?.listName === 'string' && body.listName.trim()
    ? body.listName.trim().slice(0, 100)
    : DEFAULT_LIST_NAME

  const list = await getOrCreateList(listName)
  if (!list.ok) {
    return NextResponse.json({ error: list.error }, { status: 502 })
  }

  const sync = await syncContactsToBrevo(emails, list.data.id, { ORIGEN: 'panel-admin' })
  if (!sync.ok) {
    return NextResponse.json({ error: sync.error, list: list.data }, { status: 502 })
  }

  logAdminAction('mailing_sync', {
    actor: username || 'admin',
    target: `brevo:list:${list.data.id}`,
    details: {
      count: emails.length,
      sources: requested,
      externalCount: externalEmails.length,
      listId: list.data.id,
      listName: list.data.name,
      listCreated: list.data.created,
      mode: sync.data.mode,
    },
    req,
  })

  return NextResponse.json({
    ok: true,
    list: list.data,
    total: emails.length,
    sources: statuses,
    externalCount: externalEmails.length,
    truncated,
    result: sync.data,
  })
}
