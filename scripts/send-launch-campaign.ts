#!/usr/bin/env npx tsx
/**
 * Send Launch Campaign to Brevo
 * "La Sombra del Pantocrátor" — Lanzamiento 14/09/2026
 *
 * Uso:
 *   npx tsx scripts/send-launch-campaign.ts
 *
 * Esto va a:
 * 1. Cargar .env.local (credenciales Brevo)
 * 2. Leer el HTML de la campaña
 * 3. Crear la campaña en Brevo
 * 4. Enviarla a la lista "La Sombra del Pantocrátor — Lectores"
 * 5. Reportar resultado
 */

import * as fs from 'fs'
import * as path from 'path'

// ────────────────────────────────────────────────────────────────
// 1. CARGAR .env.local
// ────────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local no encontrado')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const [key, ...rest] = trimmed.split('=')
    if (key && rest.length > 0) {
      let value = rest.join('=').trim()
      // Quitar comillas
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  }

  return env
}

const env = loadEnv()

const BREVO_API_KEY = env.BREVO_API_KEY
if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY no configurada en .env.local')
  process.exit(1)
}

// ────────────────────────────────────────────────────────────────
// 2. LEER HTML DE LA CAMPAÑA
// ────────────────────────────────────────────────────────────────

const campaignHtmlPath = path.join(
  process.cwd(),
  'MARKETING_SPRINT_2026/brevo/campana_lanzamiento_brevo.html'
)

if (!fs.existsSync(campaignHtmlPath)) {
  console.error(`❌ Campaña HTML no encontrada: ${campaignHtmlPath}`)
  process.exit(1)
}

const htmlContent = fs.readFileSync(campaignHtmlPath, 'utf-8')

// ────────────────────────────────────────────────────────────────
// 3. FUNCIONES BREVO API
// ────────────────────────────────────────────────────────────────

async function getListId(name: string): Promise<number | null> {
  const response = await fetch('https://api.brevo.com/v3/contacts/lists', {
    headers: {
      'api-key': BREVO_API_KEY,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ Error obteniendo listas: ${error}`)
    return null
  }

  const data = await response.json() as any
  const list = data.lists?.find((l: any) => l.name === name)
  return list?.id || null
}

async function createCampaign(
  name: string,
  subject: string,
  htmlContent: string,
  listId: number
): Promise<{ id: number } | null> {
  const payload = {
    name,
    subject,
    htmlContent,
    sender: {
      name: 'La Sombra del Pantocrátor',
      email: 'webtense@gmail.com',
    },
    type: 'classic',
    recipients: {
      listIds: [listId],
    },
    replyTo: 'asanchez@viajesparati.com',
  }

  const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ Error creando campaña: ${error}`)
    return null
  }

  const data = await response.json() as any
  return { id: data.id }
}

async function sendCampaign(campaignId: number): Promise<boolean> {
  const response = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}/sendNow`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ Error enviando campaña: ${error}`)
    return false
  }

  return true
}

// ────────────────────────────────────────────────────────────────
// 4. MAIN
// ────────────────────────────────────────────────────────────────

async function main() {
  console.log('📧 Enviador de Campaña de Lanzamiento — La Sombra del Pantocrátor')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('')

  // 1. Obtener ID de lista
  console.log('🔍 Buscando lista "La Sombra del Pantocrátor — Lectores"...')
  const listId = await getListId('La Sombra del Pantocrátor — Lectores')

  if (!listId) {
    console.error('❌ No se encontró la lista de destinatarios')
    process.exit(1)
  }

  console.log(`✅ Lista encontrada (ID: ${listId})`)
  console.log('')

  // 2. Crear campaña
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 16).replace('T', ' ')
  const campaignName = `Lanzamiento Pantocrátor · ${timestamp}`
  const subject = 'La Sombra del Pantocrátor ya está aquí'

  console.log('📝 Creando campaña...')
  const campaign = await createCampaign(campaignName, subject, htmlContent, listId)

  if (!campaign) {
    console.error('❌ Error creando la campaña')
    process.exit(1)
  }

  console.log(`✅ Campaña creada (ID: ${campaign.id})`)
  console.log('')

  // 3. Enviar campaña (con confirmación)
  console.log('⚠️  Confirmación de envío:')
  console.log(`    - Campaña: "${subject}"`)
  console.log(`    - Lista: "La Sombra del Pantocrátor — Lectores" (ID: ${listId})`)
  console.log(`    - Hora: ${now.toLocaleString('es-ES')}`)
  console.log('')
  console.log('💬 Continuar con el envío...')

  const sent = await sendCampaign(campaign.id)

  if (!sent) {
    console.error('❌ Error enviando la campaña')
    process.exit(1)
  }

  console.log('')
  console.log('✨ ¡Campaña enviada exitosamente!')
  console.log(`📊 ID de campaña: ${campaign.id}`)
  console.log(`📋 Lista: La Sombra del Pantocrátor — Lectores (${listId})`)
  console.log(`📅 Hora: ${now.toLocaleString('es-ES')}`)
  console.log('')
  console.log('🎯 Próximos pasos:')
  console.log('   1. Verificar en Brevo: https://app.brevo.com/campaign')
  console.log('   2. Monitorear aperturas y clics')
  console.log('   3. Recopilar métricas en 24h')
  console.log('')
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
