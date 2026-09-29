import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { stripeSessionId, email } = await req.json()

    if (!stripeSessionId || !email) {
      return NextResponse.json({ error: 'Required fields' }, { status: 400 })
    }

    const { data: purchase } = await supabase
      .from('purchases').select('*').eq('p_stripe_session_id', stripeSessionId).single()

    if (!purchase) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })

    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await supabase.from('download_tokens').insert({ token, email, stripe_session_id: stripeSessionId, expires_at: expiresAt.toISOString(), used: false })

    const downloadUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${token}`

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': process.env.BREVO_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [{ email }],
        sender: { name: 'Andrés Sánchez', email: 'noreply@lasombradelpantocrator.com' },
        subject: '¡Tu descarga está lista!',
        htmlContent: `<p><a href="${downloadUrl}">DESCARGAR AHORA</a></p>`,
      }),
    })

    return NextResponse.json({ success: true, token, expiresAt })
  } catch (error) {
    return NextResponse.json({ error: 'Download error' }, { status: 500 })
  }
}
