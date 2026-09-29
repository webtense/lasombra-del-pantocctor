# Setup Email Post-Compra: Solicitud de Reseñas

**Fecha de configuración:** 14/09/2026
**Estado:** ✅ Implementado y listo para probar

---

## Descripción Rápida

El sistema está configurado para enviar emails solicitando reseñas a compradores de "La Sombra del Pantocrátor" 7-14 días después de la compra.

**Características:**
- ✅ Función Brevo implementada: `sendReviewRequestEmail()`
- ✅ Endpoint POST/GET: `/api/send-review-request`
- ✅ HTML responsivo con CTAs (Amazon, Goodreads, Google Books)
- ✅ Validación de datos y error handling
- ✅ Tests de validación incluidos
- ⏳ Automatización: pendiente implementar en N8n o cron

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `lib/brevo.ts` | Función `sendReviewRequestEmail()` (añadida) |
| `app/api/send-review-request/route.ts` | Endpoint POST/GET |
| `BREVO_EMAIL_POST_COMPRA_RESENAS.md` | Documentación detallada |
| `REVIEW_EMAIL_SETUP.md` | Este archivo (guía de setup) |
| `scripts/test-review-email.ts` | Tests automáticos |

---

## Pruebas Rápidas

### 1. Health Check (sin credenciales)

```bash
curl https://la-sombra-del-pantocrator.vercel.app/api/send-review-request
```

**Respuesta esperada:**
```json
{
  "endpoint": "/api/send-review-request",
  "method": "POST",
  "config": {
    "hasBrevoKey": true,
    "daysDefault": 7,
    "emailsPerDay": "ilimitados (Brevo free: 300/día)"
  }
}
```

### 2. Enviar Email de Prueba

```bash
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "asanchez@viajesparati.com",
    "toName": "Andrés",
    "daysOwnedCount": 14
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Email de solicitud de reseña enviado correctamente",
  "email": "asanchez@viajesparati.com",
  "timestamp": "2026-09-14T15:30:00.000Z"
}
```

### 3. Test Suite Completo

```bash
cd /path/to/LaSombraDelPantocrator/02-WEB
npx ts-node scripts/test-review-email.ts
```

---

## Próximos Pasos (Checklist)

### Fase 1: Validación (Esta sesión ✅)

- [x] Función `sendReviewRequestEmail()` codificada
- [x] Endpoint `/api/send-review-request` codificado
- [x] HTML email diseñado
- [x] Tests escritos
- [x] Documentación completada

### Fase 2: Automatización (N8n o Cron)

Elegir UNA opción:

**Opción A: N8n Workflow** (RECOMENDADO)

```
1. Crear workflow en N8n:
   - Cron trigger: cada 3 días a 08:00 CET
   - Query Supabase: compras de 7-14 días atrás
   - Loop: POST /api/send-review-request para cada email
   - Update: marcar como enviado

2. Configurar en Supabase:
   - Tabla `purchases` debe tener columna `review_email_sent` (boolean)

3. Variables de entorno N8n:
   - API_BASE_URL=https://la-sombra-del-pantocrator.vercel.app
   - SUPABASE_KEY=...
```

**Opción B: Cron en VPS**

```bash
# Script: /opt/lsp-review-emailer/send_reviews.py
*/3 * * * * /usr/bin/python3 /opt/lsp-review-emailer/send_reviews.py
```

### Fase 3: Admin Panel (Opcional)

Crear interfaz en `/admin/send-reviews` para:
- Ver lista de compradores de 7-14 días atrás
- Botones para enviar selectivamente
- Histórico de envíos

---

## URLs de Plataformas (Actualizar)

Estas URLs aparecen en el email. Actualizar con links reales cuando esté registrado:

| Plataforma | URL Actual | URL Real |
|---|---|---|
| **Amazon** | `https://www.amazon.es/s?k=la+sombra+del+pantocractor` | Pendiente (KDP URL) |
| **Goodreads** | `https://www.goodreads.com` | Pendiente (crear libro) |
| **Google Books** | `https://books.google.com` | Pendiente (registrar) |

**Importante:** Cuando tengas las URLs reales, actualizar en:
1. Llamadas manuales al endpoint
2. N8n workflow (si aplica)
3. HTML template en `sendReviewRequestEmail()`

