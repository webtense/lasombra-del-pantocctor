import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// FIX CRÍTICO — Data Cache de Next.js sobre las llamadas de supabase-js
//
// Next.js 14 parchea globalThis.fetch en el servidor y guarda la respuesta en
// su Data Cache. La clave de caché incluye método, URL, cabeceras y CUERPO, así
// que las POST que supabase-js hace a /rest/v1/rpc/<fn> también se cachean.
//
// Consecuencia real observada en producción: register_purchase_download recibía
// siempre el mismo body para un mismo comprador (solo varía por p_ip_hash y
// p_user_agent), Next devolvía la respuesta cacheada, la RPC no llegaba a
// ejecutarse, no se insertaba fila en purchase_downloads y el límite de 5
// descargas por formato NUNCA se alcanzaba (7 descargas seguidas → 7×200 y el
// contador clavado en 1). Los KPIs de descargas quedaban además infravalorados.
//
// `export const dynamic = 'force-dynamic'` NO protege de esto: afecta al
// renderizado de la ruta, no al fetch que se hace dentro.
//
// Solución: inyectar en el cliente de Supabase un fetch que fuerce
// `cache: 'no-store'`. Así queda cubierta TODA llamada que haga supabase-js
// (register_purchase_download, get_user_login, try_mark_purchase_email_sent,
// inserts en events/visits…), no solo la que se detectó rota.
// ─────────────────────────────────────────────────────────────────────────────
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' })

const CLIENT_OPTIONS = {
  global: { fetch: noStoreFetch },
  auth: { persistSession: false },
} as const

let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    _supabase = createClient(url, key, CLIENT_OPTIONS)
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
//
// Usar SIEMPRE esta función en el servidor en vez de createClient() a pelo:
// es la única que garantiza el fetch sin caché (ver comentario de arriba).
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, CLIENT_OPTIONS)
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
