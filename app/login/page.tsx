'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Acceso post-compra. Las credenciales se generan automáticamente en el
 * webhook de Stripe y se envían al comprador en el email de descarga.
 * Éxito → /panel (reproductor del audiolibro).
 */
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      let data: { ok?: boolean; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        // respuesta no-JSON (503 de infra, HTML de error, etc.)
      }

      if (!res.ok || !data.ok) {
        setError(data.error || 'No hemos podido iniciar sesión. Inténtalo de nuevo.')
        setLoading(false)
        return
      }

      // La cookie httpOnly ya viene en la respuesta. refresh() fuerza que el
      // Server Component de /panel vuelva a leerla.
      router.push('/panel')
      router.refresh()
    } catch {
      setError('Error de conexión. Comprueba tu red e inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-20 px-6">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">
              Acceso compradores
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-white mb-3">
            Entra en tu biblioteca
          </h1>
          <p className="text-gray-500 text-sm">
            Usa el email y la contraseña que te enviamos al comprar.
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleLogin}
          className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-8 space-y-5"
        >
          {error && (
            <div
              role="alert"
              className="bg-red-950/40 border border-red-500/40 text-red-300 text-sm rounded-lg px-4 py-3"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs tracking-widest uppercase text-gray-500 mb-2 font-sans"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-[#050810] border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/30 transition disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs tracking-widest uppercase text-gray-500 mb-2 font-sans"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-[#050810] border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#C9A84C]/60 focus:ring-1 focus:ring-[#C9A84C]/30 transition disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {/* Ayuda */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-600 text-sm">
            ¿Aún no lo tienes?{' '}
            <Link href="/descargar" className="text-[#C9A84C] hover:underline">
              Consigue el libro y el audiolibro
            </Link>
          </p>
          <p className="text-gray-700 text-xs">
            ¿No encuentras tu contraseña? Busca el correo «Tus descargas — La Sombra
            del Pantocrátor» o escribe a{' '}
            <a
              href="mailto:hola@lasombradelpantocrator.com"
              className="text-gray-500 hover:text-[#C9A84C]"
            >
              hola@lasombradelpantocrator.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
