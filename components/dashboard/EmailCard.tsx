'use client'

import { useCallback, useEffect, useState } from 'react'
import { IntegrationStatus } from './ui'

// Estadísticas de la última campaña de Brevo. Vive en su propio fichero
// porque lo usan dos pestañas: "Marketing" (como una integración más) y
// "Mailing" (para ver el resultado justo después de enviar).
//
// `refreshKey` permite a Mailing forzar una relectura tras un envío: la
// campaña recién enviada tarda un poco en aparecer con estadísticas, así que
// el botón de recargar es parte de la tarjeta.
export default function EmailCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<{
    configured: boolean
    subscribers?: number
    lastCampaign?: { name: string; delivered: number; uniqueOpens: number; openRate: number | null } | null
    docsUrl?: string
    message?: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/dashboard/email')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <IntegrationStatus name="Email (Brevo)" configured={!!data?.configured} docsUrl={data?.docsUrl} message={data?.message}>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-gray-600 uppercase tracking-wider mb-1">Suscriptores</p>
          <p className="text-[#C9A84C] text-lg font-semibold">{data?.subscribers ?? '—'}</p>
        </div>
        <div>
          <p className="text-gray-600 uppercase tracking-wider mb-1">Tasa de apertura</p>
          <p className="text-[#C9A84C] text-lg font-semibold">
            {data?.lastCampaign?.openRate != null ? `${(data.lastCampaign.openRate * 100).toFixed(1)}%` : 'Sin datos'}
          </p>
        </div>
      </div>
      {data?.lastCampaign && (
        <p className="text-gray-600 text-xs mt-3">
          Última campaña: {data.lastCampaign.name}
          {data.lastCampaign.delivered != null && ` · ${data.lastCampaign.delivered} entregados`}
        </p>
      )}
      <button
        onClick={load}
        disabled={loading}
        className="mt-3 text-[10px] uppercase tracking-wider text-gray-600 hover:text-[#C9A84C] disabled:opacity-50"
      >
        {loading ? 'Actualizando…' : 'Actualizar estadísticas'}
      </button>
    </IntegrationStatus>
  )
}
