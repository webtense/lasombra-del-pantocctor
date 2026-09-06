'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Event tracking helper
// ---------------------------------------------------------------------------
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('lsp_session_id')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('lsp_session_id', sid)
  }
  return sid
}

function trackEvent(eventType: string, eventData?: Record<string, unknown>) {
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      event_data: eventData || null,
      session_id: getSessionId(),
      referrer: typeof window !== 'undefined' ? document.referrer : null,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
    }),
  }).catch(() => {})
}

// ---------------------------------------------------------------------------
// Chapter data
// ---------------------------------------------------------------------------
const CHAPTERS = [
  { idx: 0, file: '000_prologo.mp3', title: 'Prólogo', isMarker: false },
  { idx: 1, file: '001_parte_1.mp3', title: 'PARTE I', isMarker: true },
  { idx: 2, file: '002_cap_001.mp3', title: 'Capítulo 1', isMarker: false },
  { idx: 3, file: '003_cap_002.mp3', title: 'Capítulo 2', isMarker: false },
  { idx: 4, file: '004_cap_003.mp3', title: 'Capítulo 3', isMarker: false },
  { idx: 5, file: '005_cap_004.mp3', title: 'Capítulo 4', isMarker: false },
  { idx: 6, file: '006_cap_005.mp3', title: 'Capítulo 5', isMarker: false },
  { idx: 7, file: '007_cap_006.mp3', title: 'Capítulo 6', isMarker: false },
  { idx: 8, file: '008_cap_007.mp3', title: 'Capítulo 7', isMarker: false },
  { idx: 9, file: '009_cap_008.mp3', title: 'Capítulo 8', isMarker: false },
  { idx: 10, file: '010_cap_009.mp3', title: 'Capítulo 9', isMarker: false },
  { idx: 11, file: '011_cap_010.mp3', title: 'Capítulo 10', isMarker: false },
  { idx: 12, file: '012_cap_011.mp3', title: 'Capítulo 11', isMarker: false },
  { idx: 13, file: '013_cap_012.mp3', title: 'Capítulo 12', isMarker: false },
  { idx: 14, file: '014_cap_013.mp3', title: 'Capítulo 13', isMarker: false },
  { idx: 15, file: '015_cap_014.mp3', title: 'Capítulo 14', isMarker: false },
  { idx: 16, file: '016_cap_015.mp3', title: 'Capítulo 15', isMarker: false },
  { idx: 17, file: '017_cap_016.mp3', title: 'Capítulo 16', isMarker: false },
  { idx: 18, file: '018_cap_017.mp3', title: 'Capítulo 17', isMarker: false },
  { idx: 19, file: '019_cap_018.mp3', title: 'Capítulo 18', isMarker: false },
  { idx: 20, file: '020_cap_019.mp3', title: 'Capítulo 19', isMarker: false },
  { idx: 21, file: '021_cap_021.mp3', title: 'Capítulo 21', isMarker: false },
  { idx: 22, file: '022_cap_022.mp3', title: 'Capítulo 22', isMarker: false },
  { idx: 23, file: '023_cap_025.mp3', title: 'Capítulo 25', isMarker: false },
  { idx: 24, file: '024_cap_026.mp3', title: 'Capítulo 26', isMarker: false },
  { idx: 25, file: '025_cap_027.mp3', title: 'Capítulo 27', isMarker: false },
  { idx: 26, file: '026_cap_028.mp3', title: 'Capítulo 28', isMarker: false },
  { idx: 27, file: '027_cap_029.mp3', title: 'Capítulo 29', isMarker: false },
  { idx: 28, file: '028_cap_030.mp3', title: 'Capítulo 30', isMarker: false },
  { idx: 29, file: '029_cap_031.mp3', title: 'Capítulo 31', isMarker: false },
  { idx: 30, file: '030_cap_032.mp3', title: 'Capítulo 32', isMarker: false },
  { idx: 31, file: '031_cap_033.mp3', title: 'Capítulo 33', isMarker: false },
  { idx: 32, file: '032_cap_034.mp3', title: 'Capítulo 34', isMarker: false },
  { idx: 33, file: '033_cap_035.mp3', title: 'Capítulo 35', isMarker: false },
  { idx: 34, file: '034_cap_036.mp3', title: 'Capítulo 36', isMarker: false },
  { idx: 35, file: '035_cap_037.mp3', title: 'Capítulo 37', isMarker: false },
  { idx: 36, file: '036_cap_038.mp3', title: 'Capítulo 38', isMarker: false },
  { idx: 37, file: '037_cap_039.mp3', title: 'Capítulo 39', isMarker: false },
  { idx: 38, file: '038_cap_040.mp3', title: 'Capítulo 40', isMarker: false },
  { idx: 39, file: '039_cap_041.mp3', title: 'Capítulo 41', isMarker: false },
  { idx: 40, file: '040_cap_042.mp3', title: 'Capítulo 42', isMarker: false },
  { idx: 41, file: '041_cap_043.mp3', title: 'Capítulo 43', isMarker: false },
  { idx: 42, file: '042_cap_044.mp3', title: 'Capítulo 44', isMarker: false },
  { idx: 43, file: '043_cap_045.mp3', title: 'Capítulo 45', isMarker: false },
  { idx: 44, file: '044_cap_046.mp3', title: 'Capítulo 46', isMarker: false },
  { idx: 45, file: '045_cap_047.mp3', title: 'Capítulo 47', isMarker: false },
  { idx: 46, file: '046_cap_048.mp3', title: 'Capítulo 48', isMarker: false },
  { idx: 47, file: '047_cap_049.mp3', title: 'Capítulo 49', isMarker: false },
  { idx: 48, file: '048_cap_050.mp3', title: 'Capítulo 50', isMarker: false },
  { idx: 49, file: '049_cap_051.mp3', title: 'Capítulo 51', isMarker: false },
  { idx: 50, file: '050_cap_052.mp3', title: 'Capítulo 52', isMarker: false },
  { idx: 51, file: '051_cap_053.mp3', title: 'Capítulo 53', isMarker: false },
  { idx: 52, file: '052_cap_054.mp3', title: 'Capítulo 54', isMarker: false },
  { idx: 53, file: '053_cap_055.mp3', title: 'Capítulo 55', isMarker: false },
  { idx: 54, file: '054_cap_056.mp3', title: 'Capítulo 56', isMarker: false },
  { idx: 55, file: '055_cap_057.mp3', title: 'Capítulo 57', isMarker: false },
  { idx: 56, file: '056_cap_058.mp3', title: 'Capítulo 58', isMarker: false },
  { idx: 57, file: '057_cap_059.mp3', title: 'Capítulo 59', isMarker: false },
  { idx: 58, file: '058_cap_060.mp3', title: 'Capítulo 60', isMarker: false },
  { idx: 59, file: '059_cap_061.mp3', title: 'Capítulo 61', isMarker: false },
  { idx: 60, file: '060_cap_062.mp3', title: 'Capítulo 62', isMarker: false },
  { idx: 61, file: '061_cap_063.mp3', title: 'Capítulo 63', isMarker: false },
  { idx: 62, file: '062_cap_064.mp3', title: 'Capítulo 64', isMarker: false },
  { idx: 63, file: '063_cap_065.mp3', title: 'Capítulo 65', isMarker: false },
  { idx: 64, file: '064_cap_066.mp3', title: 'Capítulo 66', isMarker: false },
  { idx: 65, file: '065_cap_067.mp3', title: 'Capítulo 67', isMarker: false },
  { idx: 66, file: '066_cap_068.mp3', title: 'Capítulo 68', isMarker: false },
  { idx: 67, file: '067_cap_069.mp3', title: 'Capítulo 69', isMarker: false },
  { idx: 68, file: '068_cap_070.mp3', title: 'Capítulo 70', isMarker: false },
  { idx: 69, file: '069_cap_071.mp3', title: 'Capítulo 71', isMarker: false },
  { idx: 70, file: '070_cap_072.mp3', title: 'Capítulo 72', isMarker: false },
  { idx: 71, file: '071_cap_073.mp3', title: 'Capítulo 73', isMarker: false },
  { idx: 72, file: '072_cap_074.mp3', title: 'Capítulo 74', isMarker: false },
  { idx: 73, file: '073_cap_075.mp3', title: 'Capítulo 75', isMarker: false },
  { idx: 74, file: '074_cap_076.mp3', title: 'Capítulo 76', isMarker: false },
  { idx: 75, file: '075_cap_077.mp3', title: 'Capítulo 77', isMarker: false },
  { idx: 76, file: '076_cap_078.mp3', title: 'Capítulo 78', isMarker: false },
  { idx: 77, file: '077_cap_079.mp3', title: 'Capítulo 79', isMarker: false },
  { idx: 78, file: '078_cap_080.mp3', title: 'Capítulo 80', isMarker: false },
  { idx: 79, file: '079_cap_081.mp3', title: 'Capítulo 81', isMarker: false },
  { idx: 80, file: '080_cap_082.mp3', title: 'Capítulo 82', isMarker: false },
  { idx: 81, file: '081_cap_083.mp3', title: 'Capítulo 83', isMarker: false },
  { idx: 82, file: '082_cap_084.mp3', title: 'Capítulo 84', isMarker: false },
  { idx: 83, file: '083_cap_085.mp3', title: 'Capítulo 85', isMarker: false },
  { idx: 84, file: '084_cap_086.mp3', title: 'Capítulo 86', isMarker: false },
  { idx: 85, file: '085_cap_087.mp3', title: 'Capítulo 87', isMarker: false },
  { idx: 86, file: '086_cap_088.mp3', title: 'Capítulo 88', isMarker: false },
  { idx: 87, file: '087_cap_089.mp3', title: 'Capítulo 89', isMarker: false },
  { idx: 88, file: '088_cap_090.mp3', title: 'Capítulo 90', isMarker: false },
  { idx: 89, file: '089_cap_091.mp3', title: 'Capítulo 91', isMarker: false },
  { idx: 90, file: '090_cap_092.mp3', title: 'Capítulo 92', isMarker: false },
  { idx: 91, file: '091_cap_093.mp3', title: 'Capítulo 93', isMarker: false },
  { idx: 92, file: '092_cap_094.mp3', title: 'Capítulo 94', isMarker: false },
  { idx: 93, file: '093_cap_095.mp3', title: 'Capítulo 95', isMarker: false },
  { idx: 94, file: '094_cap_096.mp3', title: 'Capítulo 96', isMarker: false },
  { idx: 95, file: '095_cap_097.mp3', title: 'Capítulo 97', isMarker: false },
  { idx: 96, file: '096_cap_098.mp3', title: 'Capítulo 98', isMarker: false },
  { idx: 97, file: '097_cap_099.mp3', title: 'Capítulo 99', isMarker: false },
  { idx: 98, file: '098_cap_100.mp3', title: 'Capítulo 100', isMarker: false },
  { idx: 99, file: '099_cap_101.mp3', title: 'Capítulo 101', isMarker: false },
  { idx: 100, file: '100_cap_102.mp3', title: 'Capítulo 102', isMarker: false },
  { idx: 101, file: '101_cap_103.mp3', title: 'Capítulo 103', isMarker: false },
  { idx: 102, file: '102_cap_104.mp3', title: 'Capítulo 104', isMarker: false },
  { idx: 103, file: '103_cap_105.mp3', title: 'Capítulo 105', isMarker: false },
  { idx: 104, file: '104_cap_106.mp3', title: 'Capítulo 106', isMarker: false },
  { idx: 105, file: '105_cap_107.mp3', title: 'Capítulo 107', isMarker: false },
  { idx: 106, file: '106_cap_108.mp3', title: 'Capítulo 108', isMarker: false },
  { idx: 107, file: '107_cap_109.mp3', title: 'Capítulo 109', isMarker: false },
  { idx: 108, file: '108_cap_110.mp3', title: 'Capítulo 110', isMarker: false },
  { idx: 109, file: '109_cap_111.mp3', title: 'Capítulo 111', isMarker: false },
  { idx: 110, file: '110_cap_112.mp3', title: 'Capítulo 112', isMarker: false },
  { idx: 111, file: '111_cap_113.mp3', title: 'Capítulo 113', isMarker: false },
  { idx: 112, file: '112_cap_114.mp3', title: 'Capítulo 114', isMarker: false },
  { idx: 113, file: '113_cap_115.mp3', title: 'Capítulo 115', isMarker: false },
  { idx: 114, file: '114_cap_116.mp3', title: 'Capítulo 116', isMarker: false },
  { idx: 115, file: '115_cap_117.mp3', title: 'Capítulo 117', isMarker: false },
  { idx: 116, file: '116_cap_118.mp3', title: 'Capítulo 118', isMarker: false },
  { idx: 117, file: '117_cap_119.mp3', title: 'Capítulo 119', isMarker: false },
  { idx: 118, file: '118_cap_120.mp3', title: 'Capítulo 120', isMarker: false },
  { idx: 119, file: '119_cap_121.mp3', title: 'Capítulo 121', isMarker: false },
  { idx: 120, file: '120_cap_122.mp3', title: 'Capítulo 122', isMarker: false },
  { idx: 121, file: '121_cap_123.mp3', title: 'Capítulo 123', isMarker: false },
  { idx: 122, file: '122_cap_124.mp3', title: 'Capítulo 124', isMarker: false },
  { idx: 123, file: '123_cap_125.mp3', title: 'Capítulo 125', isMarker: false },
  { idx: 124, file: '124_cap_126.mp3', title: 'Capítulo 126', isMarker: false },
  { idx: 125, file: '125_cap_127.mp3', title: 'Capítulo 127', isMarker: false },
  { idx: 126, file: '126_cap_128.mp3', title: 'Capítulo 128', isMarker: false },
  { idx: 127, file: '127_cap_129.mp3', title: 'Capítulo 129', isMarker: false },
  { idx: 128, file: '128_cap_130.mp3', title: 'Capítulo 130', isMarker: false },
  { idx: 129, file: '129_cap_131.mp3', title: 'Capítulo 131', isMarker: false },
]

