import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// getServerSupabase() (y no createClient() a pelo) porque es el único cliente
// que fuerza cache:'no-store' en el fetch — si no, el Data Cache de Next.js
// deduplica los INSERT con el mismo body y se pierden eventos.

function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'lsp-salt-2024').digest('hex').slice(0, 16)
}

function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'mobile'
  if (/tablet|ipad/.test(ua)) return 'tablet'
  return 'desktop'
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  )
}

// Valid event types
const VALID_EVENTS = new Set([
  'view_book',
  'read_sample',
  'view_sample',
  'download_epub',
  'download_audio',
  'listen_sample',
  'play_start',
  'chapter_start',
  'chapter_complete',
  'purchase',
  'click_amazon',
  'view_sample_cta',
  'view_buy_cta',
  'submit_email_sample',
])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, event_data, session_id, referrer, user_agent } = body

    if (!VALID_EVENTS.has(event_type)) {
      return NextResponse.json({ ok: false, error: 'Invalid event_type' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const ip = getClientIP(req)
    const ipHash = hashIP(ip)
    const deviceType = detectDevice(user_agent || req.headers.get('user-agent') || '')
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null

    const supabase = getServerSupabase()
    if (!supabase) return NextResponse.json({ ok: true, skipped: true })

    const { error } = await supabase.from('events').insert({
      session_id: session_id || null,
      ip_hash: ipHash,
      event_type,
      event_data: event_data || null,
      device_type: deviceType,
      country,
      referrer: referrer || null,
    })

    if (error) {
      console.error('[event] Supabase insert error:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[event] Unexpected error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
