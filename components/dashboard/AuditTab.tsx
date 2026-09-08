'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, StatCard } from './ui'

// Pestaña "Auditoría" del dashboard. Dos secciones:
//   · Log del panel admin (admin_audit_log): logins, altas de testers, etc.
//   · Actividad de compradores: compra, formatos, descargas y si tiene login.
//
// Los datos vienen de /api/admin/dashboard/audit, que a su vez llama a dos RPC
// SECURITY DEFINER de supabase-schema-audit.sql. Ese SQL todavía no se ha
// ejecutado, así que el caso normal HOY es el aviso de "no configurado":
// por eso está tratado como un estado de primera clase y no como un error.

const PAGE_SIZE = 50

type LogRow = {
  id: number
  created_at: string
  actor: string
  action: string
  target: string | null
  details: Record<string, unknown> | null
  ip_hash: string | null
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
  downloadsByFormat: Record<string, number>
}

type AuditResponse = {
  configured: boolean
  schemaReady?: boolean
  error?: string
  log?: { rows: LogRow[]; total: number; limit: number; offset: number }
  buyers?: { rows: BuyerRow[]; total: number; limit: number; offset: number }
}

const dt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

const ACTION_COLORS: Record<string, string> = {
  login_success: 'text-emerald-400 border-emerald-700/40 bg-emerald-950/30',
  login_failed: 'text-red-400 border-red-700/40 bg-red-950/30',
  tester_created: 'text-blue-400 border-blue-700/40 bg-blue-950/30',
  mailing_sync: 'text-amber-400 border-amber-700/40 bg-amber-950/30',
  campaign_sent: 'text-purple-400 border-purple-700/40 bg-purple-950/30',
}

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] || 'text-gray-400 border-gray-700 bg-gray-900/40'
  return <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{action}</span>
}

function Pager({
  offset,
  total,
  onChange,
  loading,
}: {
  offset: number
  total: number
  onChange: (next: number) => void
  loading: boolean
}) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + PAGE_SIZE, total)
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-600 text-xs">
        {from}–{to} de {total}
      </span>
      <button
        onClick={() => onChange(Math.max(0, offset - PAGE_SIZE))}
        disabled={loading || offset === 0}
        className="border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 px-2 py-1 rounded text-xs transition-colors"
      >
        ← Anterior
      </button>
      <button
        onClick={() => onChange(offset + PAGE_SIZE)}
        disabled={loading || to >= total}
        className="border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 px-2 py-1 rounded text-xs transition-colors"
      >
        Siguiente →
      </button>
    </div>
  )
}

export default function AuditTab() {
  const [data, setData] = useState<AuditResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [logOffset, setLogOffset] = useState(0)
  const [buyersOffset, setBuyersOffset] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(logOffset),
      buyersLimit: String(PAGE_SIZE),
      buyersOffset: String(buyersOffset),
    })
    fetch(`/api/admin/dashboard/audit?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ configured: false, error: e instanceof Error ? e.message : 'Error de red' }))
      .finally(() => setLoading(false))
  }, [logOffset, buyersOffset])

  useEffect(() => {
    load()
  }, [load])

  const notReady = data && (data.configured === false || data.schemaReady === false)

  const logRows = data?.log?.rows || []
  const buyerRows = data?.buyers?.rows || []

  const failedLogins = logRows.filter((r) => r.action === 'login_failed').length

  return (
    <div className="space-y-8">
      {notReady && (
        <Card title="Auditoría">
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-500 bg-gray-900/40 mr-2">
              No configurado
            </span>
            {data?.error || 'El sistema de auditoría todavía no está disponible.'}
          </p>
          <p className="text-gray-600 text-xs">
            El fichero <code className="text-gray-500">supabase-schema-audit.sql</code> está en el repositorio y
            queda pendiente de ejecutar en el SQL Editor de Supabase.
          </p>
        </Card>
      )}

      {!notReady && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Eventos registrados" value={data?.log?.total ?? '—'} loading={loading} />
          <StatCard
            label="Logins fallidos"
            value={failedLogins}
            sub="en esta página del log"
            loading={loading}
          />
          <StatCard label="Compradores" value={data?.buyers?.total ?? '—'} loading={loading} />
          <StatCard
            label="Con login creado"
            value={buyerRows.filter((b) => b.has_login).length}
            sub="en esta página"
            loading={loading}
          />
        </div>
      )}

      {/* ───────────── Log de auditoría del panel ───────────── */}
      <Card
        title="Log de auditoría del panel"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="text-[#C9A84C] hover:text-[#E0C97A] text-xs disabled:opacity-40"
            >
              Actualizar
            </button>
            <Pager offset={logOffset} total={data?.log?.total || 0} onChange={setLogOffset} loading={loading} />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Fecha', 'Actor', 'Acción', 'Target', 'Detalles', 'IP (hash)'].map((h) => (
                  <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logRows.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                  <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{dt(r.created_at)}</td>
                  <td className="px-4 py-3 text-[#C9A84C]">{r.actor}</td>
                  <td className="px-4 py-3">
                    <ActionBadge action={r.action} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[220px] truncate">{r.target || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono max-w-[260px] truncate">
                    {r.details ? JSON.stringify(r.details) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{r.ip_hash || '—'}</td>
                </tr>
              ))}
              {!loading && logRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-600 py-8">
                    {notReady ? 'Pendiente de ejecutar supabase-schema-audit.sql' : 'Sin eventos registrados todavía'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ───────────── Actividad de compradores ───────────── */}
      <Card
        title="Actividad de compradores"
        action={
          <Pager offset={buyersOffset} total={data?.buyers?.total || 0} onChange={setBuyersOffset} loading={loading} />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Email', 'Compra', 'Formatos', 'Descargas por formato', 'Total', 'Login'].map((h) => (
                  <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buyerRows.map((b) => (
                <tr key={b.purchase_id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                  <td className="px-4 py-3 text-[#C9A84C] max-w-[220px] truncate">
                    {b.email}
                    {b.revoked && <span className="ml-2 text-red-400">(revocada)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{dt(b.created_at)}</td>
                  <td className="px-4 py-3 text-gray-400">{(b.formats || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono">
                    {Object.keys(b.downloadsByFormat || {}).length === 0
                      ? '—'
                      : Object.entries(b.downloadsByFormat)
                          .map(([f, n]) => `${f}: ${n}`)
                          .join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{b.downloads_total}</td>
                  <td className="px-4 py-3">
                    {b.has_login ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-700/40 text-emerald-400 bg-emerald-950/30">
                        Sí
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-500 bg-gray-900/40">
                        No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && buyerRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-600 py-8">
                    {notReady ? 'Pendiente de ejecutar supabase-schema-audit.sql' : 'Sin compras registradas todavía'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-gray-600 text-xs mt-3">
          Las IP se guardan siempre hasheadas (SHA-256 truncado), nunca en claro. Las contraseñas de los
          compradores no salen nunca de la base de datos: aquí solo se indica si el login existe.
        </p>
      </Card>
    </div>
  )
}
