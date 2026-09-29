import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const VALID_STATES = ['planificada', 'en_curso', 'pausada', 'finalizada']

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
    if (body.fecha) update.fecha = body.fecha
    if (body.plataforma) update.plataforma = String(body.plataforma).trim()
    if (body.presupuesto !== undefined) update.presupuesto = Number(body.presupuesto) || 0
    if (body.estado && VALID_STATES.includes(body.estado)) update.estado = body.estado
    if (body.notas !== undefined) update.notas = body.notas || null

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
    }

    const { data, error } = await sb
      .from('marketing_campaigns')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign: data })
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

  const { error } = await sb.from('marketing_campaigns').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
