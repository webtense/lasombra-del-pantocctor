#!/usr/bin/env node

/**
 * Script de validación: Test de email de solicitud de reseña
 *
 * Ejecutar:
 *   npx ts-node scripts/test-review-email.ts
 *
 * O desde la raiz:
 *   npm run test:review-email (si existe en package.json)
 */

import https from 'https'

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'https://la-sombra-del-pantocrator.vercel.app'

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(msg: string, color: string = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`)
}

function makeRequest(
  url: string,
  options: Record<string, any>,
  body?: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, body: data })
      })
    })

    req.on('error', (err) => {
      reject(err)
    })

    if (body) {
      req.write(body)
    }
    req.end()
  })
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════════════', colors.cyan)
  log('TEST: Email Post-Compra (Solicitud de Reseñas)', colors.cyan)
  log('═══════════════════════════════════════════════════════════════\n', colors.cyan)

  let passed = 0
  let failed = 0

  // Test 1: GET /api/send-review-request (health check)
  log('Test 1: GET /api/send-review-request (health check)...', colors.blue)
  try {
    const res = await makeRequest(`${BASE_URL}/api/send-review-request`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (res.status === 200) {
      const data = JSON.parse(res.body)
      if (data.endpoint === '/api/send-review-request') {
        log('✅ PASS: Endpoint operativo\n', colors.green)
        passed++
      } else {
        log('❌ FAIL: Respuesta inesperada\n', colors.red)
        log(`   ${res.body}\n`, colors.yellow)
        failed++
      }
    } else {
      log(`❌ FAIL: Status ${res.status}\n`, colors.red)
      failed++
    }
  } catch (err) {
    log(`❌ FAIL: ${err instanceof Error ? err.message : 'error desconocido'}\n`, colors.red)
    failed++
  }

  // Test 2: POST /api/send-review-request (email válido)
  log('Test 2: POST /api/send-review-request (email válido)...', colors.blue)
  try {
    const payload = JSON.stringify({
      toEmail: 'test-lsp-review@example.com',
      toName: 'Test User',
      bookTitle: 'La Sombra del Pantocrátor',
      daysOwnedCount: 7,
    })

    const res = await makeRequest(`${BASE_URL}/api/send-review-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload)

    // Nota: Si Brevo_API_KEY no está configurada, devolverá error
    // Si sí está, intentará enviar (puede fallar por IP no autorizada)
    const data = JSON.parse(res.body)

    if (res.status === 200 && data.success) {
      log('✅ PASS: Email enviado correctamente\n', colors.green)
      passed++
    } else if (res.status >= 400) {
      // Es esperado si no hay API key configurada
      if (data.error && data.error.includes('BREVO_API_KEY')) {
        log('⚠️  WARN: BREVO_API_KEY no configurada (esperado en dev)\n', colors.yellow)
        passed++ // No contamos como fail, es esperado
      } else {
        log(`❌ FAIL: ${data.error}\n`, colors.red)
        failed++
      }
    } else {
      log('❌ FAIL: Status inesperado\n', colors.red)
      log(`   ${res.body}\n`, colors.yellow)
      failed++
    }
  } catch (err) {
    log(`❌ FAIL: ${err instanceof Error ? err.message : 'error desconocido'}\n`, colors.red)
    failed++
  }

  // Test 3: POST /api/send-review-request (email inválido)
  log('Test 3: POST /api/send-review-request (email inválido)...', colors.blue)
  try {
    const payload = JSON.stringify({
      toEmail: 'invalid-email',
      toName: 'Test User',
    })

    const res = await makeRequest(`${BASE_URL}/api/send-review-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload)

    const data = JSON.parse(res.body)

    if (res.status === 400 && data.error) {
      log('✅ PASS: Validación correcta (rechaza email inválido)\n', colors.green)
      passed++
    } else {
      log(`❌ FAIL: Debería rechazar email inválido\n`, colors.red)
      log(`   Status: ${res.status}\n`, colors.yellow)
      failed++
    }
  } catch (err) {
    log(`❌ FAIL: ${err instanceof Error ? err.message : 'error desconocido'}\n`, colors.red)
    failed++
  }

  // Test 4: POST /api/send-review-request (missing email)
  log('Test 4: POST /api/send-review-request (missing toEmail)...', colors.blue)
  try {
    const payload = JSON.stringify({
      toName: 'Test User',
      daysOwnedCount: 7,
    })

    const res = await makeRequest(`${BASE_URL}/api/send-review-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, payload)

    const data = JSON.parse(res.body)

    if (res.status === 400 && data.error) {
      log('✅ PASS: Validación correcta (require toEmail)\n', colors.green)
      passed++
    } else {
      log(`❌ FAIL: Debería requerir toEmail\n`, colors.red)
      log(`   Status: ${res.status}\n`, colors.yellow)
      failed++
    }
  } catch (err) {
    log(`❌ FAIL: ${err instanceof Error ? err.message : 'error desconocido'}\n`, colors.red)
    failed++
  }

  // Resumen
  log('═══════════════════════════════════════════════════════════════', colors.cyan)
  log(`Resultados: ${passed} passed, ${failed} failed\n`, colors.cyan)

  if (failed === 0) {
    log('✅ TODOS LOS TESTS PASARON', colors.green)
    process.exit(0)
  } else {
    log(`❌ ${failed} TEST(S) FALLARON`, colors.red)
    process.exit(1)
  }
}

// Ejecutar
runTests().catch((err) => {
  log(`\nError fatal: ${err.message}`, colors.red)
  process.exit(1)
})
