import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyAuthToken, AUTH_SESSION_COOKIE } from '@/lib/auth-session'
import { getServerSupabase } from '@/lib/supabase'

/**
 * Dashboard de métricas para compradores autenticados.
 * Misma validación de sesión que /panel: JWT propio en cookie lsp_auth_token
 * (NO Supabase Auth).
 *
 * Regla de oro: si faltan datos o Supabase no está configurado, se muestra 0
 * o "Sin datos aún" — la página nunca revienta.
 */

export const dynamic = 'force-dynamic'

type Stats = {
  totalPurchases: number
  purchasesToday: number
  downloadsTotal: number
  downloadsByFormat: { label: string; count: number }[]
  available: boolean
  note?: string
}

const EMPTY: Stats = {
  totalPurchases: 0,
  purchasesToday: 0,
  downloadsTotal: 0,
  downloadsByFormat: [
    { label: 'EPUB', count: 0 },
    { label: 'PDF', count: 0 },
    { label: 'MOBI', count: 0 },
    { label: 'Audiolibro', count: 0 },
  ],
  available: false,
}

async function loadStats(): Promise<Stats> {
  const sb = getServerSupabase()
  if (!sb) {
    return { ...EMPTY, note: 'Supabase no está configurado en este entorno.' }
  }

  try {
    // purchases y purchase_downloads tienen RLS sin policies: los recuentos
    // llegan por una función SECURITY DEFINER que devuelve solo agregados
    // (ver supabase-schema-user-logins.sql).
    const { data, error } = await sb.rpc('get_dashboard_stats')

    if (error) {
      console.error('[dashboard] get_dashboard_stats error', error)
      return { ...EMPTY, note: 'No se han podido cargar las métricas.' }
    }

    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null
    if (!row) return { ...EMPTY, note: 'Sin datos aún.' }

    const num = (v: unknown) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }

    return {
      totalPurchases: num(row.total_purchases),
      purchasesToday: num(row.purchases_today),
      downloadsTotal: num(row.downloads_total),
      downloadsByFormat: [
        { label: 'EPUB', count: num(row.downloads_epub) },
        { label: 'PDF', count: num(row.downloads_pdf) },
        { label: 'MOBI', count: num(row.downloads_mobi) },
        { label: 'Audiolibro', count: num(row.downloads_audio) },
      ],
      available: true,
    }
  } catch (err) {
    console.error('[dashboard] excepción cargando métricas', err)
    return { ...EMPTY, note: 'No se han podido cargar las métricas.' }
  }
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-6">
      <p className="text-xs tracking-widest uppercase text-gray-500 font-sans mb-3">
        {label}
      </p>
      <p className="font-serif text-3xl text-[#C9A84C] leading-none">{value}</p>
      {hint && <p className="text-gray-600 text-xs mt-3">{hint}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  // 1. Validar sesión igual que /panel
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value
  const { valid, email } = await verifyAuthToken(token)

  if (!valid) {
    redirect('/login')
  }

  // 2. Cargar métricas (nunca lanza)
  const stats = await loadStats()

  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">
              Dashboard
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-2">
            La Sombra del Pantocrátor
          </h1>
          <p className="text-gray-500 text-sm">
            Sesión: <span className="text-gray-400">{email}</span>
          </p>
        </div>

        {!stats.available && stats.note && (
          <div className="bg-[#0D1117] border border-[#C9A84C]/20 text-gray-500 text-sm rounded-lg px-4 py-3 mb-8">
            {stats.note} Se muestran valores a cero.
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Kpi
            label="Compras totales"
            value={stats.totalPurchases}
            hint="Pagos completados registrados"
          />
          <Kpi
            label="Compras de hoy"
            value={stats.purchasesToday}
            hint="Desde las 00:00"
          />
          <Kpi
            label="Descargas totales"
            value={stats.downloadsTotal}
            hint="Suma de los cuatro formatos"
          />
          <Kpi
            label="Capítulo más escuchado"
            value="Sin datos aún"
            hint="Requiere tracking de reproducción (no implementado)"
          />
          <Kpi
            label="Tiempo medio de escucha"
            value="Sin datos aún"
            hint="Requiere tracking de reproducción (no implementado)"
          />
        </div>

        {/* Descargas por formato */}
        <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-6 mb-8">
          <p className="text-xs tracking-widest uppercase text-gray-500 font-sans mb-5">
            Descargas por formato
          </p>
          <div className="space-y-3">
            {stats.downloadsByFormat.map((f) => {
              const max = Math.max(1, ...stats.downloadsByFormat.map((x) => x.count))
              const pct = Math.round((f.count / max) * 100)
              return (
                <div key={f.label} className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm w-24 flex-shrink-0">
                    {f.label}
                  </span>
                  <div className="flex-1 h-2 bg-[#050810] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C9A84C] rounded-full transition-all"
                      style={{ width: `${f.count === 0 ? 0 : Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <span className="text-[#C9A84C] text-sm w-10 text-right tabular-nums">
                    {f.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Link
          href="/panel"
          className="text-[#C9A84C] hover:underline text-sm"
        >
          ← Volver al reproductor
        </Link>
      </div>
    </div>
  )
}
