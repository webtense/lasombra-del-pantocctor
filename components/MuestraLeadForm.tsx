'use client'

import { useState } from 'react'
import { trackEvent, getSessionId } from '@/lib/track-event'

// Formulario de captación de la landing /muestra: nombre + email, guardado
// en la tabla Supabase `newsletter_muestra` (ver
// supabase-schema-newsletter-muestra.sql) vía /api/muestra-lead.
// Distinto del NewsletterForm genérico (que da de alta solo el email en
// Brevo) porque aquí se pide también el nombre.
export default function MuestraLeadForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/muestra-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, session_id: getSessionId() }),
      })
      if (!res.ok) throw new Error()
      trackEvent('submit_email_sample', { name })
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <p className="text-[#C9A84C] text-sm text-center py-3">
        ¡Gracias, {name.trim().split(' ')[0]}! Te avisaremos de nuevos lanzamientos y contenido exclusivo.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="flex-1 bg-[#050810] border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-[#C9A84C]/60"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 bg-[#050810] border border-[#C9A84C]/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors focus:border-[#C9A84C]/60"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {status === 'loading' ? 'Enviando...' : 'Quiero leer y escuchar la muestra'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-xs text-center">No se ha podido enviar. Inténtalo de nuevo.</p>
      )}
    </form>
  )
}
