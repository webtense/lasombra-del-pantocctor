import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
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

// Analítica fire-and-forget. NUNCA debe romper la descarga, pero tampoco
// puede quedarse sin .catch(): antes producía una promesa rechazada no
// capturada en CADA descarga (la tabla public.events no existía →
// PGRST205). Ahora el fallo se registra en el log y se traga aquí mismo.
function logEvent(req: NextRequest, eventType: string) {
  const sb = getServerSupabase()
  if (!sb) return
  const ua = req.headers.get('user-agent') || ''
  const deviceType = /mobile|android|iphone/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null
  Promise.resolve(
    sb.from('events').insert({
      session_id: null,
      ip_hash: ipHashOf(req),
      event_type: eventType,
      event_data: null,
      device_type: deviceType,
      country,
      referrer: req.headers.get('referer') || null,
    })
  )
    .then(({ error }) => {
      if (error) console.warn('[api/download] logEvent no registrado:', error.message)
    })
    .catch((err) => {
      console.warn('[api/download] logEvent excepción:', err instanceof Error ? err.message : err)
    })
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

const DATA_FILES: Record<Exclude<Format, 'audio_m4b'>, string> = {
  epub: 'libro.epub',
  pdf: 'libro.pdf',
  mobi: 'libro.mobi',
}

type Asset =
  | { kind: 'file'; path: string }
  | { kind: 'redirect'; url: string }

/**
 * Localiza el fichero (o la URL firmada) del formato pedido SIN registrar nada.
 *
 * Se llama ANTES de register_purchase_download: si el asset no existe —el caso
 * real del MOBI, que devolvía 503 pero ya había consumido una de las 5
 * descargas— el comprador recibe el error sin gastar cuota.
 */
function locateAsset(format: Format, quality: 'normal' | 'premium'): Asset | null {
  if (format === 'audio_m4b') {
    // Fichero grande: no se guarda en _data, se sirve por redirect a una URL
    // firmada de corta duración en el VPS (nginx secure_link), con fallback a
    // DRIVE_AUDIO_URL si el secreto del VPS no está configurado en Vercel.
    const signedUrl = getSignedAudiobookUrl(quality)
    if (signedUrl) return { kind: 'redirect', url: signedUrl }
    const driveUrl = process.env.DRIVE_AUDIO_URL
    if (driveUrl) return { kind: 'redirect', url: driveUrl }
    return null
  }

  const path = join(process.cwd(), 'app/api/download/_data', DATA_FILES[format])
  return existsSync(path) ? { kind: 'file', path } : null
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

  // FIX: comprobar la disponibilidad del fichero ANTES de contabilizar la
  // descarga. Antes se registraba primero y luego se devolvía 503 para el
  // MOBI (que no está generado): quien probaba ese enlace perdía una descarga
  // y no recibía nada.
  const quality = req.nextUrl.searchParams.get('quality') === 'premium' ? 'premium' : 'normal'
  const asset = locateAsset(format, quality)
  if (!asset) {
    const detail = format === 'mobi'
      ? 'MOBI aún no generado (ver scripts/convert-ebooks.sh)'
      : format === 'audio_m4b'
        ? 'Audiolibro no disponible aún'
        : `Fichero ${format} no disponible`
    console.error('[api/download] asset no disponible, no se contabiliza descarga:', format)
    return NextResponse.json({ error: detail, counted: false }, { status: 503 })
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
    if (asset.kind === 'redirect') {
      return NextResponse.redirect(asset.url, { status: 302 })
    }

    if (format === 'epub') {
      const raw = readFileSync(asset.path)
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
      const raw = readFileSync(asset.path)
      const watermarked = await watermarkPdf(new Uint8Array(raw), { email: verified.email, sessionId: verified.sessionId })
      return new NextResponse(Buffer.from(watermarked), {
        headers: {
          'Content-Type': CONTENT_TYPES.pdf,
          'Content-Disposition': `attachment; filename="${FILENAMES.pdf}"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    // mobi: se sirve tal cual, sin marca de agua.
    const data = readFileSync(asset.path)
    return new NextResponse(data, {
      headers: {
        'Content-Type': CONTENT_TYPES[format],
        'Content-Disposition': `attachment; filename="${FILENAMES[format]}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[api/download] error sirviendo fichero', format, err)
    return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 })
  }
}
