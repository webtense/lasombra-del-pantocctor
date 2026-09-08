import { createHash } from 'crypto'
import { getServerSupabase } from '@/lib/supabase'

// Registro de auditoría del panel admin: quién hizo qué, cuándo y desde qué
// IP (hasheada). Escribe en public.admin_audit_log vía la RPC SECURITY DEFINER
// log_admin_action() — ver supabase-schema-audit.sql, que a día de hoy sigue
// PENDIENTE DE EJECUTAR en Supabase.
//
// Regla de oro: esto es telemetría, no lógica de negocio. Si Supabase no está
// configurado, si la RPC todavía no existe (PGRST202) o si la red falla, la
// operación auditada debe seguir adelante como si nada. De ahí el
// fire-and-forget con .catch() — mismo criterio que logEvent() en
// app/api/download/[file]/route.ts, que sí llegó a producir promesas
// rechazadas sin capturar cuando la tabla `events` no existía.

export type AdminAuditAction =
  | 'login_success'
  | 'login_failed'
  | 'tester_created'
  | 'mailing_sync'
  | 'campaign_sent'
  // Se admite cualquier otra cadena para no tener que tocar este tipo cada vez
  // que se instrumenta una acción nueva.
  | (string & {})

// Tipado por estructura (no importa next/server) para aceptar tanto el
// NextRequest de una Route Handler como cualquier objeto con headers.
type HeaderSource = { headers: { get(name: string): string | null } }

type LogOptions = {
  actor: string
  target?: string | null
  details?: Record<string, unknown> | null
  req?: HeaderSource | null
}

// MISMO hash que app/api/download/[file]/route.ts (ipHashOf): sha256 de la IP
// con la sal 'lsp-purchase-salt-2026', truncado a 16 hex. Reutilizarlo exacto
// es lo que permite cruzar en el panel una fila de auditoría con una descarga
// de purchase_downloads: si cambiara la sal, los mismos visitantes darían
// hashes distintos y la correlación se perdería.
export function adminIpHash(req?: HeaderSource | null): string | null {
  if (!req) return null
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    null
  if (!ip) return null
  return createHash('sha256').update(ip + 'lsp-purchase-salt-2026').digest('hex').slice(0, 16)
}

// Nunca lanza y nunca devuelve una promesa que el llamante deba esperar.
export function logAdminAction(action: AdminAuditAction, opts: LogOptions): void {
  void writeAuditRow(action, opts)
}

// Igual que logAdminAction pero ESPERABLE. Tampoco lanza nunca.
//
// Existe porque en Vercel la función serverless puede congelarse en cuanto
// devuelve la respuesta, y una escritura fire-and-forget que aún no haya
// terminado se pierde. Se comprobó en producción: la fila de campaign_sent
// llegó varios segundos DESPUÉS de que el endpoint respondiera.
//
// Para telemetría eso da igual, pero no para las dos acciones de mailing:
// un envío de campaña es irreversible y visible por terceros, así que su
// rastro no puede ser "casi siempre". Ahí se espera antes de responder; el
// resto del panel sigue usando la versión fire-and-forget.
export async function logAdminActionAwaited(
  action: AdminAuditAction,
  opts: LogOptions
): Promise<void> {
  await writeAuditRow(action, opts)
}

function writeAuditRow(action: AdminAuditAction, opts: LogOptions): Promise<void> {
  try {
    const sb = getServerSupabase()
    if (!sb) return Promise.resolve()

    // `actor` puede ser entrada de usuario sin validar (en login_failed es el
    // username que tecleó quien intentaba entrar), así que se recorta aquí
    // además de en la propia función SQL.
    const actor = (opts.actor || '').toString().trim().slice(0, 200) || 'desconocido'
    const target = opts.target ? opts.target.toString().trim().slice(0, 300) : null

    return Promise.resolve(
      sb.rpc('log_admin_action', {
        p_actor: actor,
        p_action: action,
        p_target: target,
        p_details: opts.details ?? null,
        p_ip_hash: adminIpHash(opts.req),
      })
    )
      .then(({ error }) => {
        if (error) console.error('[admin-audit]', action, error.message)
      })
      .catch((err) => {
        console.error('[admin-audit]', action, err instanceof Error ? err.message : err)
      })
  } catch (err) {
    console.error('[admin-audit]', action, err instanceof Error ? err.message : err)
    return Promise.resolve()
  }
}
