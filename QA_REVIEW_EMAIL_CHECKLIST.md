# QA Checklist: Email Post-Compra (Solicitud de Reseñas)

**Fecha:** 14/09/2026
**Estado Inicial:** ✅ Implementación completada

---

## Verificación de Código

### Función `sendReviewRequestEmail()`

**Archivo:** `lib/brevo.ts`

- [ ] Función existe y es exportada
- [ ] Parámetros están tipados correctamente
- [ ] HTML email contiene:
  - [ ] Título del libro
  - [ ] Saludo personalizado
  - [ ] Mensaje de bienvenida (N días desde compra)
  - [ ] CTA principal (Amazon con botón destacado)
  - [ ] CTAs secundarias (Goodreads, Google Books)
  - [ ] Firma del autor (Andrés Sánchez Serrano)
  - [ ] Footer disclaimer
- [ ] Validación: rechaza email vacío o inválido
- [ ] Error handling completo (try/catch)
- [ ] Logging: 
  - [ ] ✅ Log en caso de éxito
  - [ ] ⚠️ Warning en caso de error
  - [ ] ❌ Error crítico si API key no existe

**Test:**
```bash
grep -n "sendReviewRequestEmail" lib/brevo.ts | wc -l
# Debe mostrar mínimo 2 (export + implementación)
```

### Endpoint POST `/api/send-review-request`

**Archivo:** `app/api/send-review-request/route.ts`

- [ ] Archivo existe
- [ ] Función `POST` existe
- [ ] Validación `toEmail`:
  - [ ] Requerido
  - [ ] Debe contener `@`
  - [ ] Rechaza undefined/null
- [ ] Llama a `sendReviewRequestEmail()`
- [ ] Respuesta 200 en caso de éxito
- [ ] Respuesta 400/500 con mensaje de error
- [ ] Logging de intentos fallidos
- [ ] Parámetros opcionales funcionales:
  - [ ] `toName`
  - [ ] `bookTitle`
  - [ ] `amazonUrl`
  - [ ] `goodreadsUrl`
  - [ ] `googleBooksUrl`
  - [ ] `daysOwnedCount`

**Test:**
```bash
grep "export async function POST" app/api/send-review-request/route.ts
# Debe encontrar la función
```

### Endpoint GET `/api/send-review-request`

**Archivo:** `app/api/send-review-request/route.ts`

- [ ] Función `GET` existe
- [ ] Devuelve JSON con documentación
- [ ] Incluye `endpoint`, `method`, `description`
- [ ] Incluye `config` con:
  - [ ] `hasBrevoKey` (boolean)
  - [ ] `daysDefault` (number)
  - [ ] `emailsPerDay` (string)
- [ ] Incluye `usage` con documentación de parámetros

---

## Pruebas Funcionales

### Test 1: Health Check

```bash
curl -s https://la-sombra-del-pantocrator.vercel.app/api/send-review-request | jq .
```

**Resultado esperado:**
```json
{
  "endpoint": "/api/send-review-request",
  "method": "POST",
  "config": {
    "hasBrevoKey": true
  }
}
```

**Validación:**
- [ ] Status 200
- [ ] JSON válido
- [ ] `hasBrevoKey` es `true`

### Test 2: POST con Email Válido

```bash
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "toName": "Test",
    "daysOwnedCount": 7
  }'
```

**Resultado esperado (con BREVO_API_KEY):**
```json
{
  "success": true,
  "message": "Email de solicitud de reseña enviado correctamente",
  "email": "test@example.com"
}
```

**Resultado esperado (sin BREVO_API_KEY):**
```json
{
  "error": "BREVO_API_KEY no configurada"
}
```

**Validación:**
- [ ] Status 200 (con API key) O 500 (sin API key)
- [ ] Mensaje claro en respuesta
- [ ] Email field en respuesta

### Test 3: POST con Email Inválido

```bash
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "invalid-email",
    "toName": "Test"
  }'
```

**Resultado esperado:**
```json
{
  "error": "toEmail inválido"
}
```

**Validación:**
- [ ] Status 400
- [ ] Mensaje de error claro

### Test 4: POST sin Email

