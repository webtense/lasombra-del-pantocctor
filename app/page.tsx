import Link from 'next/link'
import BookCover from '@/components/BookCover'
import BuyButton from '@/components/BuyButton'
import TrackedLink from '@/components/TrackedLink'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050810]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background layers */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(201, 168, 76, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(201, 168, 76, 0.04) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 100%, rgba(13, 17, 23, 0.9) 0%, transparent 60%)
            `,
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="order-2 lg:order-1 animate-fade-in">
              {/* Genre badge */}
              <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">
                  Thriller Tecnológico · 131 Capítulos
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                <span className="text-white">La Sombra del</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #C9A84C 0%, #E0C97A 50%, #9B7B2E 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Pantocrátor
                </span>
              </h1>

              {/* Author */}
              <p className="text-gray-500 text-sm tracking-widest uppercase mb-6 font-sans">
                Andrés Sánchez Serrano
              </p>

              {/* Tagline */}
              <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                Bruno Martí llega a la Vall de Boí siguiendo una pista imposible: una nota con tres nombres
                y el de un hotel que no debería existir. Bajo la nieve, el románico y la piedra se esconde el
                Pantocrátor:{' '}
                <span className="text-[#C9A84C]">una arquitectura de vigilancia capaz de anticiparlo todo.</span>
              </p>

              {/* Stats */}
              <div className="flex gap-8 mb-8">
                {[
                  { value: '131', label: 'Capítulos' },
                  { value: '4', label: 'Partes' },
                  { value: '~380', label: 'Páginas' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-serif text-2xl text-[#C9A84C] font-bold">{stat.value}</div>
                    <div className="text-gray-600 text-xs tracking-wider uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA principal */}
              <p className="text-[#C9A84C] text-sm font-semibold tracking-wide uppercase mb-3">
                Ebook + Audiolibro: 12,99 €
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <BuyButton label="Comprar — 12,99 €" size="lg" />
                <TrackedLink
                  event="view_sample_cta"
                  href="/muestra"
                  className="border border-[#C9A84C]/30 hover:border-[#C9A84C]/60 text-[#C9A84C]/70 hover:text-[#C9A84C] px-5 py-3 rounded transition-all inline-flex items-center gap-2 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10,8 16,12 10,16" fill="currentColor" />
                  </svg>
                  Leer 3 capítulos gratis
                </TrackedLink>
              </div>
            </div>

            {/* Right: Book Cover */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <BookCover size="lg" animated={true} />
            </div>
          </div>
        </div>

        {/* Scroll indicator — oculto en móvil para no interferir con bottom nav */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-gray-500 tracking-widest uppercase">Descubrir</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#C9A84C] to-transparent" />
        </div>
      </section>

      {/* Synopsis strip */}
      <section className="border-y border-[#C9A84C]/15 bg-[#0D1117]/50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex items-center gap-4 justify-center mb-6">
            <div className="flex-1 h-px bg-[#C9A84C]/20" />
            <span className="text-[#C9A84C]/60 text-xs tracking-widest uppercase">La historia</span>
            <div className="flex-1 h-px bg-[#C9A84C]/20" />
          </div>
          <blockquote className="font-serif text-xl md:text-2xl text-gray-300 leading-relaxed italic">
            &ldquo;Alguien lo ve todo. Alguien lo recuerda todo. Y alguien está dispuesto a usarlo.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* 4 Parts Overview */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">
            Una historia en cuatro actos
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            De los Pirineos a Bruselas. Cada parte amplía lo que el Pantocrátor ya sabe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              part: 'I',
              title: 'La Vall de Boí',
              chapters: 'Caps. 1–40',
              desc: 'Un ex-corresponsal de guerra. Un hotel imposible. Un sistema que ya sabe demasiado.',
              color: '#C9A84C',
            },
            {
              part: 'II',
              title: 'La red de Cataluña',
              chapters: 'Caps. 41–71',
              desc: 'La vigilancia se extiende. Cada hilo conduce al mismo nombre: El Pantocrátor.',
              color: '#A07030',
            },
            {
              part: 'III',
              title: 'Europa en juego',
              chapters: 'Caps. 72–101',
              desc: 'Las fronteras no detienen el código. Lo que empezó en los Pirineos llega a Bruselas.',
              color: '#805020',
            },
            {
              part: 'IV',
              title: 'Resolución y legado',
              chapters: 'Caps. 102–131',
              desc: 'El precio de la verdad. El coste de derribar una sombra que ya nadie puede ver.',
              color: '#604010',
            },
          ].map((part) => (
            <Link
              key={part.part}
              href="/resumen"
              className="bg-[#0D1117] border border-[#C9A84C]/15 hover:border-[#C9A84C]/40 rounded-lg p-6 group transition-all hover:shadow-dark-card"
            >
              <div
                className="font-serif text-5xl font-bold mb-3 opacity-30 group-hover:opacity-60 transition-opacity"
                style={{ color: part.color }}
              >
                {part.part}
              </div>
              <h3 className="font-serif text-white text-lg mb-1 group-hover:text-[#C9A84C] transition-colors">
                {part.title}
              </h3>
              <p className="text-[#C9A84C]/50 text-xs mb-3 tracking-wider">{part.chapters}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{part.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Characters teaser */}
      <section className="py-16 bg-[#0D1117]/40 border-t border-[#C9A84C]/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-3xl text-white mb-2">Los personajes</h2>
              <p className="text-gray-500 max-w-md">
                Cinco figuras que definen el tablero. Un periodista, una directora, una sombra del pasado, un arquitecto del miedo y una hacker.
              </p>
            </div>
            <Link
              href="/personajes"
              className="flex-shrink-0 border border-[#C9A84C]/40 hover:border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10 px-6 py-3 rounded transition-all font-sans text-sm"
            >
              Ver personajes →
            </Link>
          </div>

          {/* Avatars preview */}
          <div className="flex gap-4 mt-8 overflow-x-auto pb-2">
            {['BM', 'LP', 'AP', 'IC', 'ÁG'].map((initials, i) => (
              <div
                key={initials}
                className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-[#C9A84C]/30 bg-[#0D1117] flex items-center justify-center"
                style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 5 - i }}
              >
                <span className="font-serif text-sm text-[#C9A84C] font-bold">{initials}</span>
              </div>
            ))}
            <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-[#C9A84C]/20 flex items-center justify-center" style={{ marginLeft: '-8px' }}>
              <span className="text-[#C9A84C]/40 text-xs">+más</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA download */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <div
          className="border border-[#C9A84C]/20 rounded-2xl p-12"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)',
          }}
        >
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
            Ebook + Audiolibro: 12,99 €
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            EPUB + audiolibro completo (8h 11min) en un único pago. Sin DRM, sin suscripción,
            tuyo para siempre. ¿Aún no lo tienes claro? Lee los 3 primeros capítulos gratis.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <TrackedLink
              event="view_buy_cta"
              href="/descargar"
              className="bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] font-semibold px-8 py-3 rounded transition-colors"
            >
              Comprar ahora
            </TrackedLink>
            <TrackedLink
              event="view_sample_cta"
              href="/muestra"
              className="border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 px-8 py-3 rounded transition-all"
            >
              Leer muestra gratis
            </TrackedLink>
          </div>
        </div>
      </section>
    </div>
  )
}
