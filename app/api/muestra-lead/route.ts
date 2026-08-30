import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Alta de nombre + email en la tabla `newsletter_muestra` (ver
// supabase-schema-newsletter-muestra.sql), capturados desde el formulario
// de la landing /muestra. Mismo patrón defensivo que /api/newsletter: si
// Supabase no está configurado o la tabla no existe todavía, no se bloquea
// al usuario — se deja constancia en el log del servidor.
export async function POST(req: NextRequest) {
  try {
    const { name, email, session_id } = await req.json()

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ ok: false, error: 'Nombre no válido' }, { status: 400 })
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: 'Email no válido' }, { status: 400 })
    }

    const supabase = getServerSupabase()
    if (!supabase) {
      console.log(`[muestra-lead] Supabase no configurada — alta pendiente: ${name.trim()} <${email.trim()}>`)
      return NextResponse.json({ ok: true, skipped: true })
    }

    const { error } = await supabase.from('newsletter_muestra').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      session_id: typeof session_id === 'string' ? session_id : null,
    })

    if (error) {
      // Email duplicado (constraint unique): ya está en la lista, no es un
      // error de cara al usuario. Código "42P01" = la tabla aún no existe
      // (falta ejecutar supabase-schema-newsletter-muestra.sql) — tampoco
      // debe romper la experiencia del formulario.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true })
      }
      console.error('[muestra-lead] Supabase insert error:', error.message)
      return NextResponse.json({ ok: true, skipped: true })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Petición inválida' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
