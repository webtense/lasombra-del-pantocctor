// Rate limit en memoria, por instancia de función serverless.
//
// Limitación conocida y asumida: Vercel puede levantar varias instancias en
// paralelo, así que el límite real es "N por instancia", no global. Es
// suficiente para lo que protege (evitar que alguien machaque
// /api/auth/reset-password y bombardee de correos a un comprador o queme la
// cuota de Brevo); para un límite estricto haría falta almacenarlo en
// Supabase o en un KV, lo que no compensa con el volumen actual.

type Hit = { count: number; resetAt: number }

const buckets = new Map<string, Hit>()

// Poda perezosa: sin esto el Map crecería indefinidamente en una instancia
// caliente.
function prune(now: number) {
  if (buckets.size < 500) return
  buckets.forEach((v, k) => {
    if (v.resetAt <= now) buckets.delete(k)
  })
}

/**
 * Devuelve `true` si la petición pasa el límite, `false` si hay que
 * rechazarla con 429.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  prune(now)

  const hit = buckets.get(key)
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (hit.count >= max) return false

  hit.count += 1
  return true
}
