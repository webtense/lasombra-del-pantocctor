import { trackEvent } from './track-event'

// Helpers de producto sobre trackEvent() (GA4 + analítica interna Supabase vía
// /api/event, ver lib/track-event.ts). Centraliza los nombres de evento del
// funnel de venta para que no queden dispersos como strings sueltos por
// componentes/páginas.

export function trackViewBook(eventData?: Record<string, unknown>) {
  trackEvent('view_book', eventData)
}

export function trackReadSample(eventData?: Record<string, unknown>) {
  trackEvent('read_sample', eventData)
}

export function trackListenSample(eventData?: Record<string, unknown>) {
  trackEvent('listen_sample', eventData)
}

export function trackClickAmazon(eventData?: Record<string, unknown>) {
  trackEvent('click_amazon', eventData)
}

export function trackPurchase(eventData?: Record<string, unknown>) {
  trackEvent('purchase', eventData)
}
