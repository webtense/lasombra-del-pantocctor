'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SummaryTab from './SummaryTab'
import AnalyticsTab from './AnalyticsTab'
import MarketingTab from './MarketingTab'
import IntegrationsTab from './IntegrationsTab'
import AuditTab from './AuditTab'

type Tab = 'resumen' | 'analitica' | 'marketing' | 'integraciones' | 'auditoria'

export default function DashboardClient() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumen')

  const logout = async () => {
    await fetch('/api/admin/dashboard/auth', { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#050810] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white mb-1">Dashboard de Métricas y KPIs</h1>
            <p className="text-gray-500 text-sm">La Sombra del Pantocrátor</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-4 py-2 rounded text-sm transition-all">
              Panel Admin
            </Link>
            <button onClick={logout} className="border border-gray-700 text-gray-500 hover:text-gray-300 px-4 py-2 rounded text-sm transition-all">
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex gap-1 mb-8 border-b border-gray-800 overflow-x-auto">
          {([
            ['resumen', 'Resumen de negocio'],
            ['analitica', 'Analítica'],
            ['marketing', 'Marketing'],
            ['integraciones', 'Integraciones'],
            ['auditoria', 'Auditoría'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'resumen' && <SummaryTab />}
        {tab === 'analitica' && <AnalyticsTab />}
        {tab === 'marketing' && <MarketingTab />}
        {tab === 'integraciones' && <IntegrationsTab />}
        {tab === 'auditoria' && <AuditTab />}
      </div>
    </div>
  )
}
