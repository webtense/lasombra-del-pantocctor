// Brevo — API de MARKETING (listas de contactos y campañas de email).
//
// Distinto de lib/brevo.ts, que usa el endpoint TRANSACCIONAL
// (/v3/smtp/email) para los correos uno a uno de compra y de reset. Aquí se
// habla con /v3/contacts/* y /v3/emailCampaigns, que son otra cosa:
//
//   · El transaccional acepta como remitente no-responder@lasombradelpantocrator.com
//     aunque el dominio no esté verificado en la cuenta.
//   · Las CAMPAÑAS exigen un remitente verificado. El único verificado en esta
//     cuenta es webtense@gmail.com, así que es el que se usa como email de
//     envío; el nombre a mostrar sí puede ser el de la marca (Brevo permite
//     name+email distintos y acepta la campaña).
//
// Plan de la cuenta: FREE — 300 envíos al día, contactos ilimitados. Ese
// límite no lo aplica esta librería (Brevo rechaza el envío por su cuenta):
// se expone hacia arriba para que la UI avise ANTES de disparar el envío.

export const BREVO_DAILY_SEND_LIMIT = 300

// Remitente de las campañas. El email DEBE estar verificado en Brevo; el
// nombre es libre. Se puede sobreescribir por entorno el día que se verifique
// el dominio de la marca, sin tocar código.
const CAMPAIGN_SENDER = {
  name: process.env.BREVO_CAMPAIGN_SENDER_NAME || 'La Sombra del Pantocrátor',
  email: process.env.BREVO_CAMPAIGN_SENDER_EMAIL || 'webtense@gmail.com',
}

// Carpeta propia para no mezclar las listas del libro con las que ya existían
// en la cuenta (que es compartida con otros usos: "Your first folder",
// "Contactos de conversaciones"). Si la creación de carpeta fallara, se cae a
// FALLBACK_FOLDER_ID en vez de dejar la sincronización sin hacer.
const FOLDER_NAME = 'La Sombra del Pantocrátor'
const FALLBACK_FOLDER_ID = 1

const API = 'https://api.brevo.com/v3'

export type BrevoResult<T> = { ok: true; data: T } | { ok: false; error: string }

function apiKey(): string | null {
  return process.env.BREVO_API_KEY || null
}

