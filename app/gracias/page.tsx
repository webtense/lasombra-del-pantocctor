'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackEvent } from '@/lib/track-event'

function GraciasContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id') || ''
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [email, setEmail] = useState('')
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!sessionId) { setStatus('invalid'); return }
    fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) {
          setStatus('valid')
          setEmail(d.customerEmail || '')
          if (!trackedRef.current) {
            trackedRef.current = true
            trackEvent('purchase', {
              transaction_id: sessionId,
              value: d.amount ? d.amount / 100 : 12.99,
              currency: 'EUR',
              items: [{ item_name: 'La Sombra del Pantocrátor — Ebook + Audiolibro' }],
            })
          }
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Verificando tu pago...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="font-serif text-2xl text-white mb-3">Acceso no autorizado</h1>
        <p className="text-gray-400 mb-8">No se encontró un pago válido. Si acabas de comprar, espera unos segundos y recarga.</p>
        <Link href="/descargar"
          className="bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] font-bold py-3 px-6 rounded-lg transition-colors">
          Ir a comprar →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md w-full mx-auto text-center">
      <div className="w-20 h-20 rounded-full bg-[#C9A84C]/15 border-2 border-[#C9A84C]/40
                      flex items-center justify-center mx-auto mb-8">
        <svg className="w-10 h-10 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-serif text-3xl text-white mb-2">¡Gracias por tu compra!</h1>
      {email && <p className="text-gray-500 text-sm mb-6">Confirmación enviada a {email}</p>}
      <p className="text-gray-400 mb-8">Aquí tienes tus descargas. Los enlaces son de un solo uso.</p>

      <div className="space-y-3 mb-8">
        <a href={`/api/download/epub?session_id=${encodeURIComponent(sessionId)}`}
          className="flex items-center justify-between w-full bg-[#C9A84C] hover:bg-[#E0C97A]
                     text-[#050810] font-bold py-4 px-6 rounded-lg transition-colors">
          <span>📚 Descargar EPUB</span>
          <span className="text-sm font-normal opacity-70">~276 KB</span>
        </a>
        <a href={`/api/download/audio?session_id=${encodeURIComponent(sessionId)}`}
          className="flex items-center justify-between w-full border border-[#C9A84C]/50
                     hover:border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10
                     font-bold py-4 px-6 rounded-lg transition-colors">
          <span>🎧 Descargar Audiolibro</span>
          <span className="text-sm font-normal opacity-70">676 MB · 8h 11min</span>
        </a>
      </div>

      <div className="bg-[#0D1117] border border-[#C9A84C]/15 rounded-lg p-5 text-left mb-6">
        <p className="text-white text-sm font-semibold mb-2">¿Te ha gustado? 🙏</p>
        <p className="text-gray-400 text-sm mb-3">Una reseña en Amazon ayuda enormemente a llegar a más lectores.</p>
        <a href="https://www.amazon.es/review/create-review" target="_blank" rel="noopener noreferrer"
          className="text-[#FF9900] hover:text-[#FFA520] text-sm font-semibold transition-colors">
          Dejar reseña en Amazon →
        </a>
      </div>

      <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
        ← Volver al inicio
      </Link>
    </div>
  )
}

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-[#050810] flex items-center justify-center px-6 py-24">
      <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
        <GraciasContent />
      </Suspense>
    </div>
  )
}
