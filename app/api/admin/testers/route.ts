import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { hasValidAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

// Crea (o actualiza) un tester. Exige sesión de admin: el flag en
// sessionStorage del panel legacy vivía solo en el navegador y no llegaba
// aquí, así que esta ruta se podía invocar directamente sin credenciales.
// La comprobación se repite en el handler además de en middleware.ts para
// que la ruta no dependa de que el matcher siga cubriéndola.
export async function POST(req: NextRequest) {
  try {
    if (!(await hasValidAdminSession(req))) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

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