---

## Configuración Brevo (Verificar)

### Listas

Verificar que existen estas dos listas en Brevo:

1. **"La Sombra del Pantocrátor"**
   - Folder: "La Sombra del Pantocrátor"
   - Subscribers: Todos los compradores (se añaden automáticamente)

2. **"Testers"**
   - Folder: "La Sombra del Pantocrátor"
   - Subscribers: Beta testers

### Plan y Límites

- **Plan:** FREE
- **Emails/día:** 300
- **Si >300 compradores:** Programar en lotes (7 al día)

### API Key

- **Variable:** `BREVO_API_KEY` en `.env.local`
- **Configurada:** ✅ Sí (verificar que no esté vacía)
- **Almacenada en:** `SUPABASE_VAULT` (nunca en git)

---

## Variables de Entorno (Verificar)

En `.env.local` debe estar:

```
BREVO_API_KEY=xkeysib-d563419ec5f9eac30cbe7d95dff49420...
NEXT_PUBLIC_URL=https://la-sombra-del-pantocrator.vercel.app
```

---

## Flujo de Email (Cómo se vería)

### Asunto
```
¿Qué te pareció La Sombra del Pantocrátor? 📖
```

### Contenido (aproximado)

```
La Sombra del Pantocrátor

Hola [Nombre],

Han pasado [N] días desde que compraste La Sombra del Pantocrátor 
y esperamos que lo estés disfrutando.

Si has tenido un buen rato leyendo (o escuchando) la novela, 
nos encantaría que compartieras tu opinión en:

[BOTÓN GRANDE AMARILLO] 📖 Reseña en Amazon
Deja tu puntuación y comentario donde la compraste

Otras plataformas:
📚 Goodreads
🔍 Google Books

Las reseñas de lectores como tú ayudan a otros a decidir 
si quieren leer el libro, y nos motivan a seguir escribiendo. 
¡Gracias!

Un saludo,
Andrés Sánchez Serrano
Autor de La Sombra del Pantocrátor
```

---

## Troubleshooting

### Error: "BREVO_API_KEY no configurada"

**Solución:** Verificar `.env.local` contiene la clave:
```bash
grep BREVO_API_KEY /path/to/.env.local
```

### Error: Brevo 401

**Causa:** IP no autorizada en Brevo
**Solución:** Whitelist IP en cuenta Brevo → settings → authorized IPs

### Error: "toEmail inválido"

**Causa:** Email mal formado
**Solución:** Validar formato en request

### Test suite falla

**Solución:** Ejecutar con más verbosidad:
```bash
DEBUG=* npx ts-node scripts/test-review-email.ts
```

---

## Métricas y Monitoreo

### Qué registrar

Cuando implemente automatización, registrar:

```json
{
  "timestamp": "2026-09-21T08:00:00Z",
  "event": "review_email_sent",
  "email": "comprador@example.com",
  "daysOwnedCount": 14,
  "status": "success|failed",
  "brevoResponse": "250 OK | 401 Unauthorized",
  "campaignId": null
}
```

### Dashboard Admin

Ideas para admin panel:
- Total enviados (semana/mes)
- Tasa de clics en CTAs
- Bounces y unsubscribes
- Reseñas recibidas vs esperadas

---

## Referencias Rápidas

**Documentación completa:**
- `BREVO_EMAIL_POST_COMPRA_RESENAS.md`

**Código:**
- Función: `lib/brevo.ts` → `sendReviewRequestEmail()`
- Endpoint: `app/api/send-review-request/route.ts`
- Tests: `scripts/test-review-email.ts`

**Endpoints relacionados:**
- POST-compra inicial: `app/api/webhook/route.ts`
- Newsletter: `app/api/newsletter/route.ts`
- Admin dashboard: `app/api/admin/dashboard/email/route.ts`

---

## Soporte

Para dudas o cambios:
1. Revisar `BREVO_EMAIL_POST_COMPRA_RESENAS.md` (documentación detallada)
2. Consultar con Andrés Sánchez Serrano (autor)
3. Verificar logs en `/var/log/lsp-app/brevo.log` (si aplica)

---

**Última actualización:** 14/09/2026 — Claude Haiku 4.5
