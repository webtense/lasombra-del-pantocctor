'use client'

import { useRef, useState, useEffect } from 'react'
import { trackListenSample } from '@/lib/analytics'

interface AudioPlayerProps {
  src: string
  title?: string
  description?: string
}

export default function AudioPlayer({ src, title = 'Muestra de audio', description }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [loading, setLoading] = useState(false)
  const trackedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)
    const onWaiting = () => setLoading(true)
    const onCanPlay = () => setLoading(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      if (!trackedRef.current) {
        trackedRef.current = true
        trackListenSample({ title })
      }
      setLoading(true)
      await audio.play()
      setPlaying(true)
      setLoading(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const val = Number(e.target.value)
    audio.currentTime = val
    setCurrentTime(val)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const val = Number(e.target.value)
    audio.volume = val
    setVolume(val)
  }

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#0D1117] border border-[#C9A84C]/30 rounded-lg p-5 max-w-lg w-full">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-[#C9A84C] text-xs tracking-widest uppercase font-sans">Audiolibro</span>
        </div>
        <h3 className="font-serif text-white text-lg">{title}</h3>
        {description && (
          <p className="text-gray-500 text-xs mt-1">{description}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-3 relative group">
        <div className="h-1 bg-[#1F2937] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E0C97A] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
          aria-label="Progreso de reproducción"
        />
      </div>

      {/* Time */}
      <div className="flex justify-between text-xs text-gray-500 mb-4 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[#C9A84C] hover:bg-[#E0C97A] flex items-center justify-center transition-colors shadow-gold flex-shrink-0"
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {loading ? (
            <svg className="animate-spin w-5 h-5 text-[#050810]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#050810">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#050810">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {volume > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
            {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolume}
            className="flex-1 h-1 bg-[#1F2937] rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #C9A84C ${volume * 100}%, #1F2937 ${volume * 100}%)`,
            }}
            aria-label="Volumen"
          />
        </div>
      </div>
    </div>
  )
}
