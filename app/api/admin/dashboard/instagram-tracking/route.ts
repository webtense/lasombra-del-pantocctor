import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type ManualPostInput = {
  url: string
  fecha: string
  caption?: string | null
  likes_esperados?: number | null
  comments_esperados?: number | null
  saves_esperados?: number | null
  notas?: string | null
}

function toRow(input: Record<string, unknown>): ManualPostInput | null {
  const url = String(input.url || '').trim()
  const fecha = String(input.fecha || '').trim()
  if (!url || !fecha) return null

  const toNum = (v: unknown) => {
    if (v === undefined || v === null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  return {
    url,
    fecha,
    caption: input.caption ? String(input.caption).trim() : null,
    likes_esperados: toNum(input.likes_esperados),
    comments_esperados: toNum(input.comments_esperados),
    saves_esperados: toNum(input.saves_esperados),
    notas: input.notas ? String(input.notas).trim() : null,
  }
}

// Parser CSV mínimo para el MVP: separador coma, primera fila = cabeceras,
// campos entre comillas dobles soportados para captions con comas.
// Cabeceras esperadas: url,fecha,caption,likes_esperados,comments_esperados,saves_esperados,notas
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []

  const splitLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    out.push(cur)
    return out.map((v) => v.trim())
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase())
  return lines.slice(1).map((line) => {
    const values = splitLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export async function GET() {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ configured: false, posts: [] })
  }

  const { data, error } = await sb
    .from('instagram_manual_posts')
    .select('*')
    .order('fecha', { ascending: false })

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, posts: [] }, { status: 500 })
  }

  return NextResponse.json({ configured: true, posts: data || [] })
}

// POST /api/admin/dashboard/instagram-tracking
// Body: objeto único { url, fecha, caption, likes_esperados, ... }
// o { csv: "url,fecha,caption,...\n..." } para carga masiva.
export async function POST(req: NextRequest) {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  try {
    const body = await req.json()

    if (typeof body.csv === 'string') {
      const rows = parseCsv(body.csv)
      const parsed = rows.map(toRow).filter((r): r is ManualPostInput => r !== null)
      const skipped = rows.length - parsed.length

      if (parsed.length === 0) {
        return NextResponse.json({ error: 'El CSV no tiene filas válidas (requiere al menos url y fecha)' }, { status: 400 })
      }

      const { data, error } = await sb.from('instagram_manual_posts').insert(parsed).select()
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ posts: data, inserted: data?.length || 0, skipped })
    }

    const row = toRow(body)
    if (!row) {
      return NextResponse.json({ error: 'Faltan url o fecha' }, { status: 400 })
    }

    const { data, error } = await sb.from('instagram_manual_posts').insert(row).select().single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
