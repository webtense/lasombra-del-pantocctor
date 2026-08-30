import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function ipHashOf(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0'
  return createHash('sha256').update(ip + 'lsp-tester-salt-2026').digest('hex').slice(0, 16)
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token
  const fileType = (req.nextUrl.searchParams.get('type') || '').toLowerCase()

  if (!['epub', 'pdf', 'audio'].includes(fileType)) {
    return NextResponse.json({ error: 'type debe ser epub, pdf o audio' }, { status: 400 })
  }

  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  const { data: regRows, error } = await sb.rpc('register_tester_download', {
    p_token: token,
    p_file_type: fileType,
    p_ip_hash: ipHashOf(req),
    p_user_agent: req.headers.get('user-agent') || null,
  })

  if (error) {
    console.error('[api/tester/download] register_tester_download error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = Array.isArray(regRows) ? regRows[0] : regRows

  if (!result?.ok) {
    const reason = result?.reason || 'invalid'
    const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
    return NextResponse.redirect(`${base}/tester/${token}?error=${reason}`, { status: 302 })
  }

  if (fileType === 'epub') {
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
      return NextResponse.json({ error: 'EPUB no disponible' }, { status: 404 })
    }
  }

  if (fileType === 'pdf') {
    try {
      const pdfPath = join(process.cwd(), 'app/api/tester/_data/libro.pdf')
      const data = readFileSync(pdfPath)
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="la-sombra-del-pantocrator.pdf"',
          'Cache-Control': 'no-store',
        },
      })
    } catch {
      return NextResponse.json({ error: 'PDF no disponible' }, { status: 404 })
    }
  }

  // audio: mismo enlace que usan los compradores (zip/carpeta con los MP3)
  const driveUrl = process.env.DRIVE_AUDIO_URL
  if (!driveUrl) {
    return NextResponse.json({ error: 'Audiolibro no disponible aún' }, { status: 503 })
  }
  return NextResponse.redirect(driveUrl, { status: 302 })
}
