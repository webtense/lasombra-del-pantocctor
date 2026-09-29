import type { Metadata } from 'next'
import BuyButton from '@/components/BuyButton'
import AudioPlayer from '@/components/AudioPlayer'
import Link from 'next/link'
import PageEvent from '@/components/PageEvent'
import { getBookPrice } from '@/lib/stripe-price'

export const metadata: Metadata = {
  title: 'Comprar — La Sombra del Pantocrátor',
  description: 'Compra el ebook y audiolibro completo de La Sombra del Pantocrátor. Pago único, sin suscripción.',
}

// Revalida la página periódicamente para que el precio de Stripe no quede
// congelado en el valor del último build (ISR).
export const revalidate = 3600

export default async function DescargarPage() {
  const { formatted: price } = await getBookPrice()
  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-20">
      <PageEvent event="view_book" />
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">Pago único</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-4">
            La Sombra del Pantocrátor
          </h1>
          <p className="text-gray-400 text-lg">Andrés Sánchez Serrano</p>
        </div>

        {/* Producto */}
        <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            {/* Portada miniatura */}
            <img
              src="/portada.jpg"
              alt="Portada"
              className="w-20 h-auto rounded-lg flex-shrink-0 opacity-90"
            />
            <div>
              <h2 className="font-serif text-xl text-white mb-2">Pack completo</h2>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span>
                  <span>📚 Ebook EPUB — lector digital, Kindle, Kobo, Apple Books</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span>
                  <span>🎧 Audiolibro completo — 8h 11min · MP3 con música y efectos de sonido</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#C9A84C]">✓</span>
                  <span>131 capítulos · Voz AlvaroNeural · Archivos sin restricciones</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Precio y botón */}
          <div className="text-center py-4 border-t border-[#C9A84C]/10">
            <div className="text-3xl font-bold text-[#C9A84C] mb-1">{price}</div>
            <p className="text-gray-600 text-xs mb-5">Un pago. Tuyo para siempre.</p>
            <p className="text-gray-500 text-sm mb-4">
              Si no has leído los 3 primeros capítulos,{' '}
              <Link href="/muestra" className="text-[#C9A84C] hover:underline">
                léelos gratis aquí
              </Link>
              .
            </p>
            <BuyButton label={`Compra aquí → ${price} vía Stripe`} size="lg" />
          </div>
        </div>

        {/* Muestra gratuita */}
        <div className="bg-[#0D1117] border border-white/5 rounded-xl p-6 mb-8">
          <p className="text-gray-500 text-xs tracking-widest uppercase text-center mb-4">
            Escucha antes de comprar — muestra gratuita
          </p>
          <AudioPlayer
            src="/sample.mp3"
            title="Capítulo 1 — Llegada al valle (4 min)"
            description="Bruno Martí llega a la Vall de Boí. Muestra del audiolibro con ambient."
          />
        </div>

        {/* FAQ mínimo */}
        <div className="space-y-4 text-sm text-gray-500">
          <div>
            <p className="text-white font-semibold mb-1">¿Qué recibo tras el pago?</p>
            <p>Acceso inmediato para descargar el EPUB y el audiolibro completo (700 MB).</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">¿Tiene DRM?</p>
            <p>No. Los archivos son tuyos para siempre, sin restricciones.</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-1">¿Puedo leer la sinopsis antes?</p>
            <p>
              Sí —{' '}
              <Link href="/resumen" className="text-[#C9A84C] hover:underline">
                lee la sinopsis completa aquí
              </Link>
              .
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
