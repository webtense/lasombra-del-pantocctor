import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { name, email, rating, opinion } = await req.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
    }
    const ratingNum = Number(rating)
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Calificación no válida (1-5)' }, { status: 400 })
    }

    const sb = getServerSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const { data: rows, error } = await sb.rpc('submit_tester_review', {
      p_token: params.token,
      p_name: name.trim(),
      p_email: email || null,
      p_rating: ratingNum,
      p_opinion: opinion || null,
    })

    if (error) {
      console.error('[api/tester/review] submit_tester_review error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = Array.isArray(rows) ? rows[0] : rows
    if (!result?.ok) {
      return NextResponse.json({ error: result?.reason || 'Enlace no válido' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
