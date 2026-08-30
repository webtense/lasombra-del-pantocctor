// Google Analytics 4 (gtag.js) — carga condicional vía NEXT_PUBLIC_GA_MEASUREMENT_ID.
// Si la variable no está configurada, todas las llamadas son no-ops seguras
// (igual que el patrón ya usado para Supabase en lib/track-event.ts).

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function gtagEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', action, params || {})
}
