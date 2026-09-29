#!/usr/bin/env npx tsx
/**
 * Sincronización de contactos a Brevo — Script CLI
 * Recopila compradores y testers de Supabase y los sincroniza a Brevo.
 *
 * Uso:
 *   npx tsx scripts/sync-brevo-contacts.ts
 *   npx tsx scripts/sync-brevo-contacts.ts --purchases-only
 *   npx tsx scripts/sync-brevo-contacts.ts --testers-only
 *   npx tsx scripts/sync-brevo-contacts.ts --external /ruta/archivo.csv
 *   npx tsx scripts/sync-brevo-contacts.ts --list-name "Mi Lista"
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// CARGAR .env.local
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=').trim().replace(/^"|"$/g, '')
      if (key && value) {
        process.env[key] = value
      }
    }
  } catch (err) {
    console.error('⚠️  No se pudo cargar .env.local:', err instanceof Error ? err.message : err)
  }
}

loadEnv()

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

type SourceId = 'purchases' | 'testers'

interface SourceStatus {
  id: SourceId
  label: string
  available: boolean
  count: number
  message?: string
}

interface Collected {
  emails: string[]
  status: SourceStatus
  truncated?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Validación y deduplicación de emails
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    const email = (raw || '').trim().toLowerCase()
    if (!email || !isValidEmail(email) || seen.has(email)) continue
    seen.add(email)
    out.push(email)
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOPILACIÓN: Testers desde Supabase
// ─────────────────────────────────────────────────────────────────────────────

async function collectTesters(): Promise<Collected> {
  const base: SourceStatus = { id: 'testers', label: 'Testers', available: false, count: 0 }

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!sbUrl || !sbKey) {
    return {
      emails: [],
      status: {
        ...base,
        message: 'Variables de Supabase no configuradas (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)',
      },
    }
  }

  try {
    const sb = createClient(sbUrl, sbKey)
    const { data, error } = await sb.from('testers').select('email').limit(1000)

    if (error) {
      return { emails: [], status: { ...base, message: `Supabase: ${error.message}` } }
    }

    const emails = dedupeEmails(((data as { email: string }[] | null) || []).map((r) => r.email))
    return { emails, status: { ...base, available: true, count: emails.length } }
  } catch (err) {
    return {
      emails: [],
      status: {
        ...base,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      },
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOPILACIÓN: Compradores desde Supabase RPC
// ─────────────────────────────────────────────────────────────────────────────

async function collectPurchases(): Promise<Collected> {
  const base: SourceStatus = { id: 'purchases', label: 'Compradores', available: false, count: 0 }

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const readKey = process.env.ADMIN_AUDIT_READ_KEY

  if (!sbUrl || !sbKey) {
    return {
      emails: [],
      status: {
        ...base,
        message: 'Variables de Supabase no configuradas (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)',
      },
    }
  }

  if (!readKey) {
    return {
      emails: [],
      status: {
        ...base,
        message:
          'Falta ADMIN_AUDIT_READ_KEY. La tabla purchases es privada: requiere clave de lectura de get_purchases_activity().',
      },
    }
  }

  try {
    const sb = createClient(sbUrl, sbKey)
    const { data, error } = await sb.rpc('get_purchases_activity', {
      p_admin_key: readKey,
      p_limit: 500,
      p_offset: 0,
    })

    if (error) {
      return { emails: [], status: { ...base, message: `Supabase: ${error.message}` } }
    }

    const rows = (data as { email: string; total: number }[] | null) || []
    const emails = dedupeEmails(rows.map((r) => r.email))
    const total = Number(rows[0]?.total ?? 0)

    const message =
      rows.length === 0 ? 'Sin compradores, o ADMIN_AUDIT_READ_KEY no coincide con la clave guardada.' : undefined

    return {
      emails,
      status: { ...base, available: true, count: emails.length, message },
      truncated: total > rows.length,
    }
  } catch (err) {
    return {
      emails: [],
      status: {
        ...base,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`,
      },
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOPILACIÓN: CSV externo
// ─────────────────────────────────────────────────────────────────────────────

async function collectExternal(filePath: string): Promise<Collected> {
  const base: SourceStatus = {
    id: 'purchases' as SourceId,
    label: 'Externos',
    available: false,
    count: 0,
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n').map((l) => l.trim())
    const emails = dedupeEmails(lines)
    return { emails, status: { ...base, available: true, count: emails.length } }
  } catch (err) {
    return {
      emails: [],
      status: {
        ...base,
        message: `No se pudo leer el archivo: ${err instanceof Error ? err.message : String(err)}`,
      },
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BREVO: Crear o reutilizar lista
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateList(
  name: string
): Promise<{ id: number; name: string; created: boolean } | { error: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return { error: 'BREVO_API_KEY no configurada' }
  }

  try {
    // Listar listas existentes
    const listRes = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&offset=0', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    })

    if (listRes.ok) {
      const listData = (await listRes.json()) as any
      const lists = listData?.lists || []
      const match = lists.find((l: any) => l.name.trim().toLowerCase() === name.trim().toLowerCase())
      if (match) {
        return { id: match.id, name: match.name, created: false }
      }
    }

    // Crear lista nueva
    const createRes = await fetch('https://api.brevo.com/v3/contacts/lists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        name: name.trim(),
        folderId: 1, // Carpeta por defecto; idealmente buscaríamos "La Sombra del Pantocrátor"
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      return { error: `Brevo no pudo crear la lista (${createRes.status}): ${err.slice(0, 200)}` }
    }

    const created = (await createRes.json()) as any
    return { id: created.id, name: name.trim(), created: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BREVO: Sincronizar contactos
// ─────────────────────────────────────────────────────────────────────────────

interface SyncResult {
  upserted: number
  failed: number
  errors: string[]
}

async function syncContactsToBrevo(emails: string[], listId: number): Promise<SyncResult | { error: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    return { error: 'BREVO_API_KEY no configurada' }
  }

  if (emails.length === 0) {
    return { error: 'No hay ningún email válido que sincronizar' }
  }

  const unique = dedupeEmails(emails)
  if (!Number.isInteger(listId) || listId <= 0) {
    return { error: 'listId no válido' }
  }

  try {
    if (unique.length >= 20) {
      // Importación en bloque para ≥20 contactos
      console.log(`📦 Usando importación por lotes (${unique.length} contactos)`)
      const response = await fetch('https://api.brevo.com/v3/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          listIds: [listId],
          updateExistingContacts: true,
          emptyContactsAttributes: false,
          jsonBody: unique.map((email) => ({ email })),
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return { error: `Brevo /contacts/import ${response.status}: ${text.slice(0, 300)}` }
      }

      const json = (await response.json()) as any
      return { upserted: unique.length, failed: 0, errors: [], processId: json?.processId }
    } else {
      // Sincronización individual para <20 contactos
      console.log(`📝 Sincronizando ${unique.length} contactos de forma individual...`)
      const result: SyncResult = { upserted: 0, failed: 0, errors: [] }

      for (const email of unique) {
        const response = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            email,
            listIds: [listId],
            updateEnabled: true,
          }),
        })

        if (response.ok || response.status === 409) {
          // 409 = contacto ya existe (es un éxito)
          result.upserted++
        } else {
          result.failed++
          if (result.errors.length < 5) {
            const text = await response.text()
            result.errors.push(`${email}: ${response.status} ${text.slice(0, 120)}`)
          }
        }
      }

      return result
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  // Parsear argumentos
  let purchasesOnly = false
  let testersOnly = false
  let externalFile: string | null = null
  let listName = 'La Sombra del Pantocrátor — Lectores'

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--purchases-only') purchasesOnly = true
    if (args[i] === '--testers-only') testersOnly = true
    if (args[i] === '--external') externalFile = args[++i]
    if (args[i] === '--list-name') listName = args[++i]
  }

  console.log('🔄 Sincronizador de contactos Brevo — La Sombra del Pantocrátor\n')

  // Determinar fuentes a recopilar
  const sources: SourceId[] = []
  if (!testersOnly) sources.push('purchases')
  if (!purchasesOnly) sources.push('testers')

  // Recopilar contactos
  console.log('📚 Recopilando contactos de las fuentes...\n')

  const jobs: Promise<Collected>[] = []
  if (sources.includes('purchases')) jobs.push(collectPurchases())
  if (sources.includes('testers')) jobs.push(collectTesters())

  const results = await Promise.all(jobs)

  // Reportar estado de cada fuente
  for (const result of results) {
    const status = result.status
    if (status.available) {
      const truncMsg = result.truncated ? ' (truncado a 500)' : ''
      console.log(`✅ ${status.label} (${result.emails.length})${truncMsg}`)
    } else {
      console.log(`❌ ${status.label}: ${status.message}`)
    }
  }

  // Agregar externos si se especifica
  let externalEmails: string[] = []
  if (externalFile) {
    const external = await collectExternal(externalFile)
    externalEmails = external.emails
    const status = external.status
    if (status.available) {
      console.log(`✅ Externos (${external.emails.length}) de ${externalFile}`)
    } else {
      console.log(`❌ Externos: ${status.message}`)
    }
  }

  // Combinar todos
  const allEmails = [...results.flatMap((r) => r.emails), ...externalEmails]
  const unique = dedupeEmails(allEmails)

  console.log(`\n🎯 Total de emails únicos a sincronizar: ${unique.length}\n`)

  if (unique.length === 0) {
    console.log('⚠️  No hay contactos para sincronizar.')
    process.exit(0)
  }

  // Obtener o crear lista en Brevo
  console.log(`📋 Buscando/creando lista "${listName}"...`)
  const listResult = await getOrCreateList(listName)

  if ('error' in listResult) {
    console.error(`\n❌ Error: ${listResult.error}`)
    process.exit(1)
  }

  const { id: listId, created } = listResult
  const verb = created ? 'creada' : 'encontrada'
  console.log(`✨ Lista ${verb} (ID: ${listId})\n`)

  // Sincronizar a Brevo
  console.log('📤 Sincronizando a Brevo...')
  const syncResult = await syncContactsToBrevo(unique, listId)

  if ('error' in syncResult) {
    console.error(`\n❌ Error: ${syncResult.error}`)
    process.exit(1)
  }

  console.log(
    `\n✅ ${syncResult.upserted} contactos sincronizados, ${syncResult.failed} fallos\n` +
      `   Detalles: ${JSON.stringify({ upserted: syncResult.upserted, failed: syncResult.failed, errors: syncResult.errors })}\n`
  )

  console.log('✨ Sincronización completada.')
}

main().catch((err) => {
  console.error('\n❌ Error fatal:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
