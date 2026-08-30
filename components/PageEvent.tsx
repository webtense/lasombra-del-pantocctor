'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/track-event'

interface PageEventProps {
  event: string
  eventData?: Record<string, unknown>
}

// Dispara un evento (GA4 + analítica interna) una vez al montar la página.
// Usado para eventos de producto que no encajan en TrackPageView (page_view genérico):
// view_book (resumen, descargar), read_sample (muestra).
export default function PageEvent({ event, eventData }: PageEventProps) {
  useEffect(() => {
    trackEvent(event, eventData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
