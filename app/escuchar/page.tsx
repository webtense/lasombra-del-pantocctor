'use client'

import { useEffect, useState } from 'react'
import AudiobookPlayer from '@/components/AudiobookPlayer'

const AUTH_KEY = 'lsp_auth'

export default function EscucharPage() {
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading')
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    setStatus(stored === '1' ? 'authenticated' : 'unauthenticated')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setError(false)
    try {
      const res = await fetch('/api/auth/escuchar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: input }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        localStorage.setItem(AUTH_KEY, '1')
        setStatus('authenticated')
      } else {
        setError(true)
        setInput('')
      }
    } catch {
      setError(true)
      setInput('')
    } finally {
      setChecking(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="h-full bg-[#050810] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return <AudiobookPlayer />
  }

  return (
    <div className="h-full bg-[#050810] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-serif text-white mb-2">La Sombra del Pantocrator</h1>
          <p className="text-gray-400 text-sm">Audiolibro</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0D1117] border border-[#C9A84C]/20 rounded-xl p-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-2">
              Contraseña de acceso
            </label>
            <input
              id="password"
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError(false)
              }}
              placeholder="Introduce la contraseña"
              autoComplete="current-password"
              className={`w-full bg-[#050810] border rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-[#C9A84C]/60 ${
                error ? 'border-red-500' : 'border-[#C9A84C]/20'
              }`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">Contraseña incorrecta</p>
            )}
          </div>

          <button
            type="submit"
            disabled={checking}
            className="w-full bg-[#C9A84C] hover:bg-[#D4B55C] disabled:opacity-50 text-[#050810] font-semibold py-3 rounded-lg transition-colors"
          >
            {checking ? 'Comprobando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}
