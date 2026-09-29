# Configuración de Email Post-Compra (Solicitud de Reseñas)

**Última actualización:** 14/09/2026

## Resumen

Sistema de email automatizado para solicitar reseñas a compradores de "La Sombra del Pantocrátor" en **Amazon, Goodreads y Google Books**, 7-14 días después de la compra.

---

## Arquitectura

### Flujo Principal

```
1. Cliente compra en Stripe
   ↓
2. Webhook checkout.session.completed 
   ├─ Registra compra en Supabase (tabla purchases)
   ├─ Genera credenciales de acceso (/panel)
   └─ Envía email post-compra (descargas + panel)
   ↓
3. N8n cron (programado) O manual trigger
   ├─ Lee compras de 7-14 días atrás en Supabase
   ├─ Llamada POST /api/send-review-request para cada email
   └─ Registra envío en logs de Brevo
   ↓
4. Comprador recibe email
   ├─ "¿Qué te pareció La Sombra del Pantocrátor?"
   ├─ CTA principal: Amazon (donde compraron)
   ├─ CTAs secundarias: Goodreads, Google Books
   └─ Firmas: Andrés Sánchez Serrano, Autor
```

### Componentes Implementados

| Componente | Ubicación | Responsabilidad |
|---|---|---|
| **Función Brevo** | `lib/brevo.ts` : `sendReviewRequestEmail()` | Composición HTML + envío SMTP |
| **Endpoint API** | `app/api/send-review-request/route.ts` | POST/GET para disparar emails |
| **Listas Brevo** | "La Sombra del Pantocrátor" (compradores) | Contactos sincronizados al comprar |
| **Email Template** | Inline HTML en `sendReviewRequestEmail()` | Diseño responsive, CTA claro |
| **Automatización** | N8n workflow (futuro) o cron VPS | Trigger automático cada 7-14 días |

---

## Funciones Disponibles

### `sendReviewRequestEmail(params)`

**Ubicación:** `/lib/brevo.ts`

**Parámetros:**

```typescript
{
  toEmail: string                     // Requerido. Email del comprador
  toName?: string | null              // Nombre para personalizar greeting
  bookTitle?: string                  // Título (default: "La Sombra del Pantocrátor")
  amazonUrl?: string                  // URL Amazon (default: búsqueda genérica)
  goodreadsUrl?: string               // URL Goodreads (default: raíz)
  googleBooksUrl?: string             // URL Google Books (default: raíz)
  daysOwnedCount?: number             // Días desde compra (default: 7)
}
```

**Retorno:**

```typescript
{
  sent: boolean
  error?: string
}
```

**Ejemplo:**

```typescript
const result = await sendReviewRequestEmail({
  toEmail: 'juan@example.com',
  toName: 'Juan Pérez',
  daysOwnedCount: 14,
});
if (result.sent) {
  console.log('✅ Email enviado');
} else {
  console.error('❌', result.error);
}
```

---

## API Endpoint

### `POST /api/send-review-request`

Envía email de reseña a un comprador.

**Body esperado:**

```json
{
  "toEmail": "comprador@example.com",
  "toName": "Juan Pérez",
  "bookTitle": "La Sombra del Pantocrátor",
  "amazonUrl": "https://amazon.es/La-Sombra-Pantocrator/...",
  "daysOwnedCount": 14
}
```

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Email de solicitud de reseña enviado correctamente",
  "email": "comprador@example.com",
  "timestamp": "2026-09-14T15:30:00.000Z"
}
```

**Respuesta error (400/500):**

```json
{
  "error": "toEmail inválido | Brevo 401 | ..."
}
```

**Ejemplo cURL:**

```bash
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "test@example.com",
    "toName": "Tester",
    "daysOwnedCount": 7
  }'
