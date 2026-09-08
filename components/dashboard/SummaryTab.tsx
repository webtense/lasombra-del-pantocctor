'use client'

import { useEffect, useState } from 'react'
import { StatCard, Card } from './ui'

type Summary = {
  configured: boolean
  stripeConfigured?: boolean
  error?: string
  visits?: { last7d: number; last30d: number }
  purchases?: {
    totalCount: number | null
    today: number | null
    last7d: number | null
    revenueLast7d: number | null
    avgPriceLast7d: number | null
    revenueTotal: number | null
    stripePaidTotal: number | null
  }
  testers?: { count: number }
  reviews?: { count: number; avgRating: number | null }
  ga4Links?: { realtime: string; acquisition: string }
}

const eur = (n: number | null | undefined) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n)

export default function SummaryTab() {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard/summary')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const ga4Links = data?.ga4Links

  return (
    <div className="space-y-8">
      {data?.error && (
        <div className="bg-red-950/30 border border-red-700/40 rounded-lg p-4 text-red-400 text-sm">{data.error}</div>
      )}

      <div>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          Visitas web
          <a
            href={ga4Links?.acquisition || 'https://analytics.google.com'}
            target="_blank"
            rel="noreferrer"
            className="text-[#C9A84C] text-xs font-normal hover:text-[#E0C97A] underline underline-offset-2"
          >
            Ver en Google Analytics →
          </a>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Últimos 7 días" value={data?.visits?.last7d ?? '—'} loading={loading} />
          <StatCard label="Último mes" value={data?.visits?.last30d ?? '—'} loading={loading} />
          <StatCard label="Testers inscritos" value={data?.testers?.count ?? '—'} loading={loading} />
          <StatCard
            label="Reseñas recibidas"
            value={data?.reviews?.count ?? '—'}
            sub={data?.reviews?.avgRating ? `★ ${data.reviews.avgRating.toFixed(1)} media` : undefined}
            loading={loading}
          />
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold text-sm mb-3">Compras directas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Compras (7 días)" value={num(data?.purchases?.last7d)} sub="Stripe" loading={loading} />
          <StatCard label="Ingresos (7 días)" value={eur(data?.purchases?.revenueLast7d)} sub="Stripe" loading={loading} />
          <StatCard label="Precio medio (7 días)" value={eur(data?.purchases?.avgPriceLast7d)} sub="Stripe" loading={loading} />
          <StatCard label="Ingresos totales" value={eur(data?.purchases?.revenueTotal)} sub="Stripe" loading={loading} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Compras entregadas"
            value={num(data?.purchases?.totalCount)}
            sub="tabla purchases"
            loading={loading}
          />
          <StatCard label="Compras hoy" value={num(data?.purchases?.today)} sub="tabla purchases" loading={loading} />
          <StatCard
            label="Cobros en Stripe"
            value={num(data?.purchases?.stripePaidTotal)}
            sub="sesiones pagadas"
            loading={loading}
          />
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Los importes salen de Stripe (sesiones de pago con <code className="text-gray-500">payment_status=paid</code>);
          el precio no se guarda en Supabase. Los recuentos de compras entregadas salen de la tabla{' '}
          <code className="text-gray-500">purchases</code>. Si &quot;Compras entregadas&quot; y &quot;Cobros en
          Stripe&quot; no cuadran, hay cobros que el webhook no llegó a registrar.
        </p>
        {data && data.stripeConfigured === false && (
          <p className="text-amber-500/80 text-xs mt-2">
            Stripe no configurado (<code>STRIPE_SECRET_KEY</code>): las cifras en euros no están disponibles.
          </p>
        )}
      </div>

      {!data?.configured && !loading && (
        <Card title="Supabase">
          <p className="text-gray-500 text-sm">
            No configurado — faltan <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </Card>
      )}
    </div>
  )
}
