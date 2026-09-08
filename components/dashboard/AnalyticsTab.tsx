'use client'

import { useEffect, useState } from 'react'
import { StatCard, Card, MiniBarChart } from './ui'

// Pestaña "Analítica" — audiencia y embudo a partir de la telemetría propia
// (tablas `visits` y `events` de Supabase). Sin librería de gráficas: el
// proyecto no tiene ninguna instalada y una serie de 30 barras no justifica
// añadir una dependencia (mismo criterio que ya comenta ui.tsx).

type Bucket = { label: string; count: number }

type Analytics = {
  configured: boolean
  error?: string
  rangeDays?: number
  visits?: {
    total: number
    truncated: boolean
    perDay: { date: string; count: number }[]
    uniqueIps: number
    uniqueSessions: number
    topPages: Bucket[]
    topReferrers: Bucket[]
    devices: Bucket[]
    countries: Bucket[]
  } | null
  visitsError?: string | null
  visitsHint?: string | null
  funnel?: {
    stages: { key: string; label: string; count: number | null; source: string }[]
    purchasesScope: 'range' | 'total' | 'unavailable'
    error?: string | null
    hint?: string | null
  }
  audio?: {
    topChapters: Bucket[]
    chapterStarts: number | null
    chapterCompletes: number | null
    avgListenSeconds: number | null
    avgListenReason: string
  }
}

// Aviso de sección: una parte de la pestaña se queda sin datos, pero el resto
// sigue mostrándose. Es lo que pasa hoy con `visits`.
function SectionError({ error, hint }: { error: string; hint?: string | null }) {
  return (
    <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-4 text-sm">
      <p className="text-amber-400">No se pudieron cargar estos datos.</p>
      {hint && <p className="text-amber-300/80 mt-1">{hint}</p>}
      <p className="text-gray-500 text-xs mt-2 font-mono break-words">{error}</p>
    </div>
  )
}

const DAY_LABEL = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })

function shortDay(date: string) {
  // date llega como YYYY-MM-DD ya calculado en horario de Madrid por el
  // endpoint. Se le añade T12:00:00Z solo para formatearlo sin que el parseo
  // lo mueva de día.
  return DAY_LABEL.format(new Date(`${date}T12:00:00Z`))
}