```bash
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toName": "Test"
  }'
```

**Resultado esperado:**
```json
{
  "error": "toEmail inválido"
}
```

**Validación:**
- [ ] Status 400
- [ ] Rechaza request sin email

### Test 5: Suite Automática

```bash
cd /path/to/LaSombraDelPantocrator/02-WEB
npx ts-node scripts/test-review-email.ts
```

**Resultado esperado:**
```
═══════════════════════════════════════════════════════════════
TEST: Email Post-Compra (Solicitud de Reseñas)
═══════════════════════════════════════════════════════════════

✅ PASS: Endpoint operativo
✅ PASS: Email enviado correctamente
✅ PASS: Validación correcta (rechaza email inválido)
✅ PASS: Validación correcta (require toEmail)

Resultados: 4 passed, 0 failed

✅ TODOS LOS TESTS PASARON
```

**Validación:**
- [ ] Todos los tests pasan
- [ ] Exit code 0

---

## Verificación de Email (SMTP)

### Visual (si se envió realmente)

Si Brevo API key está configurada y funcionando:

1. [ ] Recibir email de prueba en `asanchez@viajesparati.com`
2. [ ] Verificar asunto: `¿Qué te pareció La Sombra del Pantocrátor? 📖`
3. [ ] Verificar remitente: `Andrés Sánchez Serrano` o similar
4. [ ] Verificar contenido HTML:
   - [ ] Título visible
   - [ ] Saludo personalizado
   - [ ] Botón amarillo Amazon (CTA principal)
   - [ ] Links secundarios (Goodreads, Google Books)
   - [ ] Firma del autor
   - [ ] Footer con disclaimer
5. [ ] Verificar responsive en mobile (si es posible)

### Email Headers

Verificar que el email contiene:

```
From: "Andrés Sánchez Serrano" <no-responder@lasombradelpantocrator.com>
Subject: ¿Qué te pareció La Sombra del Pantocrátor? 📖
Content-Type: text/html; charset=utf-8
X-Brevo-MessageId: [algún ID]
```

- [ ] From correcto
- [ ] Subject correcto
- [ ] Content-Type HTML
- [ ] Headers Brevo presentes

---

## Integración con Sistema Existente

### Webhook Post-Compra

**Archivo:** `app/api/webhook/route.ts`

- [ ] No fue modificado
- [ ] Sigue enviando email de descarga (post-compra inicial)
- [ ] Datos de compra se registran en Supabase

**Test:**
```bash
# Verificar que webhook sigue procesando pagos
grep -n "sendPurchaseEmail" app/api/webhook/route.ts
# Debe encontrar el import y la llamada
```

### Listas Brevo

- [ ] Lista "La Sombra del Pantocrátor" existe en Brevo
- [ ] Contactos se sincronizan al comprar (vía `lib/brevo-marketing.ts`)
- [ ] Email de prueba está en la lista (si se envió)

**Verificación manual en Brevo:**
1. Login a https://app.brevo.com
2. Contacts → Lists
3. Buscar "La Sombra del Pantocrátor"
4. [ ] Lista existe
5. [ ] Tiene al menos 1 subscriber (el del test)

### BD Supabase

Si se implementó automáticamente:

- [ ] Tabla `purchases` existe
- [ ] Tiene columna `review_email_sent` (boolean, nullable)
- [ ] Compras tienen fecha de creación (`created_at`)

**Query test (Supabase Console):**
```sql
SELECT id, email, created_at, review_email_sent FROM purchases
ORDER BY created_at DESC
LIMIT 5;
```

- [ ] Devuelve registros
- [ ] `review_email_sent` null o false para nuevos

---

## Documentación

### Archivos Creados

- [ ] `BREVO_EMAIL_POST_COMPRA_RESENAS.md` (completo)
- [ ] `REVIEW_EMAIL_SETUP.md` (setup rápido)
- [ ] `QA_REVIEW_EMAIL_CHECKLIST.md` (este archivo)
- [ ] `n8n-workflow-review-emails.json` (template workflow)

### Documentación de Código

