'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabase, type Visit, type AppEvent, type Lead } from '@/lib/supabase'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────
// Shared components
// ─────────────────────────────────────────────
function StatsCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="font-serif text-3xl text-[#C9A84C] font-bold">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data }: { data: [string, number][] }) {
  const max = data[0]?.[1] || 1
  return (
    <div className="space-y-3">
      {data.map(([label, count]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-300 font-mono truncate max-w-[70%]">{label}</span>
            <span className="text-[#C9A84C] font-mono">{count}</span>
          </div>
          <div className="h-1 bg-[#1F2937] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E0C97A] rounded-full"
              style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-gray-600 text-sm">Sin datos</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Visitas
// ─────────────────────────────────────────────
function VisitsTab() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const fetch_ = async () => {
    setLoading(true)
    const sb = getSupabase()
    if (!sb) { setLoading(false); return }
    const { data, error } = await sb
      .from('visits').select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (error) setError(error.message)
    else setVisits(data as Visit[])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const uniqueSessions = new Set(visits.map((v) => v.session_id).filter(Boolean)).size
  const pageBreakdown = Object.entries(
    visits.reduce<Record<string, number>>((a, v) => { a[v.page || '/'] = (a[v.page || '/'] || 0) + 1; return a }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const deviceBreakdown = Object.entries(
    visits.reduce<Record<string, number>>((a, v) => { a[v.device_type || 'unknown'] = (a[v.device_type || 'unknown'] || 0) + 1; return a }, {})
  ).sort((a, b) => b[1] - a[1])
  const countryBreakdown = Object.entries(
    visits.reduce<Record<string, number>>((a, v) => { if (v.country) { a[v.country] = (a[v.country] || 0) + 1 } return a }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div>
      {error && <div className="bg-red-950/30 border border-red-700/40 rounded-lg p-4 mb-6 text-red-400 text-sm">{error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Visitas" value={visits.length} />
        <StatsCard label="Sesiones únicas" value={uniqueSessions} />
        <StatsCard label="Páginas" value={pageBreakdown.length} />
        <StatsCard label="Más visitada" value={pageBreakdown[0]?.[0] || '—'} sub={pageBreakdown[0] ? `${pageBreakdown[0][1]} visitas` : ''} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Top páginas</h2>
          <BarChart data={pageBreakdown} />
        </div>
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Dispositivos</h2>
          <BarChart data={deviceBreakdown} />
        </div>
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Países</h2>
          <BarChart data={countryBreakdown} />
        </div>
      </div>
      <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#C9A84C]/15 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Registro{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
          <span className="text-gray-500 text-xs">Pág. {page + 1} · {PAGE_SIZE}/pág</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Fecha', 'Página', 'Dispositivo', 'País', 'Referrer', 'Sesión'].map(h => (
                  <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <tr key={v.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                  <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{formatDate(v.created_at)}</td>
                  <td className="px-4 py-3 text-[#C9A84C] font-mono">{v.page || '/'}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{v.device_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{v.country || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{v.referrer || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{v.session_id?.slice(0, 8) || '—'}</td>
                </tr>
              ))}
              {!loading && visits.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-600 py-8">Sin visitas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="border border-gray-700 text-gray-400 disabled:opacity-30 hover:text-white px-4 py-1.5 rounded text-xs">← Anterior</button>
          <button onClick={() => setPage(p => p + 1)} disabled={visits.length < PAGE_SIZE}
            className="border border-gray-700 text-gray-400 disabled:opacity-30 hover:text-white px-4 py-1.5 rounded text-xs">Siguiente →</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Eventos
// ─────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  download_epub: '📥 EPUB',
  download_audio: '📥 Audio',
  listen_sample: '▶ Muestra',
  play_start: '▶ Play',
  chapter_start: '▶ Capítulo',
  chapter_complete: '✓ Cap. terminado',
  purchase: '💳 Compra',
}

function EventsTab() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const fetch_ = async () => {
    setLoading(true)
    const sb = getSupabase()
    if (!sb) { setLoading(false); return }
    const { data } = await sb
      .from('events').select('*')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (data) setEvents(data as AppEvent[])
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  const byType = Object.entries(
    events.reduce<Record<string, number>>((a, e) => { a[e.event_type] = (a[e.event_type] || 0) + 1; return a }, {})
  ).sort((a, b) => b[1] - a[1])

  const downloads = events.filter(e => e.event_type === 'download_epub' || e.event_type === 'download_audio').length
  const plays = events.filter(e => e.event_type === 'play_start').length
  const completed = events.filter(e => e.event_type === 'chapter_complete').length
  const purchases = events.filter(e => e.event_type === 'purchase').length

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Descargas" value={downloads} />
        <StatsCard label="Plays audiolibro" value={plays} />
        <StatsCard label="Capítulos terminados" value={completed} />
        <StatsCard label="Compras" value={purchases} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Por tipo de evento</h2>
          <BarChart data={byType.map(([k, v]) => [EVENT_LABELS[k] || k, v])} />
        </div>
        <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-5">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Capítulos más escuchados</h2>
          <BarChart data={
            Object.entries(
              events.filter(e => e.event_type === 'chapter_start' && e.event_data?.chapter_title)
                .reduce<Record<string, number>>((a, e) => {
                  const t = String(e.event_data?.chapter_title || '')
                  a[t] = (a[t] || 0) + 1; return a
                }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 8)
          } />
        </div>
      </div>
      <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#C9A84C]/15 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Registro de eventos{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
          <span className="text-gray-500 text-xs">Pág. {page + 1}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Fecha', 'Evento', 'Datos', 'Dispositivo', 'País', 'Sesión'].map(h => (
                  <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                  <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{formatDate(ev.created_at)}</td>
                  <td className="px-4 py-3 text-[#C9A84C]">{EVENT_LABELS[ev.event_type] || ev.event_type}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono max-w-[200px] truncate">
                    {ev.event_data ? JSON.stringify(ev.event_data) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{ev.device_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{ev.country || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{ev.session_id?.slice(0, 8) || '—'}</td>
                </tr>
              ))}
              {!loading && events.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-600 py-8">Sin eventos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-800 flex gap-3 justify-end">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="border border-gray-700 text-gray-400 disabled:opacity-30 hover:text-white px-4 py-1.5 rounded text-xs">← Anterior</button>
          <button onClick={() => setPage(p => p + 1)} disabled={events.length < PAGE_SIZE}
            className="border border-gray-700 text-gray-400 disabled:opacity-30 hover:text-white px-4 py-1.5 rounded text-xs">Siguiente →</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab: Leads
// ─────────────────────────────────────────────
function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) { setLoading(false); return }
    sb.from('leads').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setLeads(data as Lead[]); setLoading(false) })
  }, [])

  const bySource = Object.entries(
    leads.reduce<Record<string, number>>((a, l) => { a[l.source || 'unknown'] = (a[l.source || 'unknown'] || 0) + 1; return a }, {})
  ).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatsCard label="Emails capturados" value={leads.length} />
        <StatsCard label="Fuente principal" value={bySource[0]?.[0] || '—'} />
        <StatsCard label="Hoy" value={leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} />
      </div>
      <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#C9A84C]/15">
          <h2 className="text-white font-semibold text-sm">Lista de emails{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                {['Fecha', 'Email', 'Fuente', 'Sesión'].map(h => (
                  <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                  <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 text-[#C9A84C]">{l.email}</td>
                  <td className="px-4 py-3 text-gray-400">{l.source || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{l.session_id?.slice(0, 8) || '—'}</td>
                </tr>
              ))}
              {!loading && leads.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-600 py-8">Sin emails capturados todavía</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Dashboard principal
// ─────────────────────────────────────────────
type Tab = 'visitas' | 'eventos' | 'leads'

// Solo se monta cuando app/admin/page.tsx ya ha validado la cookie httpOnly
// en el servidor. Este componente no decide nada sobre autenticación.
export default function AdminPanelClient() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('eventos')

  // Cerrar sesión = borrar la cookie en el servidor (DELETE), no un flag local.
  const logout = async () => {
    await fetch('/api/admin/dashboard/auth', { method: 'DELETE' }).catch(() => {})
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#050810] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-white mb-1">Panel Admin</h1>
            <p className="text-gray-500 text-sm">La Sombra del Pantocrátor</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-4 py-2 rounded text-sm transition-all">
              Dashboard KPIs
            </Link>
            <Link href="/admin/testers" className="border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-4 py-2 rounded text-sm transition-all">
              Testers
            </Link>
            <button onClick={logout}
              className="border border-gray-700 text-gray-500 hover:text-gray-300 px-4 py-2 rounded text-sm transition-all">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-800">
          {(['eventos', 'visitas', 'leads'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-[#C9A84C] text-[#C9A84C]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              {t === 'eventos' ? 'Acciones' : t === 'visitas' ? 'Visitas' : 'Leads / Emails'}
            </button>
          ))}
        </div>

        {tab === 'visitas' && <VisitsTab />}
        {tab === 'eventos' && <EventsTab />}
        {tab === 'leads' && <LeadsTab />}
      </div>
    </div>
  )
}
