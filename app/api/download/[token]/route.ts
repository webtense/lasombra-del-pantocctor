import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { data: record } = await supabase.from('download_tokens').select('*').eq('token', params.token).single()

    if (!record || new Date() > new Date(record.expires_at) || record.used) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const zip = new JSZip()
    const base = '/home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator'
    const files = [
      { name: 'libro.epub', path: `${base}/01-MANUSCRITO/La_Sombra_del_Pantocctor_REVISION_5.epub` },
      { name: 'libro.pdf', path: `${base}/01-MANUSCRITO/La_Sombra_del_Pantocrator_REVISION_5_FINAL.pdf` },
      { name: 'audiolibro.mp3', path: `${base}/04-AUDIO/distribucion/la-sombra-del-pantocctor-completo.mp3` },
    ]

    for (const f of files) {
      if (fs.existsSync(f.path)) {
        zip.file(f.name, fs.readFileSync(f.path))
      }
    }

    await supabase.from('download_tokens').update({ used: true }).eq('token', params.token)

    const buf = await zip.generateAsync({ type: 'nodebuffer' })
    return new NextResponse(buf, {
      headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="libro.zip"' },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}