// Todas las llamadas pasan por aquí para no repetir el `cache: 'no-store'`.
// Sin él Next.js cachea también las POST salientes (misma URL + mismo body =
// misma respuesta guardada), y un reintento de sincronización o de envío
// devolvería el resultado anterior sin llegar a Brevo. Es el mismo fallo que
// ya se documentó en lib/supabase.ts y en lib/brevo.ts.
async function brevoFetch(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ status: number; json: any; text: string }> {
  const key = apiKey()
  if (!key) throw new Error('BREVO_API_KEY no configurada')

  const res = await fetch(`${API}${path}`, {
    method: init.method || 'GET',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'api-key': key,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  const text = await res.text().catch(() => '')
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // Brevo devuelve 204 sin cuerpo en varias operaciones de contactos.
  }
  return { status: res.status, json, text }
}

export function isBrevoConfigured(): boolean {
  return Boolean(apiKey())
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan de la cuenta — para que la UI pueda enseñar el límite real y no un
// número escrito a mano que se quede obsoleto si algún día se sube de plan.
// ─────────────────────────────────────────────────────────────────────────────
export async function getAccountPlan(): Promise<
  BrevoResult<{ type: string; credits: number | null; creditsType: string | null }>
> {
  try {
    const { status, json, text } = await brevoFetch('/account')
    if (status !== 200) return { ok: false, error: `Brevo /account ${status}: ${text.slice(0, 200)}` }
    const plan = Array.isArray(json?.plan) ? json.plan[0] : null
    return {
      ok: true,
      data: {
        type: plan?.type ?? 'desconocido',
        credits: typeof plan?.credits === 'number' ? plan.credits : null,
        creditsType: plan?.creditsType ?? null,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Listas
// ─────────────────────────────────────────────────────────────────────────────
export type BrevoList = {
  id: number
  name: string
  folderId: number
  totalSubscribers: number
  uniqueSubscribers: number
}

export async function listLists(): Promise<BrevoResult<BrevoList[]>> {
  try {
    const { status, json, text } = await brevoFetch('/contacts/lists?limit=50&offset=0')
    if (status !== 200) return { ok: false, error: `Brevo /contacts/lists ${status}: ${text.slice(0, 200)}` }
    const lists: BrevoList[] = (json?.lists || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      folderId: l.folderId,
      totalSubscribers: l.totalSubscribers ?? 0,
      uniqueSubscribers: l.uniqueSubscribers ?? 0,
    }))
    return { ok: true, data: lists }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// Carpeta del proyecto: se busca por nombre y, si no existe, se crea. Si la
// creación falla (permisos del plan, endpoint no disponible), se devuelve la
// carpeta 1, que existe en toda cuenta de Brevo.
async function getOrCreateFolderId(): Promise<number> {
  try {
    const { status, json } = await brevoFetch('/contacts/folders?limit=50&offset=0')
    if (status === 200) {
      const found = (json?.folders || []).find(
        (f: any) => (f?.name || '').trim().toLowerCase() === FOLDER_NAME.toLowerCase()
      )
      if (found?.id) return Number(found.id)
    }

    const created = await brevoFetch('/contacts/folders', { method: 'POST', body: { name: FOLDER_NAME } })
    if (created.status >= 200 && created.status < 300 && created.json?.id) {
      return Number(created.json.id)
    }
    console.error('[brevo-marketing] no se pudo crear la carpeta, uso la', FALLBACK_FOLDER_ID, created.text.slice(0, 200))
  } catch (err) {
    console.error('[brevo-marketing] excepción resolviendo carpeta', err instanceof Error ? err.message : err)
  }
  return FALLBACK_FOLDER_ID
}

// Busca una lista por nombre (comparación exacta sin mayúsculas/minúsculas ni
// espacios sobrantes) y la crea si no existe.
export async function getOrCreateList(
  name: string
): Promise<BrevoResult<{ id: number; name: string; created: boolean; folderId: number }>> {
  const wanted = (name || '').trim()
  if (!wanted) return { ok: false, error: 'El nombre de la lista no puede estar vacío' }

  try {
    const existing = await listLists()
    if (!existing.ok) return existing
    const match = existing.data.find((l) => l.name.trim().toLowerCase() === wanted.toLowerCase())
    if (match) {
      return { ok: true, data: { id: match.id, name: match.name, created: false, folderId: match.folderId } }
    }

    const folderId = await getOrCreateFolderId()
    const { status, json, text } = await brevoFetch('/contacts/lists', {
      method: 'POST',
      body: { name: wanted, folderId },
    })
    if (status < 200 || status >= 300 || !json?.id) {
      return { ok: false, error: `Brevo no pudo crear la lista (${status}): ${text.slice(0, 200)}` }
    }
    return { ok: true, data: { id: Number(json.id), name: wanted, created: true, folderId } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Contactos
// ─────────────────────────────────────────────────────────────────────────────

// Validación deliberadamente laxa (algo@algo.tld): el objetivo es descartar
// basura evidente antes de gastar llamadas a la API, no reimplementar RFC 5322.
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

// Normaliza (trim + minúsculas) y quita duplicados conservando el orden.
export function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    const email = (raw || '').trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

// A partir de este número de contactos compensa la importación en bloque:
// una sola llamada en vez de N. Por debajo se hace contacto a contacto, que
// es SÍNCRONO y por tanto permite contar altas y errores de verdad (el import
// de Brevo es asíncrono: devuelve un processId y procesa después).
const IMPORT_THRESHOLD = 20

export type SyncResult = {
  mode: 'individual' | 'import'
  requested: number
  // `upserted`, no `created`: se manda updateEnabled:true, así que Brevo
  // responde 204 tanto si el contacto es nuevo como si ya existía y lo ha
  // actualizado. Desde aquí NO se puede distinguir un caso del otro, y
  // llamarlo "creados" haría creer que se han captado contactos nuevos en
  // cada sincronización (comprobado: reejecutar la misma lista devolvía
  // "3 altas" las dos veces).
  upserted: number
  alreadyExisted: number
  failed: number
  processId?: number
  errors: string[]
}

export async function syncContactsToBrevo(
  emails: string[],
  listId: number,
  attributes: Record<string, string> = {}
): Promise<BrevoResult<SyncResult>> {
  const unique = dedupeEmails(emails)
  if (unique.length === 0) return { ok: false, error: 'No hay ningún email válido que sincronizar' }
  if (!Number.isInteger(listId) || listId <= 0) return { ok: false, error: 'listId no válido' }

  try {
    if (unique.length >= IMPORT_THRESHOLD) {
      const { status, json, text } = await brevoFetch('/contacts/import', {
        method: 'POST',
        body: {
          listIds: [listId],
          updateExistingContacts: true,
          emptyContactsAttributes: false,
          jsonBody: unique.map((email) => ({ email, attributes })),
        },
      })
      if (status < 200 || status >= 300) {
        return { ok: false, error: `Brevo /contacts/import ${status}: ${text.slice(0, 300)}` }
      }
      // 202 + processId: Brevo lo procesa en segundo plano, así que aquí no
      // se puede decir cuántos eran nuevos. Se informa del modo para que la
      // UI no presente un recuento que no ha comprobado nadie.
      return {
        ok: true,
        data: {
          mode: 'import',
          requested: unique.length,
          upserted: 0,
          alreadyExisted: 0,
          failed: 0,
          processId: json?.processId ?? undefined,
          errors: [],
        },
      }
    }

    const result: SyncResult = {
      mode: 'individual',
      requested: unique.length,
      upserted: 0,
      alreadyExisted: 0,
      failed: 0,
      errors: [],
    }

    for (const email of unique) {
      const { status, json, text } = await brevoFetch('/contacts', {
        method: 'POST',
        body: { email, attributes, listIds: [listId], updateEnabled: true },
      })

      if (status >= 200 && status < 300) {
        result.upserted++
        continue
      }

      // Red de seguridad, mismo criterio que lib/subscribe-newsletter.ts: un
      // 400 duplicate_parameter significa que el contacto YA existe. Con
      // updateEnabled:true no debería llegar aquí (Brevo responde 204), pero
      // si llegara sigue siendo un éxito, no un error.
      if (status === 400 && json?.code === 'duplicate_parameter') {
        result.alreadyExisted++
        continue
      }

      result.failed++
      if (result.errors.length < 5) result.errors.push(`${email}: ${status} ${text.slice(0, 120)}`)
    }

    return { ok: true, data: result }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// Nº real de contactos de una lista, leído de Brevo (no del recuento que
// hubiera calculado la app). Es la cifra sobre la que se avisa del tope de 300.
export async function getListRecipientCount(listId: number): Promise<number | null> {
  try {
    const { status, json } = await brevoFetch(`/contacts/lists/${listId}`)
    if (status !== 200) return null
    const n = json?.uniqueSubscribers ?? json?.totalSubscribers
    return typeof n === 'number' ? n : null
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Campañas
// ─────────────────────────────────────────────────────────────────────────────

export async function createCampaign({
  name,
  subject,
  htmlContent,
  listIds,
}: {
  name: string
  subject: string
  htmlContent: string
  listIds: number[]
}): Promise<BrevoResult<{ campaignId: number }>> {
  if (!name.trim()) return { ok: false, error: 'La campaña necesita un nombre' }
  if (!subject.trim()) return { ok: false, error: 'La campaña necesita un asunto' }
  if (!htmlContent.trim()) return { ok: false, error: 'La campaña necesita un cuerpo' }
  if (!listIds.length) return { ok: false, error: 'La campaña necesita al menos una lista de destinatarios' }

  try {
    const { status, json, text } = await brevoFetch('/emailCampaigns', {
      method: 'POST',
      body: {
        name: name.trim(),
        subject: subject.trim(),
        sender: CAMPAIGN_SENDER,
        type: 'classic',
        htmlContent,
        recipients: { listIds },
      },
    })
    if (status < 200 || status >= 300 || !json?.id) {
      return { ok: false, error: `Brevo no pudo crear la campaña (${status}): ${text.slice(0, 300)}` }
    }
    return { ok: true, data: { campaignId: Number(json.id) } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// IRREVERSIBLE: a partir de aquí los correos salen. Quien llame a esto debe
// haber confirmado con el usuario.
export async function sendCampaignNow(campaignId: number): Promise<BrevoResult<{ sent: true }>> {
  if (!Number.isInteger(campaignId) || campaignId <= 0) {
    return { ok: false, error: 'campaignId no válido' }
  }
  try {
    const { status, text } = await brevoFetch(`/emailCampaigns/${campaignId}/sendNow`, { method: 'POST' })
    if (status < 200 || status >= 300) {
      return { ok: false, error: `Brevo no pudo enviar la campaña (${status}): ${text.slice(0, 300)}` }
    }
    return { ok: true, data: { sent: true } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

export async function deleteCampaign(campaignId: number): Promise<BrevoResult<{ deleted: true }>> {
  try {
    const { status, text } = await brevoFetch(`/emailCampaigns/${campaignId}`, { method: 'DELETE' })
    if (status < 200 || status >= 300) {
      return { ok: false, error: `Brevo no pudo borrar la campaña (${status}): ${text.slice(0, 200)}` }
    }
    return { ok: true, data: { deleted: true } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'error desconocido' }
  }
}

// Texto plano → HTML. Un párrafo por bloque separado por línea en blanco, y
// los saltos sueltos dentro de un párrafo se conservan como <br/>. No hay
// editor WYSIWYG a propósito: el cuerpo lo escribe el admin en un textarea.
export function plainTextToHtml(text: string, subject?: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px; line-height:1.6;">${esc(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n      ')

  return `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="color:#8B6914; font-size:20px;">${esc(subject || 'La Sombra del Pantocrátor')}</h2>
      ${paragraphs}
      <p style="font-size:12px; color:#888; margin-top:32px; border-top:1px solid #eee; padding-top:12px;">
        La Sombra del Pantocrátor · Recibes este correo porque te diste de alta o compraste el libro.
        Puedes darte de baja con el enlace de abajo.
      </p>
    </div>
  `.trim()
}
