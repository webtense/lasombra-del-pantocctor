'use client'

import Link from 'next/link'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/resumen', label: 'La Historia' },
  { href: '/personajes', label: 'Personajes' },
  { href: '/muestra', label: 'Muestra gratis' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050810]/90 backdrop-blur-sm border-b border-[#C9A84C]/20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="font-serif text-[#C9A84C] text-lg font-bold tracking-wide group-hover:text-[#E0C97A] transition-colors">
            La Sombra del Pantocrátor
          </span>
          <span className="text-gray-500 text-xs tracking-widest uppercase">
            Andrés Sánchez Serrano
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-400 hover:text-[#C9A84C] text-sm tracking-wide transition-colors border-gold-animated"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/descargar"
            className="bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] text-sm font-semibold px-4 py-2 rounded transition-colors"
          >
            Comprar
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-[#C9A84C] p-1"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#0D1117] border-t border-[#C9A84C]/20 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-[#C9A84C] text-sm py-1 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/descargar"
            onClick={() => setOpen(false)}
            className="bg-[#C9A84C] hover:bg-[#E0C97A] text-[#050810] text-sm font-semibold px-4 py-2 rounded text-center transition-colors mt-2"
          >
            Comprar
          </Link>
        </div>
      )}
    </nav>
  )
}