// Serie temporal en barras verticales con <div>s. Cada barra es un día; se
// etiquetan solo algunas fechas para que el eje no se amontone en móvil.
function VisitsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count))

  return (
    <div>
      <div className="flex items-end gap-[3px] h-40" role="img" aria-label="Visitas por día">
        {data.map((d) => (
          <div key={d.date} className="flex-1 h-full flex items-end group relative">
            <div
              className="w-full bg-gradient-to-t from-[#C9A84C] to-[#E0C97A] rounded-t-sm min-h-[2px] transition-opacity group-hover:opacity-80"
              style={{ height: `${(d.count / max) * 100}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-[#050810] border border-[#C9A84C]/40 text-[#C9A84C] text-xs px-2 py-1 rounded z-10">
              {shortDay(d.date)}: {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-mono">
        <span>{data.length > 0 && shortDay(data[0].date)}</span>
        <span>{data.length > 2 && shortDay(data[Math.floor(data.length / 2)].date)}</span>
        <span>{data.length > 1 && shortDay(data[data.length - 1].date)}</span>
      </div>
    </div>
  )
}

// Embudo: cada fase se dibuja proporcional a la primera, con la caída respecto
// a la fase anterior. Si una fase no tiene dato (compras no consultables), se
// marca y NO se calcula ningún porcentaje sobre ella.
function Funnel({
  stages,
  scope,
}: {
  stages: { key: string; label: string; count: number | null; source: string }[]
  scope: 'range' | 'total' | 'unavailable'
}) {
  const base = stages[0]?.count ?? 0

  return (
    <div className="space-y-4">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].count : null
        const width = base > 0 && s.count !== null ? Math.max(2, (s.count / base) * 100) : 2
        const drop =
          s.count !== null && prev !== null && prev > 0 ? ((prev - s.count) / prev) * 100 : null
        const ofBase = s.count !== null && base > 0 ? (s.count / base) * 100 : null

        return (
          <div key={s.key}>
            <div className="flex justify-between items-baseline text-xs mb-1 gap-3">
              <span className="text-gray-300">
                {s.label}
                {s.key === 'purchase' && scope === 'total' && (
                  <span className="text-amber-500/80 ml-1.5">(total histórico)</span>
                )}
              </span>
              <span className="font-mono whitespace-nowrap">
                <span className="text-[#C9A84C]">{s.count === null ? 'n/d' : s.count}</span>
                {ofBase !== null && i > 0 && (
                  <span className="text-gray-600 ml-2">{ofBase.toFixed(1)}%</span>
                )}
              </span>
            </div>
            <div className="h-7 bg-[#1F2937] rounded overflow-hidden">
              <div
                className={`h-full rounded flex items-center px-2 ${
                  s.count === null
                    ? 'bg-gray-700'
                    : 'bg-gradient-to-r from-[#C9A84C] to-[#E0C97A]'
                }`}
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600 text-[10px] font-mono">{s.source}</span>
              {drop !== null && drop > 0 && (
                <span className="text-red-400/70 text-[10px]">−{drop.toFixed(1)}% vs. fase anterior</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsTab() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard/analytics')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ configured: false, error: String(e) }))
      .finally(() => setLoading(false))
  }, [])

  const v = data?.visits
  const days = data?.rangeDays ?? 30

  if (!loading && data && !data.configured) {
    return (
      <Card title="Analítica">
        <p className="text-gray-500 text-sm">
          No configurado — {data.error || 'faltan credenciales de Supabase.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {data?.error && (
        <div className="bg-red-950/30 border border-red-700/40 rounded-lg p-4 text-red-400 text-sm">
          {data.error}
        </div>
      )}

      {v?.truncated && (
        <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-4 text-amber-400 text-sm">
          Se alcanzó el tope de filas leídas: las cifras de abajo se quedan cortas. Conviene mover
          la agregación a una función SQL o purgar visitas antiguas.
        </div>
      )}

      {/* ── Audiencia ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Audiencia · últimos {days} días</h3>

        {!loading && data?.visitsError ? (
          <SectionError error={data.visitsError} hint={data.visitsHint} />
        ) : (
        <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Páginas vistas" value={v?.total ?? '—'} loading={loading} />
          <StatCard
            label="Visitantes únicos (IP)"
            value={v?.uniqueIps ?? '—'}
            sub="ip_hash distintos"
            loading={loading}
          />
          <StatCard
            label="Sesiones únicas"
            value={v?.uniqueSessions ?? '—'}
            sub="session_id distintos"
            loading={loading}
          />
          <StatCard
            label="Páginas / sesión"
            value={v && v.uniqueSessions > 0 ? (v.total / v.uniqueSessions).toFixed(1) : '—'}
            loading={loading}
          />
        </div>

        {/* La nota va a la vista, no escondida en el código: las dos cifras de
            "únicos" miden cosas distintas y sin esto se comparan mal. */}
        <div className="mt-3 bg-[#0D1117] border border-gray-800 rounded-lg p-4 text-xs text-gray-500 leading-relaxed">
          <p className="text-gray-400 mb-1">Cómo leer las dos cifras de visitantes únicos</p>
          <p>
            <span className="text-gray-300">Sesiones únicas (session_id)</span> se guarda en{' '}
            <code className="text-gray-400">sessionStorage</code>: se reinicia en cada pestaña nueva
            y al cerrar el navegador, así que <span className="text-gray-300">sobrestima</span> el
            número de personas.{' '}
            <span className="text-gray-300">Visitantes únicos (ip_hash)</span> es más estable en el
            tiempo, pero todos los que salen por una misma IP (oficina, red móvil con NAT, wifi
            familiar) se cuentan como uno solo, así que{' '}
            <span className="text-gray-300">infraestima</span>. La cifra real está entre las dos.
          </p>
          <p className="mt-2">
            Además son datos de telemetría propia: un bloqueador de anuncios o cerrar la pestaña
            antes de que salga la petición hacen que la visita no llegue a registrarse.
          </p>
        </div>

        {/* ── Visitas por día ─────────────────────────────────────────── */}
        <div className="mt-6">
          <Card title={`Visitas por día · ${days} días`}>
            {loading ? (
              <div className="h-40 bg-[#1F2937] rounded animate-pulse" />
            ) : v && v.perDay.length > 0 ? (
              <VisitsPerDayChart data={v.perDay} />
            ) : (
              <p className="text-gray-600 text-sm">Sin datos</p>
            )}
          </Card>
        </div>
        </>
        )}
      </div>

      {/* ── Embudo ────────────────────────────────────────────────────── */}
      <Card title="Embudo de conversión">
        {loading ? (
          <div className="h-48 bg-[#1F2937] rounded animate-pulse" />
        ) : data?.funnel?.error ? (
          <SectionError error={data.funnel.error} hint={data.funnel.hint} />
        ) : data?.funnel ? (
          <>
            <Funnel stages={data.funnel.stages} scope={data.funnel.purchasesScope} />
            <p className="text-gray-600 text-xs mt-4 leading-relaxed">
              La fase de compra sale de la tabla <code className="text-gray-500">purchases</code>{' '}
              (cobros reales), no del evento <code className="text-gray-500">purchase</code>. Las
              tres primeras fases son telemetría del navegador, así que la caída hasta la compra
              está exagerada: parte de esas vistas nunca se registraron.
            </p>
            {data.funnel.purchasesScope === 'total' && (
              <p className="text-amber-500/80 text-xs mt-2">
                Las compras mostradas son el total histórico, no las de los últimos {days} días:
                falta ejecutar <code>supabase-schema-analytics.sql</code> (función{' '}
                <code>get_purchases_since</code>) en Supabase.
              </p>
            )}
            {data.funnel.purchasesScope === 'unavailable' && (
              <p className="text-amber-500/80 text-xs mt-2">
                No se pudo leer el número de compras: la tabla <code>purchases</code> no es
                consultable con la anon key y ninguna de las dos funciones SQL respondió.
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-600 text-sm">Sin datos</p>
        )}
      </Card>

      {/* ── Desgloses ─────────────────────────────────────────────────── */}
      {/* Todos salen de `visits`; si esa tabla no responde, ya se avisó arriba
          y no tiene sentido repetir cuatro tarjetas vacías. */}
      <div className={`grid md:grid-cols-2 gap-6 ${data?.visitsError ? 'hidden' : ''}`}>
        <Card title="Páginas más vistas">
          {loading ? (
            <div className="h-32 bg-[#1F2937] rounded animate-pulse" />
          ) : (
            <MiniBarChart data={(v?.topPages || []).map((b) => [b.label, b.count])} />
          )}
        </Card>

        <Card title="Procedencia (referrers)">
          {loading ? (
            <div className="h-32 bg-[#1F2937] rounded animate-pulse" />
          ) : (
            <>
              <MiniBarChart data={(v?.topReferrers || []).map((b) => [b.label, b.count])} />
              <p className="text-gray-600 text-xs mt-3">
                Agrupado por dominio. &quot;Directo&quot; incluye tanto el tráfico sin referrer como
                el que lo pierde por la política del navegador.
              </p>
            </>
          )}
        </Card>

        <Card title="Dispositivo">
          {loading ? (
            <div className="h-24 bg-[#1F2937] rounded animate-pulse" />
          ) : (
            <MiniBarChart data={(v?.devices || []).map((b) => [b.label, b.count])} />
          )}
        </Card>

        <Card title="País">
          {loading ? (
            <div className="h-32 bg-[#1F2937] rounded animate-pulse" />
          ) : (
            <>
              <MiniBarChart data={(v?.countries || []).map((b) => [b.label, b.count])} />
              <p className="text-gray-600 text-xs mt-3">
                País deducido de la cabecera de geolocalización del CDN. &quot;Desconocido&quot;
                cuando no llega.
              </p>
            </>
          )}
        </Card>
      </div>

      {/* ── Audiolibro ────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Audiolibro</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <StatCard label="Capítulos iniciados" value={data?.audio?.chapterStarts ?? '—'} loading={loading} />
          <StatCard label="Capítulos terminados" value={data?.audio?.chapterCompletes ?? '—'} loading={loading} />
          <StatCard
            label="Tasa de finalización"
            value={
              data?.audio?.chapterStarts && data.audio.chapterCompletes !== null
                ? `${((data.audio.chapterCompletes / data.audio.chapterStarts) * 100).toFixed(0)}%`
                : '—'
            }
            loading={loading}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card title="Capítulos más escuchados">
            {loading ? (
              <div className="h-32 bg-[#1F2937] rounded animate-pulse" />
            ) : (
              <MiniBarChart data={(data?.audio?.topChapters || []).map((b) => [b.label, b.count])} />
            )}
          </Card>

          <Card title="Tiempo medio de escucha">
            <p className="font-serif text-2xl text-gray-600 mb-2">No disponible</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              {data?.audio?.avgListenReason ||
                'El evento de fin de capítulo no registra duración, así que no hay dato del que sacar una media.'}
            </p>
            <p className="text-gray-600 text-xs mt-3 leading-relaxed">
              Para tenerlo haría falta añadir la duración escuchada al evento{' '}
              <code className="text-gray-500">chapter_complete</code> en{' '}
              <code className="text-gray-500">AudiobookPlayer.tsx</code>. Mientras tanto, la tasa de
              finalización de arriba es la mejor señal de cuánto se escucha.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
