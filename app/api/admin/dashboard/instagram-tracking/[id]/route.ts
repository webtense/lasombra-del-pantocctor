import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const update: Record<string, unknown> = {}
    if (body.url) update.url = String(body.url).trim()
    if (body.fecha) update.fecha = body.fecha
    if (body.caption !== undefined) update.caption = body.caption || null
    if (body.likes_esperados !== undefined) update.likes_esperados = body.likes_esperados === '' ? null : Number(body.likes_esperados)
    if (body.comments_esperados !== undefined) update.comments_esperados = body.comments_esperados === '' ? null : Number(body.comments_esperados)
    if (body.saves_esperados !== undefined) update.saves_esperados = body.saves_esperados === '' ? null : Number(body.saves_esperados)
    if (body.notas !== undefined) update.notas = body.notas || null

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const { data, error } = await sb
      .from('instagram_manual_posts')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  const { error } = await sb.from('instagram_manual_posts').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
