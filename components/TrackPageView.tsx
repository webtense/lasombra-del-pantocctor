'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function generateSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'lsp_session'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, sid)
  }
  return sid
}

export default function TrackPageView() {
  const pathname = usePathname()

  useEffect(() => {
    const track = async () => {
      try {
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            session_id: generateSessionId(),
          }),
        })
      } catch {
        // Silently fail — analytics should never break the UX
      }
    }
    track()
  }, [pathname])

  return null
}
