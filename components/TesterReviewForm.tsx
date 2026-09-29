'use client'

import { useState } from 'react'

type Props = {
  token: string
  defaultName?: string | null
  defaultEmail?: string | null
}

export default function TesterReviewForm({ token, defaultName, defaultEmail }: Props) {
  const [name, setName] = useState(defaultName || '')
  const [email, setEmail] = useState(defaultEmail || '')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [opinion, setOpinion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Escribe tu nombre')
      return
    }
    if (rating < 1) {
      setError('Elige una calificación de 1 a 5 estrellas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tester/${token}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || null, rating, opinion: opinion.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setSent(true)
      } else {
        setError(data.error || 'No se pudo enviar la reseña')
      }
    } catch {
      setError('Error de red, inténtalo de nuevo')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">🙏</div>
        <h3 className="font-serif text-xl text-white mb-2">¡Gracias por tu reseña!</h3>
        <p className="text-gray-500 text-sm">Tu opinión nos ayuda muchísimo a mejorar el libro.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-6 md:p-8 space-y-5">
      <h3 className="font-serif text-xl text-white">Déjanos tu reseña</h3>

      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#050810] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none transition-colors"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Email (opcional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#050810] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none transition-colors"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl leading-none transition-transform hover:scale-110"
              aria-label={`${n} estrellas`}
            >
              <span className={(hoverRating || rating) >= n ? 'text-[#C9A84C]' : 'text-gray-700'}>★</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2">Tu opinión</label>
        <textarea
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          rows={5}
          className="w-full bg-[#050810] border border-[#C9A84C]/30 focus:border-[#C9A84C] text-white rounded px-4 py-3 outline-none transition-colors resize-none"
          placeholder="¿Qué te ha parecido la historia?"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#C9A84C] hover:bg-[#E0C97A] disabled:opacity-50 text-[#050810] font-semibold py-3 rounded transition-colors"
      >
        {loading ? 'Enviando...' : 'Enviar reseña'}
      </button>
    </form>
  )
}
