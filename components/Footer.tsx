import Link from 'next/link'
import TrackedLink from '@/components/TrackedLink'

export default function Footer() {
  return (
    <footer className="border-t border-[#C9A84C]/20 bg-[#050810] py-10 mt-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-[#C9A84C] text-lg font-bold mb-2">
              La Sombra del Pantocrátor
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Un thriller tecnológico ambientado en la Vall de Boí.<br />
              Por Andrés Sánchez Serrano.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-gray-400 text-xs tracking-widest uppercase mb-3">Navegar</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Inicio' },
                { href: '/resumen', label: 'La Historia' },
                { href: '/personajes', label: 'Personajes' },
                { href: '/muestra', label: 'Leer muestra gratis', event: 'view_sample_cta' },
                { href: '/descargar', label: 'Comprar', event: 'view_buy_cta' },
              ].map((link) =>
                link.event ? (
                  <li key={link.href}>
                    <TrackedLink
                      event={link.event}
                      href={link.href}
                      className="text-gray-500 hover:text-[#C9A84C] transition-colors"
                    >
                      {link.label}
                    </TrackedLink>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="text-gray-500 hover:text-[#C9A84C] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Quote */}
          <div>
            <blockquote className="border-l-2 border-[#C9A84C] pl-4 text-gray-500 text-sm italic leading-relaxed">
              &ldquo;Bajo la nieve, el románico y la piedra se esconde el Pantocrátor: una arquitectura de vigilancia capaz de anticiparlo todo.&rdquo;
            </blockquote>
          </div>
        </div>

        <div className="border-t border-[#C9A84C]/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} Andrés Sánchez Serrano. Todos los derechos reservados.
          </p>
          <p className="text-gray-700 text-xs">
            Obra de ficción. Cualquier parecido con la realidad es coincidencia.
          </p>
        </div>
      </div>
    </footer>
  )
}