const PROGRESS_KEY = 'lsp_progress'
const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function nextPlayableIdx(fromIdx: number): number {
  let next = fromIdx + 1
  while (next < CHAPTERS.length && CHAPTERS[next].isMarker) {
    next++
  }
  return next < CHAPTERS.length ? next : -1
}

function prevPlayableIdx(fromIdx: number): number {
  let prev = fromIdx - 1
  while (prev >= 0 && CHAPTERS[prev].isMarker) {
    prev--
  }
  return prev >= 0 ? prev : -1
}

function audioUrl(file: string): string {
  const base = process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? ''
  // El streaming por capitulo del reproductor web usa siempre la calidad
  // "normal" (edge-tts) por ligereza; el M4B "premium" es solo para descarga.
  // El VPS reorganizo los MP3 en /normal/ y /premium/ (ver PASO 4/6, sep 2026).
  return `${base.replace(/\/$/, '')}/normal/${file}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AudiobookPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLButtonElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedRef = useRef<number>(0)
  const playStartSentRef = useRef(false)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showDrawer, setShowDrawer] = useState(false)

  // Saved progress banner state
  const [savedProgress, setSavedProgress] = useState<{ chapterIdx: number; currentTime: number } | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  // ---------------------------------------------------------------------------
  // Init: read saved progress
  // ---------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { chapterIdx: number; currentTime: number }
        if (
          typeof parsed.chapterIdx === 'number' &&
          parsed.chapterIdx > 0 &&
          parsed.chapterIdx < CHAPTERS.length
        ) {
          setSavedProgress(parsed)
          setShowBanner(true)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Save progress every 5 seconds
  // ---------------------------------------------------------------------------
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        localStorage.setItem(
          PROGRESS_KEY,
          JSON.stringify({ chapterIdx: currentIdx, currentTime: audioRef.current.currentTime })
        )
      }
    }, 5000)
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    }
  }, [currentIdx])

  // ---------------------------------------------------------------------------
  // Load chapter into audio element
  // ---------------------------------------------------------------------------
  const loadChapter = useCallback(
    (idx: number, seekTo = 0, autoplay = false) => {
      const audio = audioRef.current
      if (!audio) return
      const ch = CHAPTERS[idx]
      if (autoplay && !ch.isMarker) {
        trackEvent('chapter_start', { chapter_idx: ch.idx, chapter_title: ch.title })
      }
      setCurrentIdx(idx)
      setCurrentTime(0)
      setDuration(0)
      setIsLoading(true)
      audio.src = audioUrl(ch.file)
      audio.load()
      if (seekTo > 0) {
        const onCanPlay = () => {
          audio.currentTime = seekTo
          audio.removeEventListener('canplay', onCanPlay)
          if (autoplay) audio.play().catch(() => {})
        }
        audio.addEventListener('canplay', onCanPlay)
      } else if (autoplay) {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay)
          audio.play().catch(() => {})
        }
        audio.addEventListener('canplay', onCanPlay)
      }
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Scroll active chapter into view
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeItemRef.current && listRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentIdx])

  // ---------------------------------------------------------------------------
  // Audio event handlers
  // ---------------------------------------------------------------------------
  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    // Throttle saves via ref — only save if 5s elapsed since last manual save
    const now = Date.now()
    if (now - lastSavedRef.current >= 5000) {
      lastSavedRef.current = now
      localStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ chapterIdx: currentIdx, currentTime: audio.currentTime })
      )
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
    setIsLoading(false)
  }

  function handleCanPlay() {
    setIsLoading(false)
  }

  function handleWaiting() {
    setIsLoading(true)
  }

  function handlePlay() {
    setIsPlaying(true)
    if (!playStartSentRef.current) {
      playStartSentRef.current = true
      const ch = CHAPTERS[currentIdx]
      trackEvent('play_start', { chapter_idx: ch.idx, chapter_title: ch.title })
    }
  }

  function handlePause() {
    setIsPlaying(false)
  }

  function handleEnded() {
    const ch = CHAPTERS[currentIdx]
    if (!ch.isMarker) {
      trackEvent('chapter_complete', { chapter_idx: ch.idx, chapter_title: ch.title })
    }
    const next = nextPlayableIdx(currentIdx)
    if (next !== -1) {
      loadChapter(next, 0, true)
    } else {
      setIsPlaying(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const val = parseFloat(e.target.value)
    audio.currentTime = val
    setCurrentTime(val)
  }

  function skip(seconds: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0))
  }

  function goToPrev() {
    const prev = prevPlayableIdx(currentIdx)
    if (prev !== -1) loadChapter(prev, 0, isPlaying)
  }

  function goToNext() {
    const next = nextPlayableIdx(currentIdx)
    if (next !== -1) loadChapter(next, 0, isPlaying)
  }

  function selectChapter(idx: number) {
    if (CHAPTERS[idx].isMarker) return
    loadChapter(idx, 0, isPlaying)
    setShowDrawer(false)
  }

  function cycleSpeed() {
    const audio = audioRef.current
    const nextSpeedIdx = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length
    const nextSpeed = SPEEDS[nextSpeedIdx]
    setSpeed(nextSpeed)
    if (audio) audio.playbackRate = nextSpeed
  }

  // ---------------------------------------------------------------------------
  // Banner handlers
  // ---------------------------------------------------------------------------
  function resumeProgress() {
    if (!savedProgress) return
    setShowBanner(false)
    loadChapter(savedProgress.chapterIdx, savedProgress.currentTime, false)
  }

  function startFromBeginning() {
    setShowBanner(false)
    setSavedProgress(null)
    loadChapter(0, 0, false)
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const currentChapter = CHAPTERS[currentIdx]
  const hasPrev = prevPlayableIdx(currentIdx) !== -1
  const hasNext = nextPlayableIdx(currentIdx) !== -1
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  // ---------------------------------------------------------------------------
  // Chapter list (shared between sidebar and drawer)
  // ---------------------------------------------------------------------------
  function ChapterList() {
    return (
      <div ref={listRef} className="flex-1 overflow-y-auto py-2">
        {CHAPTERS.map((ch) => {
          const isActive = ch.idx === currentIdx
          if (ch.isMarker) {
            return (
              <div
                key={ch.idx}
                className="px-4 pt-5 pb-1 text-[#C9A84C]/60 text-xs uppercase tracking-widest font-semibold select-none"
              >
                {ch.title}
              </div>
            )
          }
          return (
            <button
              key={ch.idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => selectChapter(ch.idx)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-lg mx-1 ${
                isActive
                  ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {ch.title}
            </button>
          )
        })}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-full bg-[#050810] text-white flex flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
      />

      {/* Top bar */}
      <header className="h-14 flex-shrink-0 border-b border-[#C9A84C]/20 flex items-center px-4 gap-4 bg-[#050810] sticky top-0 z-20">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-widest">La Sombra del Pantocrator</p>
          <p className="text-sm text-white truncate">{currentChapter.title}</p>
        </div>
        {/* Mobile: chapters toggle */}
        <button
          className="md:hidden text-gray-400 hover:text-[#C9A84C] transition-colors text-sm border border-[#C9A84C]/30 rounded-lg px-3 py-1"
          onClick={() => setShowDrawer(true)}
        >
          Capítulos
        </button>
      </header>

      {/* Saved progress banner */}
      {showBanner && savedProgress && (
        <div className="bg-[#0D1117] border-b border-[#C9A84C]/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 z-10">
          <p className="text-sm text-gray-300 flex-1">
            <span className="text-[#C9A84C]">Retomar:</span>{' '}
            {CHAPTERS[savedProgress.chapterIdx]?.title} &middot;{' '}
            {formatTime(savedProgress.currentTime)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={resumeProgress}
              className="bg-[#C9A84C] hover:bg-[#D4B55C] text-[#050810] text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              Continuar
            </button>
            <button
              onClick={startFromBeginning}
              className="border border-[#C9A84C]/30 text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
            >
              Empezar desde el principio
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-[#C9A84C]/20 bg-[#0D1117] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#C9A84C]/20">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Capítulos</p>
          </div>
          <ChapterList />
        </aside>

        {/* Main player area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-lg space-y-8">
            {/* Chapter title */}
            <div className="text-center">
              <h2 className="text-2xl font-serif text-white">{currentChapter.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentIdx + 1} / {CHAPTERS.length}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="relative h-1 bg-[#C9A84C]/10 rounded-full overflow-visible">
                {/* Filled track */}
                <div
                  className="absolute top-0 left-0 h-full bg-[#C9A84C] rounded-full pointer-events-none"
                  style={{ width: `${progressPercent}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Prev chapter */}
              <button
                onClick={goToPrev}
                disabled={!hasPrev}
                className="text-gray-400 hover:text-white disabled:text-gray-700 transition-colors"
                aria-label="Capítulo anterior"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>

              {/* Skip -30s */}
              <button
                onClick={() => skip(-30)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="-30 segundos"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  <text x="6.5" y="14.5" fontSize="5" fill="currentColor" fontFamily="sans-serif">30</text>
                </svg>
              </button>

              {/* Play / Pause */}
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-[#C9A84C] hover:bg-[#D4B55C] text-[#050810] flex items-center justify-center transition-colors shadow-lg shadow-[#C9A84C]/20"
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#050810] border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Skip +30s */}
              <button
                onClick={() => skip(30)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="+30 segundos"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.01 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                  <text x="7.5" y="14.5" fontSize="5" fill="currentColor" fontFamily="sans-serif">30</text>
                </svg>
              </button>

              {/* Next chapter */}
              <button
                onClick={goToNext}
                disabled={!hasNext}
                className="text-gray-400 hover:text-white disabled:text-gray-700 transition-colors"
                aria-label="Capítulo siguiente"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                </svg>
              </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-600">Velocidad:</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s)
                    if (audioRef.current) audioRef.current.playbackRate = s
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    speed === s
                      ? 'bg-[#C9A84C]/10 border-[#C9A84C] text-[#C9A84C]'
                      : 'border-[#C9A84C]/20 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile chapter drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowDrawer(false)}
          />
          {/* Drawer panel */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0D1117] border-t border-[#C9A84C]/20 rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#C9A84C]/20 flex-shrink-0">
              <p className="text-sm font-semibold text-white">Capítulos</p>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <ChapterList />
          </div>
        </div>
      )}
    </div>
  )
}
