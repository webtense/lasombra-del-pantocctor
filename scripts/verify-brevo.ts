#!/usr/bin/env npx tsx
/**
 * Verificación de listas en Brevo
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

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

async function main() {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY no configurada')
    process.exit(1)
  }

  console.log('📋 Listas en Brevo:\n')

  try {
    const listRes = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&offset=0', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    })

    if (!listRes.ok) {
      console.error(`❌ Error: ${listRes.status} ${listRes.statusText}`)
      process.exit(1)
    }

    const data = (await listRes.json()) as any
    const lists = data?.lists || []

    let totalContacts = 0
    for (const list of lists) {
      console.log(`📌 "${list.name}" (ID: ${list.id})`)
      console.log(`   Contactos únicos: ${list.uniqueSubscribers}`)
      console.log(`   Total: ${list.totalSubscribers}`)
      console.log(`   Carpeta ID: ${list.folderId}\n`)
      totalContacts += list.uniqueSubscribers
    }

    console.log(`📊 Total de contactos en Brevo: ${totalContacts}`)

    // Obtener plan
    const accountRes = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
    })

    if (accountRes.ok) {
      const account = (await accountRes.json()) as any
      const plan = Array.isArray(account?.plan) ? account.plan[0] : null
      console.log(`\n💰 Estado de la cuenta Brevo:`)
      console.log(`   Plan: ${plan?.type ?? 'desconocido'}`)
      console.log(`   Créditos: ${plan?.credits ?? 'N/A'}/${plan?.sendLimit ?? 'N/A'}`)
    }
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
