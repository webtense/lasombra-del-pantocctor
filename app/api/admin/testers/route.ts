import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Crea (o actualiza) un tester. No requiere sesión propia: esta ruta solo
// es alcanzable desde el panel /admin/testers, que ya está protegido por
// el login de sessionStorage + /api/admin/auth.
export async function POST(req: NextRequest) {
  try {
    const { email, name, notes } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Email no válido' }, { status: 400 })
    }

    const sb = getServerSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    const { data, error } = await sb.rpc('upsert_tester', {
      p_email: email.trim(),
      p_name: name || null,
      p_notes: notes || null,
    })

    if (error) {
      console.error('[api/admin/testers] upsert_tester error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ tester: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
