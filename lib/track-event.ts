'use client'

import { gtagEvent } from './gtag'

// Eventos de producto/marketing (GA4 + analítica interna en Supabase vía /api/event).
// Usar SIEMPRE este helper desde componentes cliente en vez de duplicar el fetch.

export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'lsp_session'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, sid)
  }
  return sid
}

export function trackEvent(eventType: string, eventData?: Record<string, unknown>) {
  // GA4
  gtagEvent(eventType, eventData)

  // Analítica interna (Supabase) — silenciosa, nunca debe romper la UX
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
