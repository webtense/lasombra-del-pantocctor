import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type IgMedia = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
  like_count?: number
  comments_count?: number
}

type IgPost = {
  id: string
  caption?: string
  media_type: string
  media_url?: string
  permalink: string
  timestamp: string
  likes: number
  comments: number
  saves: number | null
}

// Métrica "saved" vía Graph API Insights. No todos los tipos de media la
// soportan (p. ej. algunos VIDEO antiguos) — se pide en paralelo y se
// tolera el fallo por post sin romper el resto del listado.
async function fetchSaves(mediaId: string, token: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=saved&access_token=${token}`
    )
    if (!res.ok) return null
    const json = await res.json()
    const value = json?.data?.[0]?.values?.[0]?.value
    return typeof value === 'number' ? value : null
  } catch {
    return null
  }
}

// GET /api/admin/dashboard/instagram
// Últimos 10 posts + likes/comentarios/guardados vía Instagram Graph API.
// Requiere (ver .env.local.example y guía de setup en README de esta ruta):
//   INSTAGRAM_ACCESS_TOKEN          token de larga duración de la cuenta de negocio/creador
//   INSTAGRAM_BUSINESS_ACCOUNT_ID   IG Business Account ID
//   INSTAGRAM_USER_ID               alias legacy del anterior, se acepta igual
export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID

  if (!token || !userId) {
    return NextResponse.json({
      configured: false,
      docsUrl: 'https://developers.facebook.com/docs/instagram-api/guides/insights',
      message:
        'Instagram no configurado. Faltan INSTAGRAM_ACCESS_TOKEN y/o INSTAGRAM_BUSINESS_ACCOUNT_ID. Vincula la cuenta desde Meta App > Settings > Instagram, o trackea manualmente mientras tanto (tabla e importación CSV más abajo).',
    })
  }

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${userId}/media?fields=${fields}&limit=10&access_token=${token}`
    )

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[dashboard/instagram] media error', res.status, body)
      return NextResponse.json({ configured: true, error: `Instagram API ${res.status}` }, { status: 502 })
    }

    const json = await res.json()
    const media = (json.data || []) as IgMedia[]

    const posts: IgPost[] = await Promise.all(
      media.map(async (m) => ({
        id: m.id,
        caption: m.caption,
        media_type: m.media_type,
        media_url: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        permalink: m.permalink,
        timestamp: m.timestamp,
        likes: m.like_count ?? 0,
        comments: m.comments_count ?? 0,
        saves: await fetchSaves(m.id, token),
      }))
    )

    return NextResponse.json({ configured: true, posts })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ configured: true, error: msg }, { status: 500 })
  }
}
