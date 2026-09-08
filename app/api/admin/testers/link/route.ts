import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'
import { sendTesterLinkEmail } from '@/lib/send-tester-email'
import { hasValidAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

const DEFAULT_TTL_HOURS = 48

// Genera un token de descarga para un tester y (si hay BREVO_API_KEY) le
// envía el email con el link. Siempre devuelve la URL para que el admin
// pueda copiarla/enviarla a mano si el email falla o no está configurado.
//
// Exige sesión de admin ANTES de tocar nada: sin esta comprobación, cualquiera
// podía crear testers, emitir tokens de descarga válidos y disparar envíos de
// email desde nuestra cuenta de Brevo.
export async function POST(req: NextRequest) {
  try {
    if (!(await hasValidAdminSession(req))) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { testerId, email, name, hours, sendEmail } = await req.json()

    const sb = getServerSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 })
    }

    // Permite pasar testerId directo, o email+name para crear el tester al vuelo
    let tId: number | null = testerId ?? null
    let testerEmail: string | null = email ?? null
    let testerName: string | null = name ?? null

    if (!tId) {
      if (!testerEmail) {
        return NextResponse.json({ error: 'Falta testerId o email' }, { status: 400 })
      }
      const { data: tester, error: upsertErr } = await sb.rpc('upsert_tester', {
        p_email: testerEmail.trim(),
        p_name: testerName || null,
        p_notes: null,
      })
      if (upsertErr) {
        return NextResponse.json({ error: upsertErr.message }, { status: 500 })
      }
      tId = (tester as { id: number }).id
      testerEmail = (tester as { email: string }).email
      testerName = (tester as { name: string | null }).name
    } else {
      const { data: tester } = await sb.from('testers').select('email,name').eq('id', tId).single()
      if (tester) {
        testerEmail = tester.email as string
        testerName = tester.name as string | null
      }
    }

    const ttlHours = Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 7) : DEFAULT_TTL_HOURS

    const { data: tokenRows, error: tokenErr } = await sb.rpc('create_tester_token', {
      p_tester_id: tId,
      p_ttl_hours: ttlHours,
    })

    if (tokenErr) {
      console.error('[api/admin/testers/link] create_tester_token error', tokenErr)
      return NextResponse.json({ error: tokenErr.message }, { status: 500 })
    }

    const row = Array.isArray(tokenRows) ? tokenRows[0] : tokenRows
    const token = row?.token as string
    const expiresAt = row?.expires_at as string

    const base = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'
    const url = `${base.replace(/\/$/, '')}/tester/${token}`

    let emailResult: { sent: boolean; error?: string } = { sent: false, error: 'no solicitado' }
    if (sendEmail !== false && testerEmail) {
      emailResult = await sendTesterLinkEmail({
        toEmail: testerEmail,
        toName: testerName,
        url,
        expiresAt,
      })
    }

    return NextResponse.json({ token, url, expiresAt, emailSent: emailResult.sent, emailError: emailResult.error })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    console.error('[api/admin/testers/link]', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
