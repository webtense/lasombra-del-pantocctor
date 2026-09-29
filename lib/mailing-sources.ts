// Fuentes de emails para el mailing del panel admin.
//
// Cada fuente sabe decir si está disponible y por qué no lo está, en vez de
// devolver 0 en silencio — la diferencia entre "no hay compradores" y "no
// puedo leer los compradores" es justo la que hace falta ver en el panel.
//
// De dónde sale cada una:
//
//   · testers   → SELECT directo a public.testers. La tabla tiene policy de
//                 SELECT abierta a anon (ver supabase-schema-testers.sql), así
//                 que la anon key basta.
//   · purchases → NO tiene policy de SELECT (contiene PII y la anon key es
//                 pública, ver supabase-schema-purchases.sql). El único camino
//                 es la RPC SECURITY DEFINER get_purchases_activity(), que
//                 exige ADMIN_AUDIT_READ_KEY. Sin esa variable la fuente queda
//                 marcada como no disponible con el motivo exacto.
//   · external  → lista pegada a mano en el panel; no toca la base de datos.

import { getServerSupabase } from '@/lib/supabase'
import { dedupeEmails } from '@/lib/brevo-marketing'

export type SourceId = 'purchases' | 'testers'

export type SourceStatus = {
  id: SourceId
  label: string
  available: boolean
  count: number
  message?: string
}

// El techo de get_purchases_activity es 500 filas por llamada (lo impone la
// propia función SQL). Para el volumen de un libro autopublicado sobra; si
// algún día no llegara, la respuesta lo dice con `truncated`.
const PURCHASES_LIMIT = 500

type Collected = { emails: string[]; status: SourceStatus; truncated?: boolean }

async function collectTesters(): Promise<Collected> {
  const base: SourceStatus = { id: 'testers', label: 'Testers', available: false, count: 0 }
  const sb = getServerSupabase()
  if (!sb) {
    return { emails: [], status: { ...base, message: 'Supabase no configurado' } }
  }

  const { data, error } = await sb.from('testers').select('email').limit(1000)
  if (error) {
    return { emails: [], status: { ...base, message: `Supabase: ${error.message}` } }
  }

  const emails = dedupeEmails(((data as { email: string }[] | null) || []).map((r) => r.email))
  return { emails, status: { ...base, available: true, count: emails.length } }
}

async function collectPurchases(): Promise<Collected> {
  const base: SourceStatus = { id: 'purchases', label: 'Compradores', available: false, count: 0 }
  const sb = getServerSupabase()
  if (!sb) {
    return { emails: [], status: { ...base, message: 'Supabase no configurado' } }
  }

  const readKey = process.env.ADMIN_AUDIT_READ_KEY
  if (!readKey) {
    return {
      emails: [],
      status: {
        ...base,
        message:
          'Falta ADMIN_AUDIT_READ_KEY. La tabla purchases no es legible con la anon key: hace falta la ' +
          'clave de lectura de get_purchases_activity() (PASO 6 de supabase-schema-audit.sql).',
      },
    }
  }

  const { data, error } = await sb.rpc('get_purchases_activity', {
    p_admin_key: readKey,
    p_limit: PURCHASES_LIMIT,
    p_offset: 0,
  })

  if (error) {
    return { emails: [], status: { ...base, message: `Supabase: ${error.message}` } }
  }

  const rows = (data as { email: string; total: number }[] | null) || []
  const emails = dedupeEmails(rows.map((r) => r.email))
  const total = Number(rows[0]?.total ?? 0)

  // 0 filas es ambiguo a propósito en la RPC: o no hay compras, o la clave no
  // coincide con la guardada en admin_audit_config. Se dice tal cual.
  const message =
    rows.length === 0
      ? 'Sin compradores, o ADMIN_AUDIT_READ_KEY no coincide con la clave guardada en admin_audit_config.'
      : undefined

  return {
    emails,
    status: { ...base, available: true, count: emails.length, message },
    truncated: total > rows.length,
  }
}

export async function collectSources(
  ids: SourceId[]
): Promise<{ emails: string[]; statuses: SourceStatus[]; truncated: boolean }> {
  const jobs: Promise<Collected>[] = []
  if (ids.includes('purchases')) jobs.push(collectPurchases())
  if (ids.includes('testers')) jobs.push(collectTesters())

  const results = await Promise.all(jobs)
  return {
    emails: results.flatMap((r) => r.emails),
    statuses: results.map((r) => r.status),
    truncated: results.some((r) => r.truncated),
  }
}
