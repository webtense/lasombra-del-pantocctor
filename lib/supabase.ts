import { createClient } from '@supabase/supabase-js'

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : null

// Cliente para usar en API routes (servidor). Misma anon key: la app no
// tiene service role key configurada, así que las operaciones sensibles
// (tokens de tester) pasan por funciones SQL SECURITY DEFINER (ver
// supabase-schema-testers.sql) en vez de depender de RLS por policy.
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export type Visit = {
  id: number
  created_at: string
  ip_hash: string | null
  user_agent: string | null
  device_type: string | null
  country: string | null
  page: string | null
  referrer: string | null
  session_id: string | null
}

export type AppEvent = {
  id: number
  created_at: string
  session_id: string | null
  ip_hash: string | null
  event_type: string
  event_data: Record<string, unknown> | null
  device_type: string | null
  country: string | null
  referrer: string | null
}

export type Lead = {
  id: number
  created_at: string
  email: string
  source: string | null
  session_id: string | null
}

export type Tester = {
  id: number
  created_at: string
  email: string
  name: string | null
  notes: string | null
}

export type TesterDownload = {
  id: number
  created_at: string
  tester_id: number
  file_type: string
  ip_hash: string | null
  user_agent: string | null
  testers?: { name: string | null; email: string } | null
}

export type Review = {
  id: number
  created_at: string
  tester_id: number | null
  name: string
  email: string | null
  rating: number
  opinion: string | null
  testers?: { name: string | null; email: string } | null
}

export type MarketingCampaign = {
  id: number
  created_at: string
  fecha: string
  plataforma: string
  presupuesto: number
  estado: 'planificada' | 'en_curso' | 'pausada' | 'finalizada'
  notas: string | null
}

export type InstagramManualPost = {
  id: number
  created_at: string
  url: string
  fecha: string
  caption: string | null
  likes_esperados: number | null
  comments_esperados: number | null
  saves_esperados: number | null
  notas: string | null
}
