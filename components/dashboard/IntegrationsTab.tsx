'use client'

import { useEffect, useState } from 'react'
import { IntegrationStatus } from './ui'

const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0)

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────
// GA4
// ─────────────────────────────────────────────
function Ga4Card() {
  const [data, setData] = useState<{ configured: boolean; docsUrl?: string; message?: string; error?: string; raw?: unknown } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard/ga4').then((r) => r.json()).then(setData)
  }, [])

  return (
    <IntegrationStatus name="Google Analytics 4" configured={!!data?.configured} docsUrl={data?.docsUrl} message={data?.message}>
      {data?.error && <p className="text-amber-400 text-xs">{data.error}</p>}
      {!data?.error && (
        <p className="text-gray-500 text-xs">
          Sesiones y compras de los últimos 7/30 días recibidas de la Data API. Revisa el detalle completo en{' '}
          <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">
            analytics.google.com
          </a>.
        </p>
      )}
    </IntegrationStatus>
  )
}

// ─────────────────────────────────────────────
// Stripe
// ─────────────────────────────────────────────
type StripeTx = { id: string; created: string | null; status: string; amount: number; currency: string; customerEmail: string | null }

function StripeCard() {
  const [data, setData] = useState<{
    configured: boolean
    docsUrl?: string
    message?: string
    error?: string
    revenueTotal?: number
    avgOrderValue?: number
    paidCount?: number
    transactions?: StripeTx[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard/stripe').then((r) => r.json()).then(setData)
  }, [])

  return (
    <IntegrationStatus name="Stripe" configured={!!data?.configured} docsUrl={data?.docsUrl} message={data?.message}>
      {data?.error && <p className="text-amber-400 text-xs mb-3">{data.error}</p>}
      {data?.configured && !data.error && (
        <>
          <div className="grid grid-cols-3 gap-3 text-xs mb-4">
            <div>
              <p className="text-gray-600 uppercase tracking-wider mb-1">Ingresos</p>
              <p className="text-[#C9A84C] font-semibold">{eur(data.revenueTotal || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600 uppercase tracking-wider mb-1">Ticket medio</p>
              <p className="text-[#C9A84C] font-semibold">{eur(data.avgOrderValue || 0)}</p>
            </div>
            <div>
              <p className="text-gray-600 uppercase tracking-wider mb-1">Ventas</p>
              <p className="text-[#C9A84C] font-semibold">{data.paidCount ?? 0}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Fecha', 'Estado', 'Importe', 'Cliente'].map((h) => (
                    <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.transactions || []).map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 text-gray-400 font-mono whitespace-nowrap">{formatDate(t.created)}</td>
                    <td className="px-3 py-2">
                      <span className={t.status === 'paid' ? 'text-emerald-400' : 'text-gray-500'}>{t.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-300">{eur(t.amount)}</td>
                    <td className="px-3 py-2 text-gray-500">{t.customerEmail || '—'}</td>
                  </tr>
                ))}
                {(data.transactions || []).length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-600 py-6">Sin transacciones todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </IntegrationStatus>
  )
}

// ─────────────────────────────────────────────
// Google Search Console
// ─────────────────────────────────────────────
function GscCard() {
  const [data, setData] = useState<{
    configured: boolean
    docsUrl?: string
    message?: string
    error?: string
    impressions?: number
    clicks?: number
    ctr?: number
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard/gsc').then((r) => r.json()).then(setData)
  }, [])

  return (
    <IntegrationStatus name="Google Search Console" configured={!!data?.configured} docsUrl={data?.docsUrl} message={data?.message}>
      {data?.error && <p className="text-amber-400 text-xs">{data.error}</p>}
      {data?.configured && !data.error && (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-gray-600 uppercase tracking-wider mb-1">Impresiones (28d)</p>
            <p className="text-[#C9A84C] font-semibold">{data.impressions ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-600 uppercase tracking-wider mb-1">Clics</p>
            <p className="text-[#C9A84C] font-semibold">{data.clicks ?? 0}</p>
          </div>
          <div>
            <p className="text-gray-600 uppercase tracking-wider mb-1">CTR</p>
            <p className="text-[#C9A84C] font-semibold">{((data.ctr || 0) * 100).toFixed(2)}%</p>
          </div>
        </div>
      )}
    </IntegrationStatus>
  )
}

export default function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <p className="text-gray-600 text-xs">
        Instagram y Email (Brevo) se muestran en la pestaña Marketing. Aquí el resto de fuentes de datos externas.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Ga4Card />
        <GscCard />
      </div>
      <StripeCard />
    </div>
  )
}
