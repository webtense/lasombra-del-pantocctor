'use client'

import { useState } from 'react'
import AudiobookPlayer, { type AudioQuality } from '@/components/AudiobookPlayer'

// Pantalla de QA del audiolibro (solo dueño, /admin/audiolibro).
//
// Reutiliza el MISMO reproductor que ven los compradores en /panel, solo que
// parametrizado por calidad: el streaming por capitulo sale de /normal/ o de
// /premium/ en el VPS segun el selector. Cambiar de calidad remonta el
// reproductor (key={quality}) para que el <audio> recargue la fuente correcta
// en vez de arrastrar el src anterior.
//
// El tracking a /api/event va desactivado: esto es revision interna y no debe
// contaminar las metricas de escucha reales.
export default function AudiobookQAClient() {
  const [quality, setQuality] = useState<AudioQuality>('premium')

  const options: { value: AudioQuality; label: string; hint: string }[] = [
    { value: 'normal', label: 'Normal', hint: 'edge-tts · la que se vende hoy' },
    { value: 'premium', label: 'Premium', hint: 'Google es-ES-Studio-F' },
  ]
  const active = options.find((o) => o.value === quality)!

  return (
    <div className="fixed inset-0 z-50 bg-[#050810] flex flex-col overflow-hidden">
      {/* Barra de QA */}
      <div className="flex-shrink-0 border-b border-[#C9A84C]/20 bg-[#0D1117] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 min-w-[180px]">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Revisión audiolibro</p>
          <p className="text-sm text-gray-300">
            Escuchando: <span className="text-[#C9A84C]">{active.label}</span>{' '}
            <span className="text-gray-600">· {active.hint}</span>
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#C9A84C]/30 p-1">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setQuality(o.value)}
              aria-pressed={quality === o.value}
              className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
                quality === o.value
                  ? 'bg-[#C9A84C] text-[#050810] font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <a
          href="/admin/dashboard"
          className="text-sm text-gray-500 hover:text-[#C9A84C] transition-colors"
        >
          Dashboard
        </a>
      </div>

      {/* Reproductor: remonta al cambiar de calidad */}
      <div className="flex-1 overflow-hidden">
        <AudiobookPlayer key={quality} quality={quality} tracking={false} />
      </div>
    </div>
  )
}
