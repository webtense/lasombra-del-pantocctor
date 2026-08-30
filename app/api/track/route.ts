import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { page, referrer, user_agent, session_id } = body

    // Skip if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const ip = getClientIP(req)
    const ipHash = hashIP(ip)
    const deviceType = detectDevice(user_agent || '')

    // Attempt to get country from Cloudflare header (available in Vercel Edge)
    const country = req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || null

    const supabase = getSupabaseServer()
    if (!supabase) return NextResponse.json({ ok: true, skipped: true })

    const { error } = await supabase.from('visits').insert({
      ip_hash: ipHash,
      user_agent: user_agent || null,
      device_type: deviceType,
      country,
      page: page || '/',
      referrer: referrer || null,
      session_id: session_id || null,
    })

    if (error) {
      // Log but don't fail — analytics should never break the app
      console.error('[track] Supabase insert error:', error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] Unexpected error:', err)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

// Disallow GET
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
