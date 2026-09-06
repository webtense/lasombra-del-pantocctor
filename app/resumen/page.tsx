import type { Metadata } from 'next'
import AudioPlayer from '@/components/AudioPlayer'
import Link from 'next/link'
import BuyButton from '@/components/BuyButton'
import PageEvent from '@/components/PageEvent'
import { getBookPrice } from '@/lib/stripe-price'

export const metadata: Metadata = {
  title: 'La Historia — La Sombra del Pantocrátor',
  description: 'Descubre La Sombra del Pantocrátor de Andrés Sánchez Serrano. Thriller tecnológico en el Pirineo catalán.',
}

// Revalida la página periódicamente para que el precio de Stripe no quede
// congelado en el valor del último build (ISR).
export const revalidate = 3600

export default async function ResumenPage() {
  const { formatted: price } = await getBookPrice()
  return (
    <div className="min-h-screen bg-[#050810] pt-24 pb-24 md:pb-20">
      <PageEvent event="view_book" />
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">Thriller tecnológico</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-white mb-6">La Sombra del Pantocrátor</h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Bruno Martí llega a la Vall de Boí siguiendo una pista imposible: una nota con tres nombres
            y el de un hotel que no debería existir. Allí conoce a Laia Puig, directora del hotel,
            y descubre que bajo la nieve, el románico y la piedra se esconde el Pantocrátor: una
            arquitectura de vigilancia capaz de anticiparlo todo.
          </p>
        </div>

        {/* Datos del libro */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Capítulos', value: '131' },
            { label: 'Duración audio', value: '8h 11min' },
            { label: 'Ambientación', value: 'Europa' },
            { label: 'Género', value: 'Thriller' },
          ].map(d => (
            <div key={d.label} className="bg-[#0D1117] border border-[#C9A84C]/15 rounded-lg p-4 text-center">
              <p className="font-serif text-2xl text-[#C9A84C] mb-1">{d.value}</p>
              <p className="text-gray-500 text-xs uppercase tracking-wider">{d.label}</p>
            </div>
          ))}
        </div>

        {/* Escenario */}
        <div className="bg-[#0D1117] border border-[#C9A84C]/15 rounded-xl p-6 mb-10">
          <h2 className="font-serif text-xl text-[#C9A84C] mb-3">De los Pirineos a Europa</h2>
          <p className="text-gray-400 leading-relaxed">
            Lo que empieza como una investigación personal se convierte en una carrera por Barcelona,
            Europa central y el extremo norte. El deseo, la traición y la verdad empujan a los personajes
            hacia una red de control sin fisuras que parece estar siempre un paso por delante.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Vall de Boí', 'Barcelona', 'Múnich', 'Helsinki', 'Bolonia', 'Los Alpes'].map(loc => (
              <span key={loc} className="text-xs text-gray-500 bg-[#050810] border border-white/5 px-3 py-1 rounded-full">
                {loc}
              </span>
            ))}
          </div>
        </div>

        {/* Audio player — muestra gratuita SIN spoilers */}
        <div className="mb-10">
          <p className="text-center text-gray-500 text-xs tracking-widest uppercase mb-4">
            Muestra gratuita — Capítulo 1 (4 minutos)
          </p>
          <AudioPlayer
            src="/sample.mp3"
            title="Llegada al valle"
            description="Bruno Martí conduce hacia el Pirineo a las 3 de la mañana. Muestra del audiolibro con efectos de sonido."
          />
          <p className="text-center text-gray-600 text-xs mt-3">
            Sin spoilers. Gratis. Sin registro.
          </p>
        </div>

        {/* CTA compra */}
        <div className="text-center bg-gradient-to-b from-[#0D1117] to-[#050810] border border-[#C9A84C]/20 rounded-xl p-8">
          <p className="text-gray-400 mb-2">¿Quieres continuar la historia?</p>
          <h3 className="font-serif text-2xl text-white mb-6">Compra el libro completo</h3>
          <div className="flex flex-col items-center gap-3">
            <BuyButton label={`Comprar — ${price}`} size="lg" />
            <p className="text-gray-600 text-xs">EPUB + Audiolibro completo. Un pago. Tuyo para siempre.</p>
          </div>
          <div className="mt-6 pt-5 border-t border-white/5">
            <Link href="/personajes" className="text-[#C9A84C]/60 hover:text-[#C9A84C] text-sm transition-colors">
              Conoce a los personajes →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