- [ ] `sendReviewRequestEmail()` tiene JSDoc
- [ ] Endpoint tiene comentarios explicando qué hace
- [ ] Variables de entorno documentadas

**Test:**
```bash
head -30 lib/brevo.ts | grep -i "email de"
head -30 app/api/send-review-request/route.ts | grep -i "endpoint"
```

---

## Configuración de Entorno

### `.env.local`

- [ ] `BREVO_API_KEY` presente
- [ ] `NEXT_PUBLIC_URL` apunta a URL correcta
- [ ] No hay `.env.local` en git (está en `.gitignore`)

**Test:**
```bash
grep BREVO_API_KEY .env.local | cut -c1-20
# Debe mostrar algo como: BREVO_API_KEY=xkeysib...
```

### `.env.production` (si aplica)

- [ ] Variables necesarias están documentadas
- [ ] Secrets no están en claro

---

## Seguridad

- [ ] Endpoint no requiere autenticación especial (POST público)
- [ ] Validación de email previene inyección de código
- [ ] HTML escapeado (función `escapeHtml()` en uso)
- [ ] API key no se expone en respuestas
- [ ] Logs no contienen contraseñas o datos sensibles
- [ ] Rate limiting no configurado (N8n puede implementarlo)

**Test:**
```bash
# Verificar que escapeHtml está siendo usado
grep -n "escapeHtml" lib/brevo.ts | wc -l
# Debe mostrar >0
```

---

## Performance

- [ ] API call a Brevo: <2 segundos típicamente
- [ ] Endpoint responde en <500ms (sin Brevo)
- [ ] HTML email <50KB
- [ ] No hay queries innecesarias a BD

---

## Logs y Monitoreo

### Logs Esperados (exitoso)

```
✅ Email de solicitud de reseña enviado a test@example.com
```

### Logs Esperados (error)

```
[brevo] error enviando solicitud de reseña 401 Unauthorized
[brevo] excepción enviando solicitud de reseña: Socket timeout
[brevo] BREVO_API_KEY no configurada — no se puede enviar...
```

- [ ] Logs capturados en `console.log/error` (visible en Vercel)
- [ ] Errores descriptivos

---

## Rollback / Reversión

Si es necesario deshacer todo:

1. [ ] Revertir commit con los cambios
2. [ ] Eliminar:
   - `lib/brevo.ts` → función `sendReviewRequestEmail()` (solo esa)
   - `app/api/send-review-request/route.ts` (archivo completo)
   - `scripts/test-review-email.ts` (archivo completo)
   - Documentos MD creados

3. [ ] Webhook post-compra sigue funcionando (no afectado)

---

## Checklist Final

### Phase 1: Implementación ✅

- [x] Código escrito
- [x] Tests creados
- [x] Documentación completada
- [x] Archivos en git
- [x] Sin errores TypeScript

### Phase 2: Testing (Esta sesión)

- [ ] Health check OK
- [ ] POST test OK
- [ ] Validación OK
- [ ] Suite tests OK
- [ ] Email recibido (si API key activa)

### Phase 3: Automatización (Próximo)

- [ ] N8n workflow configurado O
- [ ] Cron VPS configurado
- [ ] Trigger automático funciona
- [ ] Logs de automatización

### Phase 4: Monitoreo (Futuro)

- [ ] Dashboard admin muestra envíos
- [ ] Alertas si fallan envíos (>10%)
- [ ] Reporte semanal de reseñas

---

## Notas Importantes

1. **API Key:** Sin `BREVO_API_KEY`, el endpoint devuelve error 500 (esperado)
2. **Rate Limiting:** Brevo free permite 300 emails/día
3. **URLs:** Actualizar Amazon/Goodreads/Google Books URLs cuando esté registrado
4. **Automático:** Esta sesión solo implementa el endpoint; automatización es siguiente

---

## Firma

- **Implementado por:** Claude Haiku 4.5
- **Fecha:** 14/09/2026
- **Versión:** 1.0
- **Estado:** ✅ Listo para testing

**Próxima etapa:** Automatización (N8n o cron) — ver `BREVO_EMAIL_POST_COMPRA_RESENAS.md` sección "Automatización Propuesta"
