import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const VALID_STATES = ['planificada', 'en_curso', 'pausada', 'finalizada']

export async function GET() {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ configured: false, campaigns: [] })
  }

  const { data, error } = await sb
    .from('marketing_campaigns')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) {
    return NextResponse.json({ configured: true, error: error.message, campaigns: [] }, { status: 500 })
  }

  return NextResponse.json({ configured: true, campaigns: data || [] })
}

export async function POST(req: NextRequest) {
  const sb = getServerSupabase()
  if (!sb) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
  }

  try {
    const { fecha, plataforma, presupuesto, estado, notas } = await req.json()

    if (!fecha || !plataforma) {
      return NextResponse.json({ error: 'Faltan fecha o plataforma' }, { status: 400 })
    }
    const estadoFinal = VALID_STATES.includes(estado) ? estado : 'planificada'

    const { data, error } = await sb
      .from('marketing_campaigns')
      .insert({
        fecha,
        plataforma: String(plataforma).trim(),
        presupuesto: Number(presupuesto) || 0,
        estado: estadoFinal,
        notas: notas || null,
      })
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
