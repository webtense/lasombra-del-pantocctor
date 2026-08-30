'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getSupabase, type Tester, type TesterDownload, type Review } from '@/lib/supabase'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const FILE_LABELS: Record<string, string> = {
  epub: '📚 EPUB',
  pdf: '📄 PDF',
  audio: '🎧 Audio',
}

// ─────────────────────────────────────────────
// Login (mismo esquema que /admin)
// ─────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        sessionStorage.setItem('lsp_admin_auth', '1')
        onLogin()
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch {
      setError('Error de red')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-white mb-1">Panel Admin</h1>
          <p className="text-gray-500 text-sm">Testers — La Sombra del Pantocrátor</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Usuario</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none" autoFocus />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none" />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold py-3 rounded">
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Crear tester + generar link
// ─────────────────────────────────────────────
function NewTesterForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ url: string; expiresAt: string; emailSent: boolean } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!email.includes('@')) { setError('Email no válido'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/testers/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); setLoading(false); return }
      setResult({ url: data.url, expiresAt: data.expiresAt, emailSent: data.emailSent })
      setEmail('')
      setName('')
      onCreated()
    } catch {
      setError('Error de red')
    }
    setLoading(false)
  }

  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg p-6 mb-8">
      <h2 className="text-white font-semibold text-sm mb-4">Nuevo tester</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <input type="email" placeholder="email@tester.com" value={email} onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-[#050810] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-2.5 outline-none text-sm" />
        <input type="text" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-[#050810] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-2.5 outline-none text-sm" />
        <button type="submit" disabled={loading}
          className="bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold px-5 py-2.5 rounded text-sm whitespace-nowrap">
          {loading ? 'Creando...' : 'Crear y generar link'}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      {result && (
        <div className="mt-4 bg-[#050810] border border-[#C9A84C]/30 rounded-lg p-4 text-sm">
          <p className="text-gray-400 mb-1">
            {result.emailSent ? '✓ Email enviado. ' : '⚠ Email no enviado (revisa BREVO_API_KEY o cópialo a mano). '}
            Caduca: {formatDate(result.expiresAt)}
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={result.url} className="flex-1 bg-[#0D1117] border border-gray-700 rounded px-3 py-2 text-[#C9A84C] font-mono text-xs" />
            <button
              onClick={() => navigator.clipboard.writeText(result.url)}
              className="border border-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded text-xs whitespace-nowrap"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Tabla testers con botón "Generar link"
// ─────────────────────────────────────────────
function TestersTable({ testers, loading, refresh }: { testers: Tester[]; loading: boolean; refresh: () => void }) {
  const [genFor, setGenFor] = useState<number | null>(null)
  const [linkResult, setLinkResult] = useState<Record<number, { url: string; expiresAt: string }>>({})

  const generate = async (t: Tester) => {
    setGenFor(t.id)
    try {
      const res = await fetch('/api/admin/testers/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerId: t.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setLinkResult((prev) => ({ ...prev, [t.id]: { url: data.url, expiresAt: data.expiresAt } }))
        refresh()
      }
    } catch {
      // noop — el admin puede reintentar
    }
    setGenFor(null)
  }

  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-[#C9A84C]/15">
        <h2 className="text-white font-semibold text-sm">Testers{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Alta', 'Nombre', 'Email', 'Último link generado', ''].map((h) => (
                <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {testers.map((t) => (
              <tr key={t.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{formatDate(t.created_at)}</td>
                <td className="px-4 py-3 text-white">{t.name || '—'}</td>
                <td className="px-4 py-3 text-[#C9A84C]">{t.email}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[240px]">
                  {linkResult[t.id] ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono truncate">{linkResult[t.id].url}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(linkResult[t.id].url)}
                        className="text-gray-600 hover:text-white"
                        title="Copiar"
                      >
                        ⧉
                      </button>
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => generate(t)}
                    disabled={genFor === t.id}
                    className="border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 disabled:opacity-50 px-3 py-1.5 rounded text-xs whitespace-nowrap"
                  >
                    {genFor === t.id ? 'Generando...' : 'Generar link'}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && testers.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-600 py-8">Sin testers todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Historial de descargas
// ─────────────────────────────────────────────
function DownloadsTable({ downloads, loading }: { downloads: TesterDownload[]; loading: boolean }) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-[#C9A84C]/15">
        <h2 className="text-white font-semibold text-sm">Historial de descargas{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Fecha', 'Tester', 'Archivo', 'Dispositivo'].map((h) => (
                <th key={h} className="text-left text-gray-600 uppercase tracking-wider px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {downloads.map((d) => (
              <tr key={d.id} className="border-b border-gray-800/50 hover:bg-[#1A2035]/30">
                <td className="px-4 py-3 text-gray-400 font-mono whitespace-nowrap">{formatDate(d.created_at)}</td>
                <td className="px-4 py-3 text-white">{d.testers?.name || d.testers?.email || `#${d.tester_id}`}</td>
                <td className="px-4 py-3 text-[#C9A84C]">{FILE_LABELS[d.file_type] || d.file_type}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[260px] truncate">{d.user_agent || '—'}</td>
              </tr>
            ))}
            {!loading && downloads.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-600 py-8">Sin descargas todavía</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Reseñas
// ─────────────────────────────────────────────
function ReviewsTable({ reviews, loading }: { reviews: Review[]; loading: boolean }) {
  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-[#C9A84C]/15">
        <h2 className="text-white font-semibold text-sm">Reseñas{loading && <span className="text-gray-500 font-normal ml-2">Cargando...</span>}</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {reviews.map((r) => (
          <div key={r.id} className="px-6 py-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-medium text-sm">{r.name}</span>
              <span className="text-[#C9A84C] text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p className="text-gray-600 text-xs mb-2">{r.email || '—'} · {formatDate(r.created_at)}</p>
            {r.opinion && <p className="text-gray-400 text-sm leading-relaxed">{r.opinion}</p>}
          </div>
        ))}
        {!loading && reviews.length === 0 && (
          <p className="text-center text-gray-600 py-8 text-sm">Sin reseñas todavía</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
function Dashboard() {
  const [testers, setTesters] = useState<Tester[]>([])
  const [downloads, setDownloads] = useState<TesterDownload[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const sb = getSupabase()
    if (!sb) { setLoading(false); return }

    const [testersRes, downloadsRes, reviewsRes] = await Promise.all([
      sb.from('testers').select('*').order('created_at', { ascending: false }),
      sb.from('tester_downloads').select('*, testers(name,email)').order('created_at', { ascending: false }).limit(100),
      sb.from('reviews').select('*').order('created_at', { ascending: false }),
    ])

    if (testersRes.data) setTesters(testersRes.data as Tester[])
    if (downloadsRes.data) setDownloads(downloadsRes.data as unknown as TesterDownload[])
    if (reviewsRes.data) setReviews(reviewsRes.data as Review[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const logout = () => {
    sessionStorage.removeItem('lsp_admin_auth')
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#050810] pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-white mb-1">Testers</h1>
            <p className="text-gray-500 text-sm">La Sombra del Pantocrátor</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="border border-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded text-sm">
              ← Panel general
            </Link>
            <button onClick={logout} className="border border-gray-700 text-gray-500 hover:text-gray-300 px-4 py-2 rounded text-sm">
              Cerrar sesión
            </button>
          </div>
        </div>

        <NewTesterForm onCreated={load} />
        <TestersTable testers={testers} loading={loading} refresh={load} />
        <DownloadsTable downloads={downloads} loading={loading} />
        <ReviewsTable reviews={reviews} loading={loading} />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────
export default function AdminTestersPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('lsp_admin_auth') === '1') setAuthenticated(true)
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    )
  }

  return authenticated
    ? <Dashboard />
    : <LoginForm onLogin={() => setAuthenticated(true)} />
}
