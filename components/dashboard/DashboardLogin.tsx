'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// A diferencia del login de /admin (legacy), este NO guarda nada en
// sessionStorage. Al validar credenciales, el servidor (/api/admin/dashboard/auth)
// pone una cookie httpOnly firmada; aquí solo pedimos a Next que vuelva a
// renderizar la página del servidor (router.refresh) para que
// app/admin/dashboard/page.tsx relea esa cookie y muestre el dashboard.
export default function DashboardLogin({ title = 'Dashboard KPIs' }: { title?: string } = {}) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/dashboard/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const body = await res.json().catch(() => ({}))
        setError(body.error || 'Usuario o contraseña incorrectos')
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
          <div className="w-12 h-12 rounded-full border border-[#C9A84C]/40 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9M13 17V5M8 17v-3" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-white mb-1">{title}</h1>
          <p className="text-gray-500 text-sm">La Sombra del Pantocrátor</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none transition-colors"
              placeholder="usuario"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none transition-colors"
              placeholder="••••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold py-3 rounded transition-colors"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