```

### `GET /api/send-review-request`

Health check + documentación del endpoint.

**Respuesta:**

```json
{
  "endpoint": "/api/send-review-request",
  "method": "POST",
  "description": "Envía email de solicitud de reseña a compradores",
  "config": {
    "hasBrevoKey": true,
    "daysDefault": 7,
    "emailsPerDay": "ilimitados (Brevo free: 300/día)"
  },
  "usage": {
    "toEmail": "email@example.com (requerido)",
    "toName": "nombre (opcional)",
    "bookTitle": "La Sombra del Pantocrátor (opcional)",
    "amazonUrl": "enlace directo a Amazon (opcional)",
    "daysOwnedCount": "7 (opcional)"
  }
}
```

---

## Configuración en Brevo

### Listas

**1. "La Sombra del Pantocrátor" (Compradores)**
- **ID:** (verificar en Brevo)
- **Subscribers:** Todos los que compraron
- **Folder:** "La Sombra del Pantocrátor"
- **Actualización:** Automática al webhook (`lib/brevo-marketing.ts`)

**2. "Testers" (Beta testers)**
- **ID:** (verificar en Brevo)
- **Subscribers:** Testers autorizados
- **Folder:** "La Sombra del Pantocrátor"
- **Nota:** Pueden recibir emails de prueba

### Remitente

- **Nombre:** "Andrés Sánchez Serrano" (o "La Sombra del Pantocrátor")
- **Email:** `no-responder@lasombradelpantocrator.com` (transaccional)
- **Plan:** FREE (300 envíos/día)

### Restricciones

- **Emails por día:** 300 (plan FREE)
- **Si hay >300 compradores:** Necesaria programación en lotes
- **IP whitelist:** Verificar si Brevo requiere IP autorizada

---

## Automatización Propuesta

### Opción 1: N8n Cron (RECOMENDADO)

**Workflow:** "Solicitar Reseñas Automáticas"

```
1. Cron trigger (cada 3 días a las 08:00 CET)
2. Query Supabase:
   SELECT email, name, created_at FROM purchases
   WHERE created_at BETWEEN now()-interval'14 days' AND now()-interval'7 days'
   AND review_email_sent = false
3. Para cada comprador:
   POST /api/send-review-request
4. Update purchases SET review_email_sent = true
```

**Ventajas:**
- Automático sin mantenimiento
- Registra envíos en BD
- Fácil de pausar/reanudar desde N8n

**Desventajas:**
- Depende de n8n estar up
- Requiere webhook en Supabase

### Opción 2: Cron Manual (VPS)

**Script:** `/opt/lsp-review-emailer/send_reviews.py`

```bash
*/3 * * * * /usr/bin/python3 /opt/lsp-review-emailer/send_reviews.py
```

**Ventajas:**
- No depende de terceros
- Control local

**Desventajas:**
- Requiere mantenimiento en VPS
- Menos integración con app

### Opción 3: Admin Panel (Manual)

**URL:** `https://la-sombra-del-pantocrator.vercel.app/admin/send-reviews`

- Tabla con compradores de 7-14 días atrás
- Botón para enviar a seleccionados
- Confirmación antes de disparar
- Log de envíos

---

## Checklist de Configuración

### Implementado ✅

- [x] Función `sendReviewRequestEmail()` en `lib/brevo.ts`
- [x] Endpoint POST/GET `/api/send-review-request`
- [x] HTML email con CTAs (Amazon, Goodreads, Google Books)
- [x] Validación de email
- [x] Error handling y logging

### Pendiente

- [ ] Tabla `review_email_logs` en Supabase (opcional, para auditoria)
- [ ] N8n workflow de automatización
- [ ] Admin panel para enviar manual
- [ ] Webhook para sincronizar lista Brevo automáticamente
- [ ] URL directa a Amazon KDP del libro
- [ ] URL directa a Goodreads (cuando se registre el libro)

---

## Testing

### Test Manual (cURL)

```bash
# 1. Health check
curl https://la-sombra-del-pantocractor.vercel.app/api/send-review-request

# 2. Enviar a tester
curl -X POST https://la-sombra-del-pantocrator.vercel.app/api/send-review-request \
  -H "Content-Type: application/json" \
  -d '{
    "toEmail": "asanchez@viajesparati.com",
    "toName": "Andrés (prueba)",
    "daysOwnedCount": 10
  }'

# 3. Verificar logs en servidor
ssh user@vps tail -f /var/log/lsp-app/brevo.log
```

### Test Automatizado

```typescript
// En /app/api/test/send-review/route.ts
import { sendReviewRequestEmail } from '@/lib/brevo'

export async function GET() {
  const result = await sendReviewRequestEmail({
    toEmail: 'test@example.com',
    toName: 'Test User',
    daysOwnedCount: 7,
  })
  return Response.json({ result })
}
```

Luego acceder a `/api/test/send-review` en navegador.

---

## Personalizaciones Futuras

1. **Dinámico desde BD:**
   - Leer URLs reales desde tabla de libros
   - Nombre del autor desde BD

2. **A/B Testing:**
   - Dos versiones del email
   - Tracking de click rates
   - Ajuste según conversión

3. **Resumen Semanal:**
   - Email compilado con todos los que dieron reseña
   - Puntuación promedio
   - Citas destacadas

4. **Goodreads API Integration:**
   - Sincronizar reseñas automáticamente
   - Mostrar rating en web

---

## Referencias

- **Webhook post-compra:** `app/api/webhook/route.ts`
- **Brevo SMTP:** `lib/brevo.ts` (sendPurchaseEmail)
- **Brevo Marketing:** `lib/brevo-marketing.ts` (listas y campañas)
- **Supabase:** `lib/supabase.ts`

---

## Contacto

Para dudas o cambios en este documento, revisar con Andrés Sánchez Serrano (autor) o comentar en el issue correspondiente.
