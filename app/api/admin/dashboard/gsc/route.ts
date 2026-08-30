import { NextResponse } from 'next/server'
import { getGoogleAccessToken, getServiceAccountCreds } from '@/lib/google-service-account'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

// GET /api/admin/dashboard/gsc
// Impresiones + CTR de los últimos 28 días desde Google Search Console.
// Requiere:
//   GSC_SITE_URL                            (ej. "https://lasombradelpantocrator.com")
//   GOOGLE_SERVICE_ACCOUNT_EMAIL             (añadido como usuario en Search Console)
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
export async function GET() {
  const siteUrl = process.env.GSC_SITE_URL
  const creds = getServiceAccountCreds()

  if (!siteUrl || !creds) {
    return NextResponse.json({
      configured: false,
      docsUrl: 'https://developers.google.com/webmaster-tools/v1/searchanalytics/query',
      message:
        'Search Console no configurado. Faltan GSC_SITE_URL y/o las credenciales de service account.',
    })
  }

  const accessToken = await getGoogleAccessToken('https://www.googleapis.com/auth/webmasters.readonly')
  if (!accessToken) {
    return NextResponse.json({ configured: true, error: 'No se pudo autenticar con Google' }, { status: 502 })
  }

  const end = new Date()
  const start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000)

  try {
    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: fmtDate(start),
          endDate: fmtDate(end),
          dimensions: ['query'],
          rowLimit: 10,
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[dashboard/gsc] query error', res.status, body)
      return NextResponse.json({ configured: true, error: `GSC API ${res.status}` }, { status: 502 })
    }

    const json = await res.json()
    const rows = (json.rows || []) as { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[]
    const impressions = rows.reduce((a, r) => a + r.impressions, 0)
    const clicks = rows.reduce((a, r) => a + r.clicks, 0)
    const ctr = impressions > 0 ? clicks / impressions : 0

    return NextResponse.json({
      configured: true,
      impressions,
      clicks,
      ctr,
      topQueries: rows,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ configured: true, error: msg }, { status: 500 })
  }
}
