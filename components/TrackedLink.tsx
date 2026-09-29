'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { trackEvent } from '@/lib/track-event'

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  event: string
  eventData?: Record<string, unknown>
}

// Envuelve next/link para disparar un evento GA4 + analítica interna al hacer click,
// sin necesidad de convertir la página que lo usa en Client Component.
export default function TrackedLink({ event, eventData, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event, eventData)
        onClick?.(e)
      }}
    />
  )
}
