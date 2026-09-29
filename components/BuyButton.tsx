'use client'
import { useState } from 'react'
import { trackEvent } from '@/lib/track-event'

interface BuyButtonProps {
  // Sin valor por defecto a propósito: el precio viene siempre de Stripe
  // (vía lib/stripe-price.ts en el Server Component padre), nunca hardcodeado aquí.
  label: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function BuyButton({
  label,
  className = '',
  size = 'md',
}: BuyButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-6 text-base',
    lg: 'py-4 px-8 text-lg',
  }

  async function handleBuy() {
    trackEvent('view_buy_cta', { label })
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      window.location.href = data.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al procesar el pago')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleBuy}
        disabled={loading}
        className={`
          inline-flex items-center justify-center gap-2 font-bold rounded-lg
          bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810]
          disabled:opacity-50 transition-colors cursor-pointer
          ${sizes[size]} ${className}
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Redirigiendo a pago...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            {label}
          </>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <p className="text-gray-600 text-xs">Pago seguro con Stripe · EPUB + Audiolibro</p>
    </div>
  )
}
