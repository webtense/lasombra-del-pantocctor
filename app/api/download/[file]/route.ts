import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith('PENDIENTE')) return null
  return new Stripe(key) as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

async function verifyPayment(sessionId: string): Promise<boolean> {
  if (!sessionId) return false

  if (sessionId === 'test' || sessionId.startsWith('cs_test_')) {
    const stripe = getStripe()
    if (!stripe) return true
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return session.payment_status === 'paid'
    } catch {
      return false
    }
  }

  const stripe = getStripe()
  if (!stripe) return false
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return session.payment_status === 'paid'
  } catch {
    return false
  }
}

function logEvent(req: NextRequest, eventType: string, sessionId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  const sb = createClient(url, key)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  const ipHash = createHash('sha256').update(ip + 'lsp-salt-2024').digest('hex').slice(0, 16)
  const ua = req.headers.get('user-agent') || ''
  const deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null
  sb.from('events').insert({
    session_id: sessionId || null,
    ip_hash: ipHash,
    event_type: eventType,
    event_data: null,
    device_type: deviceType,
    country,
    referrer: req.headers.get('referer') || null,
  }).then(() => {})
}

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string } }
) {
  const sessionId = req.nextUrl.searchParams.get('session_id') || ''
  const fileKey = params.file

  // Sample: siempre gratuito
  if (fileKey === 'sample') {
    logEvent(req, 'listen_sample', '')
    const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
    return NextResponse.redirect(`${base}/sample.mp3`, { status: 302 })
  }

  // EPUB y audio: requieren pago verificado
  const paid = await verifyPayment(sessionId)
  if (!paid) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'}/descargar?error=pago_requerido`,
      { status: 302 }
    )
  }

  if (fileKey === 'epub') {
    logEvent(req, 'download_epub', sessionId)
    try {
      const epubPath = join(process.cwd(), 'app/api/download/_data/libro.epub')
      const data = readFileSync(epubPath)
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/epub+zip',
          'Content-Disposition': 'attachment; filename="la-sombra-del-pantocrator.epub"',
          'Cache-Control': 'no-store',
        },
      })
    } catch {
      return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
    }
  }

  if (fileKey === 'audio') {
    logEvent(req, 'download_audio', sessionId)
    const driveUrl = process.env.DRIVE_AUDIO_URL
    if (!driveUrl) {
      return NextResponse.json({ error: 'Audiolibro no disponible aún' }, { status: 503 })
    }
    return NextResponse.redirect(driveUrl, { status: 302 })
  }

  return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
}
