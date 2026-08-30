import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/admin/dashboard/email
// Suscriptores: se cuentan siempre desde la tabla `leads` propia (el
// formulario de la web ya los guarda ahí, ver supabase-schema.sql).
// Tasa de apertura: si hay BREVO_API_KEY (el ESP que ya usa el proyecto
// para los emails de testers, ver lib/send-tester-email.ts), se trae la
// última campaña enviada desde Brevo. Si no, "No configurado".
export async function GET() {
  const sb = getServerSupabase()
  const { count: subscribersCount } = sb
    ? await sb.from('leads').select('*', { count: 'exact', head: true })
    : { count: 0 }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      subscribers: subscribersCount || 0,
      docsUrl: 'https://developers.brevo.com/reference/getcampaignreport',
      message: 'BREVO_API_KEY no configurada — no hay tasa de apertura disponible.',
    })
  }

  try {
    const res = await fetch(
      'https://api.brevo.com/v3/emailCampaigns?statistics=globalStats&limit=1&offset=0&sort=desc',
      { headers: { Accept: 'application/json', 'api-key': apiKey } }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[dashboard/email] Brevo error', res.status, body)
      return NextResponse.json({
        configured: true,
        subscribers: subscribersCount || 0,
        error: `Brevo API ${res.status}`,
      })
    }

    const json = await res.json()
    const campaign = json.campaigns?.[0]
    const stats = campaign?.statistics?.globalStats

    const openRate = stats && stats.delivered > 0 ? stats.uniqueViews / stats.delivered : null

    return NextResponse.json({
      configured: true,
      subscribers: subscribersCount || 0,
      lastCampaign: campaign
        ? {
            name: campaign.name,
            sentDate: campaign.sentDate,
            delivered: stats?.delivered ?? null,
            uniqueOpens: stats?.uniqueViews ?? null,
            openRate,
          }
        : null,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ configured: true, subscribers: subscribersCount || 0, error: msg })
  }
}
