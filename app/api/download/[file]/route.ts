import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { getServerSupabase } from '@/lib/supabase'
import { verifyDownloadToken } from '@/lib/download-token'
import { watermarkPdf, watermarkEpub } from '@/lib/watermark'
import { getSignedAudiobookUrl } from '@/lib/vps-audio-link'

export const dynamic = 'force-dynamic'

const VALID_FORMATS = ['epub', 'pdf', 'mobi', 'audio_m4b'] as const
type Format = (typeof VALID_FORMATS)[number]

function ipHashOf(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  return createHash('sha256').update(ip + 'lsp-purchase-salt-2026').digest('hex').slice(0, 16)
}

function logEvent(req: NextRequest, eventType: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  const sb = createClient(url, key)
  const ua = req.headers.get('user-agent') || ''
  const deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null
  sb.from('events').insert({
    session_id: null,
    ip_hash: ipHashOf(req),
    event_type: eventType,
    event_data: null,
    device_type: deviceType,
    country,
    referrer: req.headers.get('referer') || null,
  }).then(() => {})
}

const CONTENT_TYPES: Record<Format, string> = {
  epub: 'application/epub+zip',
  pdf: 'application/pdf',
  mobi: 'application/x-mobipocket-ebook',
  audio_m4b: 'audio/mp4',
}

const FILENAMES: Record<Format, string> = {
  epub: 'la-sombra-del-pantocrator.epub',
  pdf: 'la-sombra-del-pantocrator.pdf',
  mobi: 'la-sombra-del-pantocrator.mobi',
  audio_m4b: 'la-sombra-del-pantocrator.m4b',
}

export async function GET(
  req: NextRequest,
  { params }: { params: { file: string } }
) {
  const fileKey = params.file

  // Sample: siempre gratuito, sin token (usado para escuchar el avance).
  if (fileKey === 'sample') {
    logEvent(req, 'listen_sample')
    const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
    return NextResponse.redirect(`${base}/sample.mp3`, { status: 302 })
  }

  if (!VALID_FORMATS.includes(fileKey as Format)) {
    return NextResponse.json({ error: 'Formato no válido' }, { status: 404 })
  }
  const format = fileKey as Format

  // Descargas pagadas: se validan por dtoken (HMAC), no por session_id.
  const dtoken = req.nextUrl.searchParams.get('dtoken')
  const verified = await verifyDownloadToken(dtoken)
  if (!verified.valid) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  if (!verified.formats.includes(format)) {
    return NextResponse.json({ error: 'format_not_purchased' }, { status: 403 })
  }

  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  const { data: regRows, error } = await sb.rpc('register_purchase_download', {
    p_stripe_session_id: verified.sessionId,
    p_file_type: format,
    p_ip_hash: ipHashOf(req),
    p_user_agent: req.headers.get('user-agent') || null,
  })

  if (error) {
    console.error('[api/download] register_purchase_download error', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }

  const result = Array.isArray(regRows) ? regRows[0] : regRows
  if (!result?.ok) {
    const reason = result?.reason || 'invalid'
    const status = reason === 'not_found' ? 404 : 403
    return NextResponse.json({ error: reason }, { status })
  }

  logEvent(req, `download_${format}`)

  try {
    if (format === 'epub') {
      const epubPath = join(process.cwd(), 'app/api/download/_data/libro.epub')
      const raw = readFileSync(epubPath)
      const watermarked = await watermarkEpub(raw, { email: verified.email, sessionId: verified.sessionId })
      return new NextResponse(Buffer.from(watermarked), {
        headers: {
          'Content-Type': CONTENT_TYPES.epub,
          'Content-Disposition': `attachment; filename="${FILENAMES.epub}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'pdf') {
      const pdfPath = join(process.cwd(), 'app/api/download/_data/libro.pdf')
      const raw = readFileSync(pdfPath)
      const watermarked = await watermarkPdf(new Uint8Array(raw), { email: verified.email, sessionId: verified.sessionId })
      return new NextResponse(Buffer.from(watermarked), {
        headers: {
          'Content-Type': CONTENT_TYPES.pdf,
          'Content-Disposition': `attachment; filename="${FILENAMES.pdf}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    if (format === 'mobi') {
      const mobiPath = join(process.cwd(), 'app/api/download/_data/libro.mobi')
      if (!existsSync(mobiPath)) {
        return NextResponse.json({ error: 'MOBI aún no generado (ver scripts/convert-ebooks.sh)' }, { status: 503 })
      }
      const data = readFileSync(mobiPath)
      return new NextResponse(data, {
        headers: {
          'Content-Type': CONTENT_TYPES.mobi,
          'Content-Disposition': `attachment; filename="${FILENAMES.mobi}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // audio_m4b: fichero grande, no se guarda en _data — se sirve vía
    // redirect a una URL firmada de corta duración en el VPS (nginx
    // secure_link). Fallback a DRIVE_AUDIO_URL si el secreto del VPS
    // no está aún configurado en Vercel.
    const quality = req.nextUrl.searchParams.get('quality') === 'premium' ? 'premium' : 'normal'
    const signedUrl = getSignedAudiobookUrl(quality)
    if (signedUrl) {
      return NextResponse.redirect(signedUrl, { status: 302 })
    }

    const driveUrl = process.env.DRIVE_AUDIO_URL
    if (!driveUrl) {
      return NextResponse.json({ error: 'Audiolibro no disponible aún' }, { status: 503 })
    }
    return NextResponse.redirect(driveUrl, { status: 302 })
  } catch (err) {
    console.error('[api/download] error sirviendo fichero', format, err)
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
  }
}
