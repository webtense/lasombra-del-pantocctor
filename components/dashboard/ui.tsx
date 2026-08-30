// Piezas visuales reutilizables del dashboard de KPIs (/admin/dashboard).
// Gráficos simples con SVG inline: el proyecto no tiene recharts/chart.js
// instalado y para una barra/serie temporal sencilla no compensa añadir
// una dependencia nueva (mismo criterio que ya usa app/admin/page.tsx).

export function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string
  value: string | number
  sub?: string
  loading?: boolean
}) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-16 bg-[#1F2937] rounded animate-pulse" />
      ) : (
        <p className="font-serif text-3xl text-[#C9A84C] font-bold">{value}</p>
      )}
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export function MiniBarChart({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map((d) => d[1]))
  return (
    <div className="space-y-3">
      {data.map(([label, count]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 font-mono truncate max-w-[70%]">{label}</span>
            <span className="text-[#C9A84C] font-mono">{count}</span>
          </div>
          <div className="h-1 bg-[#1F2937] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E0C97A] rounded-full"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-600 text-sm">Sin datos</p>}
    </div>
  )
}

export function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

// Estado de una integración externa (GA4, Stripe, GSC, Instagram...).
// "No configurado" con link a la documentación cuando faltan credenciales,
// tal y como pide el requisito del dashboard.
export function IntegrationStatus({
  name,
  configured,
  docsUrl,
  message,
  children,
}: {
  name: string
  configured: boolean
  docsUrl?: string
  message?: string
  children?: React.ReactNode
}) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-sm">{name}</h2>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            configured
              ? 'border-emerald-600/40 text-emerald-400 bg-emerald-950/30'
              : 'border-gray-700 text-gray-500 bg-gray-900/40'
          }`}
        >
          {configured ? 'Conectado' : 'No configurado'}
        </span>
      </div>
      {!configured && (
        <div className="text-gray-500 text-xs">
          <p className="mb-2">{message || 'Faltan credenciales para esta integración.'}</p>
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#C9A84C] hover:text-[#E0C97A] underline underline-offset-2"
            >
              Ver documentación →
            </a>
          )}
        </div>
      )}
      {configured && children}
    </div>
  )
}

export const STATE_LABELS: Record<string, string> = {
  planificada: 'Planificada',
  en_curso: 'En curso',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
}

export const STATE_COLORS: Record<string, string> = {
  planificada: 'text-blue-400 border-blue-700/40 bg-blue-950/30',
  en_curso: 'text-emerald-400 border-emerald-700/40 bg-emerald-950/30',
  pausada: 'text-amber-400 border-amber-700/40 bg-amber-950/30',
  finalizada: 'text-gray-400 border-gray-700 bg-gray-900/40',
}
