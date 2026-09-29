import { NextResponse } from 'next/server'
import { getGoogleAccessToken, getServiceAccountCreds } from '@/lib/google-service-account'

export const dynamic = 'force-dynamic'

// GET /api/admin/dashboard/ga4
// Sesiones + compras (conversions) desde Google Analytics 4, vía la
// Data API (v1beta). Requiere:
//   GA4_PROPERTY_ID                        (ej. "properties/123456789")
//   GOOGLE_SERVICE_ACCOUNT_EMAIL            (con acceso "Viewer" en GA4)
//   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
// Si falta cualquiera, devuelve { configured: false } con el link de docs.
export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID
  const creds = getServiceAccountCreds()

  if (!propertyId || !creds) {
    return NextResponse.json({
      configured: false,
      docsUrl: 'https://developers.google.com/analytics/devguides/reporting/data/v1',
      message:
        'GA4 no configurado. Faltan GA4_PROPERTY_ID y/o las credenciales de service account (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY).',
    })
  }

  const accessToken = await getGoogleAccessToken('https://www.googleapis.com/auth/analytics.readonly')
  if (!accessToken) {
    return NextResponse.json({ configured: true, error: 'No se pudo autenticar con Google (revisa la clave del service account)' }, { status: 502 })
  }

  const property = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`

  try {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [
          { startDate: '7daysAgo', endDate: 'today', name: 'last7d' },
          { startDate: '30daysAgo', endDate: 'today', name: 'last30d' },
        ],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'totalUsers' }],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[dashboard/ga4] runReport error', res.status, body)
      return NextResponse.json({ configured: true, error: `GA4 API ${res.status}` }, { status: 502 })
    }

    const json = await res.json()
    return NextResponse.json({
      configured: true,
      raw: json,
      links: {
        realtime: 'https://analytics.google.com/analytics/web/#/p/realtime/rt-overview',
        acquisition: 'https://analytics.google.com/analytics/web/#/p/reports/reportinghub',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ configured: true, error: msg }, { status: 500 })
  }
}
