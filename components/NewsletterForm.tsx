'use client'

import { useState } from 'react'

export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'muestra' }),
      })
      if (!res.ok) throw new Error()
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <p className="text-[#C9A84C] text-sm text-center py-3">
        ¡Listo! Te avisaremos de nuevos lanzamientos y contenido exclusivo.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        className="flex-1 bg-[#050810] border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-[#C9A84C]/60"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold py-3 px-6 rounded-lg transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? 'Enviando...' : 'Quiero saber más'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs sm:absolute">No se ha podido suscribir. Inténtalo de nuevo.</p>
      )}
    </form>
  )
}
