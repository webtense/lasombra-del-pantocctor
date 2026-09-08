import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { hasValidAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// GET /api/admin/dashboard/audit
//
// Junta las dos fuentes que alimentan la pestaña "Auditoría" del dashboard:
//
//   1) admin_audit_log  → quién entró/falló al entrar en el panel y qué hizo
//                         (RPC get_admin_audit_log).
//   2) purchases        → cada compra con sus descargas (formato, fecha,
//                         ip_hash) y si el comprador tiene login creado
//                         (RPC get_purchases_activity).
//
// Las dos RPC son SECURITY DEFINER y exigen ADMIN_AUDIT_READ_KEY, porque
// devuelven PII (emails de compradores) y la anon key de Supabase es pública.
// Ver supabase-schema-audit.sql — PENDIENTE DE EJECUTAR.
//
// Degrada con elegancia, igual que el resto del dashboard: si falta Supabase,
// falta la clave o las funciones aún no existen en la base de datos, responde
// 200 con configured/schemaReady en false y un mensaje, en vez de un 500.

type AuditLogRow = {
  id: number
  created_at: string
  actor: string
  action: string
  target: string | null
  details: Record<string, unknown> | null
  ip_hash: string | null
  total: number
}

type BuyerRow = {
  purchase_id: number
  created_at: string
  email: string
  formats: string[] | null
  revoked: boolean
  expires_at: string
  email_sent: boolean
  has_login: boolean
  login_created_at: string | null
  downloads_total: number
  downloads: { file_type: string; created_at: string; ip_hash: string | null }[] | null
  total: number
}

// PGRST202 = la función no existe todavía en Supabase (SQL sin ejecutar).
function isMissingFunction(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST202' || /Could not find the function/i.test(error.message || '')
}

function intParam(v: string | null, fallback: number, min: number, max: number) {
  // Ojo con Number(null) === 0 y Number('') === 0: sin este corte, un
  // parámetro ausente se colaba como 0 y el clamp lo dejaba en `min`
  // (limit=1 en vez del 100 por defecto).
  if (v === null || v.trim() === '') return fallback
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

export async function GET(req: NextRequest) {
  // Se comprueba aquí además de en middleware.ts: la ruta no debe depender de
  // que el matcher del middleware siga cubriéndola.
  if (!(await hasValidAdminSession(req))) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({
      configured: false,
      error: 'Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    })
  }

  const readKey = process.env.ADMIN_AUDIT_READ_KEY
  if (!readKey) {
    return NextResponse.json({
      configured: false,
      error:
        'Falta ADMIN_AUDIT_READ_KEY en el servidor. Ver el PASO 6 de supabase-schema-audit.sql: ' +
        'genera una clave, guárdala en la tabla admin_audit_config y ponla en la variable de entorno.',
    })
  }

  const { searchParams } = new URL(req.url)
  const limit = intParam(searchParams.get('limit'), 100, 1, 500)
  const offset = intParam(searchParams.get('offset'), 0, 0, 1_000_000)
  const buyersLimit = intParam(searchParams.get('buyersLimit'), 100, 1, 500)
  const buyersOffset = intParam(searchParams.get('buyersOffset'), 0, 0, 1_000_000)

  const [logRes, buyersRes] = await Promise.all([
    sb.rpc('get_admin_audit_log', { p_admin_key: readKey, p_limit: limit, p_offset: offset }),
    sb.rpc('get_purchases_activity', {
      p_admin_key: readKey,
      p_limit: buyersLimit,
      p_offset: buyersOffset,
    }),
  ])

  // Si CUALQUIERA de las dos funciones falta, el esquema no está desplegado.
  const schemaReady = !isMissingFunction(logRes.error) && !isMissingFunction(buyersRes.error)

  if (!schemaReady) {
    return NextResponse.json({
      configured: true,
      schemaReady: false,
      error:
        'Las funciones de auditoría no existen todavía en Supabase. Ejecuta supabase-schema-audit.sql ' +
        'en el SQL Editor (queda PENDIENTE DE EJECUTAR).',
      log: { rows: [], total: 0, limit, offset },
      buyers: { rows: [], total: 0, limit: buyersLimit, offset: buyersOffset },
    })
  }

  if (logRes.error) console.error('[dashboard/audit] get_admin_audit_log', logRes.error.message)
  if (buyersRes.error) console.error('[dashboard/audit] get_purchases_activity', buyersRes.error.message)

  const logRows = (logRes.data as AuditLogRow[] | null) || []
  const buyerRows = (buyersRes.data as BuyerRow[] | null) || []

  // `total` viene repetido en cada fila (columna de la RPC). Con 0 filas no
  // hay total: o la tabla está vacía, o la clave de lectura no coincide con
  // la guardada en admin_audit_config — indistinguible desde aquí a propósito.
  const logTotal = logRows[0]?.total ?? 0
  const buyersTotal = buyerRows[0]?.total ?? 0

  return NextResponse.json({
    configured: true,
    schemaReady: true,
    log: {
      rows: logRows.map(({ total: _total, ...row }) => row),
      total: Number(logTotal),
      limit,
      offset,
    },
    buyers: {
      rows: buyerRows.map(({ total: _total, ...row }) => ({
        ...row,
        downloads: row.downloads || [],
        // Recuento por formato, que es como se muestra en la tabla.
        downloadsByFormat: (row.downloads || []).reduce<Record<string, number>>((acc, d) => {
          acc[d.file_type] = (acc[d.file_type] || 0) + 1
          return acc
        }, {}),
      })),
      total: Number(buyersTotal),
      limit: buyersLimit,
      offset: buyersOffset,
    },
    errors: {
      log: logRes.error?.message || null,
      buyers: buyersRes.error?.message || null,
    },
  })
}
