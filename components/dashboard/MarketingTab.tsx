'use client'

import { useEffect, useRef, useState } from 'react'
import { StatCard, Card, IntegrationStatus, STATE_LABELS, STATE_COLORS } from './ui'
import EmailCard from './EmailCard'
import type { MarketingCampaign, InstagramManualPost } from '@/lib/supabase'

const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0)

// ─────────────────────────────────────────────
// KPIs: CAC, LTV, conversion rate
// ─────────────────────────────────────────────
function KpiRow() {
  const [data, setData] = useState<{
    stripeConfigured: boolean
    adSpendConfigured: boolean
    visits30d: number | null
    paidCount: number | null
    cac: number | null
    ltv: number | null
    conversionRate: number | null
  } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard/kpis').then((r) => r.json()).then(setData)
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatCard
        label="CAC (coste por adquisición)"
        value={data?.adSpendConfigured && data.cac != null ? eur(data.cac) : 'No configurado'}
        sub={data?.adSpendConfigured ? undefined : 'Falta AD_SPEND_LAST_30D o integración Meta/Google Ads'}
      />
      <StatCard
        label="LTV (valor por cliente)"
        value={data?.stripeConfigured && data.ltv != null ? eur(data.ltv) : 'No configurado'}
        sub={data?.stripeConfigured ? 'Aprox. = ticket medio (producto de compra única)' : 'Requiere Stripe conectado'}
      />
      <StatCard
        label="Conversion rate (30d)"
        value={data?.conversionRate != null ? `${(data.conversionRate * 100).toFixed(2)}%` : '—'}
        sub={data?.visits30d ? `${data.paidCount ?? 0} compras / ${data.visits30d} visitas` : undefined}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Campañas planeadas
// ─────────────────────────────────────────────
function CampaignsTable() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fecha: '', plataforma: '', presupuesto: '', estado: 'planificada', notas: '' })

  const load = () => {
    setLoading(true)
    fetch('/api/admin/dashboard/campaigns')
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured !== false)
        setCampaigns(d.campaigns || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/dashboard/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ fecha: '', plataforma: '', presupuesto: '', estado: 'planificada', notas: '' })
        setShowForm(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const updateEstado = async (id: number, estado: string) => {
    await fetch(`/api/admin/dashboard/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    load()
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar esta campaña?')) return
    await fetch(`/api/admin/dashboard/campaigns/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Card
      title="Próximas campañas planeadas"
      action={
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-3 py-1.5 rounded transition-all"
        >
          {showForm ? 'Cancelar' : '+ Nueva campaña'}
        </button>
      }
    >
      {!configured && (
        <p className="text-gray-500 text-sm mb-4">
          No configurado — falta Supabase, o crea la tabla con <code>supabase-schema-campaigns.sql</code>.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 bg-[#050810] border border-gray-800 rounded p-4">
          <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input required placeholder="Plataforma" value={form.plataforma} onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input type="number" step="0.01" placeholder="Presupuesto €" value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs">
            {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button type="submit" disabled={saving} className="bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold rounded px-3 py-2 text-xs">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <input placeholder="Notas (opcional)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="col-span-2 md:col-span-5 bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Plataforma', 'Presupuesto', 'Estado', 'Notas', ''].map((h) => (
                <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{c.fecha}</td>
                <td className="px-4 py-3 text-[#C9A84C]">{c.plataforma}</td>
                <td className="px-4 py-3 text-gray-400">{eur(c.presupuesto)}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.estado}
                    onChange={(e) => updateEstado(c.id, e.target.value)}
                    className={`text-xs px-2 py-0.5 rounded-full border bg-transparent ${STATE_COLORS[c.estado]}`}
                  >
                    {Object.entries(STATE_LABELS).map(([k, v]) => <option key={k} value={k} className="bg-[#0D1117] text-white">{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{c.notas || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c.id)} className="text-gray-600 hover:text-red-400">Eliminar</button>
                </td>
              </tr>
            ))}
            {!loading && campaigns.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-600 py-8">Sin campañas planificadas todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────
// Instagram — API real (últimos 10 posts) o panel "no conectado"
// ─────────────────────────────────────────────
type IgPost = {
  id: string
  permalink: string
  caption?: string
  media_type: string
  media_url?: string
  timestamp: string
  likes: number
  comments: number
  saves: number | null
}

function InstagramMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-white font-semibold text-sm">{value}</p>
      <p className="text-gray-600 text-[10px] uppercase tracking-wider">{label}</p>
    </div>
  )
}

function InstagramPostsGrid({ posts }: { posts: IgPost[] }) {
  if (posts.length === 0) {
    return <p className="text-gray-600 text-sm py-4 text-center">Sin posts todavía</p>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {posts.map((p) => (
        <a
          key={p.id}
          href={p.permalink}
          target="_blank"
          rel="noreferrer"
          className="block bg-[#050810] border border-gray-800 rounded-lg overflow-hidden hover:border-[#C9A84C]/50 transition-colors"
        >
          <div className="aspect-square bg-[#1F2937]">
            {p.media_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.media_url} alt={p.caption?.slice(0, 40) || 'Post de Instagram'} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-3">
            <p className="text-gray-400 text-xs truncate mb-2">{p.caption || '(sin caption)'}</p>
            <div className="grid grid-cols-3 gap-1">
              <InstagramMetric label="Likes" value={p.likes} />
              <InstagramMetric label="Coment." value={p.comments} />
              <InstagramMetric label="Guard." value={p.saves ?? '—'} />
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// QR generado con un servicio público (solo apunta a la URL de docs, sin
// datos sensibles) — evita añadir una dependencia de generación de QR al
// proyecto para un enlace estático.
function DocsQr({ url }: { url: string }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=8&data=${encodeURIComponent(url)}`
  return (
    <div className="flex flex-col items-center gap-2 bg-[#050810] border border-gray-800 rounded-lg p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrSrc} alt="QR con el enlace a la documentación de Instagram Graph API" width={140} height={140} className="rounded" />
      <p className="text-gray-600 text-[10px] text-center max-w-[160px]">
        Escanea para abrir la guía de vinculación en el móvil
      </p>
    </div>
  )
}

function ManualTrackingTable() {
  const [posts, setPosts] = useState<InstagramManualPost[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const [csvMsg, setCsvMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    url: '', fecha: '', caption: '', likes_esperados: '', comments_esperados: '', saves_esperados: '', notas: '',
  })

  const load = () => {
    setLoading(true)
    fetch('/api/admin/dashboard/instagram-tracking')
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured !== false)
        setPosts(d.posts || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/dashboard/instagram-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ url: '', fecha: '', caption: '', likes_esperados: '', comments_esperados: '', saves_esperados: '', notas: '' })
        setShowForm(false)
        load()
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este post trackeado?')) return
    await fetch(`/api/admin/dashboard/instagram-tracking/${id}`, { method: 'DELETE' })
    load()
  }

  const handleCsvFile = async (file: File) => {
    setCsvError(null)
    setCsvMsg(null)
    const csv = await file.text()
    const res = await fetch('/api/admin/dashboard/instagram-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    })
    const d = await res.json()
    if (!res.ok) {
      setCsvError(d.error || 'Error al importar el CSV')
      return
    }
    setCsvMsg(`Importadas ${d.inserted} filas${d.skipped ? ` (${d.skipped} ignoradas por faltar url/fecha)` : ''}`)
    load()
  }

  return (
    <Card
      title="Tracking manual de Instagram"
      action={
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f) }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs border border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded transition-all"
          >
            Cargar CSV
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="text-xs border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-3 py-1.5 rounded transition-all"
          >
            {showForm ? 'Cancelar' : '+ Nuevo post'}
          </button>
        </div>
      }
    >
      <p className="text-gray-600 text-xs mb-4">
        Anota aquí posts publicados o planificados con sus métricas esperadas — útil mientras no está conectada
        la API, o como registro paralelo aunque sí lo esté. CSV admitido con cabeceras:{' '}
        <code className="text-gray-500">url,fecha,caption,likes_esperados,comments_esperados,saves_esperados,notas</code>
      </p>

      {csvError && <p className="text-red-400 text-xs mb-3">{csvError}</p>}
      {csvMsg && <p className="text-emerald-400 text-xs mb-3">{csvMsg}</p>}

      {!configured && (
        <p className="text-gray-500 text-sm mb-4">
          No configurado — falta Supabase, o crea la tabla con <code>supabase-schema-instagram-tracking.sql</code>.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 bg-[#050810] border border-gray-800 rounded p-4">
          <input required placeholder="URL del post" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="col-span-2 bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input placeholder="Caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })}
            className="col-span-2 md:col-span-4 bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input type="number" placeholder="Likes esperados" value={form.likes_esperados} onChange={(e) => setForm({ ...form, likes_esperados: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input type="number" placeholder="Coment. esperados" value={form.comments_esperados} onChange={(e) => setForm({ ...form, comments_esperados: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <input type="number" placeholder="Guardados esperados" value={form.saves_esperados} onChange={(e) => setForm({ ...form, saves_esperados: e.target.value })}
            className="bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
          <button type="submit" disabled={saving} className="bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold rounded px-3 py-2 text-xs">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <input placeholder="Notas (opcional)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
            className="col-span-2 md:col-span-4 bg-[#0D1117] border border-gray-700 text-white rounded px-3 py-2 text-xs" />
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'URL', 'Caption', 'Likes esp.', 'Coment. esp.', 'Guard. esp.', ''].map((h) => (
                <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{p.fecha}</td>
                <td className="px-4 py-3 max-w-[160px] truncate">
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">{p.url}</a>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{p.caption || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{p.likes_esperados ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400">{p.comments_esperados ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400">{p.saves_esperados ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(p.id)} className="text-gray-600 hover:text-red-400">Eliminar</button>
                </td>
              </tr>
            ))}
            {!loading && posts.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-600 py-8">Sin posts trackeados todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function InstagramCard() {
  const [data, setData] = useState<{ configured: boolean; posts?: IgPost[]; docsUrl?: string; message?: string; error?: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/dashboard/instagram').then((r) => r.json()).then(setData)
  }, [])

  return (
    <div className="space-y-4">
      <IntegrationStatus
        name="Instagram — últimos 10 posts"
        configured={!!data?.configured}
        docsUrl={data?.docsUrl}
        message={data?.message}
      >
        {data?.error && <p className="text-amber-400 text-xs mb-3">{data.error}</p>}
        {data?.configured && !data.error && <InstagramPostsGrid posts={data.posts || []} />}
      </IntegrationStatus>

      {!data?.configured && data !== null && (
        <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 items-start">
          <DocsQr url={data.docsUrl || 'https://developers.facebook.com/docs/instagram-api/guides/insights'} />
          <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-4 text-xs text-gray-500 space-y-2">
            <p className="text-gray-400 font-semibold">Para conectar la cuenta real:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Crea/usa una app en <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-[#C9A84C] hover:underline">Meta for Developers</a>.</li>
              <li>Meta App → Settings → Instagram: vincula la cuenta de Instagram (debe ser cuenta Business o Creator, conectada a una página de Facebook).</li>
              <li>Genera un token de larga duración con permisos <code>instagram_basic</code> e <code>instagram_manage_insights</code>.</li>
              <li>Añade <code>INSTAGRAM_ACCESS_TOKEN</code> e <code>INSTAGRAM_BUSINESS_ACCOUNT_ID</code> en las variables de entorno del proyecto.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Email (Brevo)
// ─────────────────────────────────────────────
export default function MarketingTab() {
  return (
    <div className="space-y-8">
      <KpiRow />
      <CampaignsTable />
      <InstagramCard />
      <ManualTrackingTable />
      <EmailCard />
    </div>
  )
}
