'use client'

import { useState } from 'react'

interface BookCoverProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export default function BookCover({ size = 'lg', animated = true }: BookCoverProps) {
  const [hovered, setHovered] = useState(false)

  const dimensions = {
    sm: 'w-32 h-48',
    md: 'w-48 h-72',
    lg: 'w-64 h-96 md:w-80 md:h-[30rem]',
  }

  return (
    <div
      className={`relative ${dimensions[size]} cursor-pointer select-none`}
      onMouseEnter={() => animated && setHovered(true)}
      onMouseLeave={() => animated && setHovered(false)}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Book shadow */}
      <div
        className="absolute inset-0 rounded-sm transition-all duration-500"
        style={{
          boxShadow: hovered
            ? '8px 16px 60px rgba(201, 168, 76, 0.35), -4px 4px 20px rgba(0,0,0,0.8)'
            : '4px 8px 30px rgba(0,0,0,0.8), -2px 2px 10px rgba(0,0,0,0.5)',
          transform: hovered ? 'rotateY(-8deg) rotateX(2deg) scale(1.03)' : 'rotateY(-3deg)',
          transition: 'all 0.5s ease',
        }}
      />

      {/* Book cover */}
      <div
        className="absolute inset-0 rounded-sm overflow-hidden"
        style={{
          transform: hovered ? 'rotateY(-8deg) rotateX(2deg) scale(1.03)' : 'rotateY(-3deg)',
          transition: 'all 0.5s ease',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[#050810]" />

        {/* Subtle texture / gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(201, 168, 76, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 80%, rgba(201, 168, 76, 0.05) 0%, transparent 50%),
              linear-gradient(180deg, #0D1117 0%, #050810 40%, #0A0C14 100%)
            `,
          }}
        />

        {/* Pantocrátor abstract eye / symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-3/4 h-3/4 opacity-30"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer circle */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
            {/* Inner circles */}
            <circle cx="100" cy="100" r="65" fill="none" stroke="#C9A84C" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#C9A84C" strokeWidth="0.5" />
            {/* Eye shape */}
            <path
              d="M 20 100 Q 100 40 180 100 Q 100 160 20 100 Z"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="0.8"
            />
            {/* Pupil */}
            <circle cx="100" cy="100" r="18" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="6" fill="#C9A84C" opacity="0.6" />
            {/* Cross lines */}
            <line x1="100" y1="5" x2="100" y2="195" stroke="#C9A84C" strokeWidth="0.3" />
            <line x1="5" y1="100" x2="195" y2="100" stroke="#C9A84C" strokeWidth="0.3" />
            {/* Diagonal lines */}
            <line x1="30" y1="30" x2="170" y2="170" stroke="#C9A84C" strokeWidth="0.2" />
            <line x1="170" y1="30" x2="30" y2="170" stroke="#C9A84C" strokeWidth="0.2" />
          </svg>
        </div>

        {/* Title area */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {/* Top: author */}
          <div>
            <p className="text-[#C9A84C]/60 text-xs tracking-widest uppercase font-sans">
              Andrés Sánchez Serrano
            </p>
          </div>

          {/* Center decoration line */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[#C9A84C]/30" />
            <div className="w-1 h-1 rounded-full bg-[#C9A84C]/50" />
            <div className="flex-1 h-px bg-[#C9A84C]/30" />
          </div>

          {/* Bottom: title */}
          <div>
            <h2
              className="font-serif text-white leading-tight mb-1"
              style={{
                fontSize: size === 'lg' ? '1.2rem' : '0.85rem',
                textShadow: '0 0 20px rgba(201,168,76,0.3)',
              }}
            >
              La Sombra del
            </h2>
            <h2
              className="font-serif leading-tight"
              style={{
                fontSize: size === 'lg' ? '1.4rem' : '1rem',
                background: 'linear-gradient(135deg, #C9A84C 0%, #E0C97A 50%, #9B7B2E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              Pantocrátor
            </h2>
            <p className="text-[#C9A84C]/50 text-xs tracking-wider mt-2 font-sans">
              Un thriller tecnológico
            </p>
          </div>
        </div>

        {/* Spine effect */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-[#C9A84C]/20 to-transparent" />

        {/* Hover glow overlay */}
        {hovered && (
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* Book spine (left side) */}
      <div
        className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-[#9B7B2E] to-[#C9A84C]/50 rounded-l-sm"
        style={{
          transform: hovered ? 'rotateY(-8deg) rotateX(2deg) scale(1.03)' : 'rotateY(-3deg)',
          transition: 'all 0.5s ease',
          transformOrigin: 'left center',
        }}
      />
    </div>
  )
}
