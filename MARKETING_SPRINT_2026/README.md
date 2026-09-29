# Marketing Sprint 2026 — La Sombra del Pantocrátor

**Estado:** Workflow completado 14/09/2026 · 14 agentes · 0 errores · 4 frentes

---

## 📊 Estructura de entregas

```
MARKETING_SPRINT_2026/
├── instagram/           ← Activos visuales y calendario (VACÍO: ver abajo)
├── brevo/              ← Email + contactos
├── goodreads/          ← ARCs + ficha autor
├── prensa/             ← Nota de prensa (VACÍO: generada en sesión)
└── README.md           ← Este archivo
```

---

## 🎯 Frente 1: Instagram/TikTok

**Status:** ✅ Completado · Generado en sesión pero no persistido a disco

### Archivos generados (en memoria de sesión)
- **INSTAGRAM_TIKTOK_ASSETS_INVENTORY.md** — Inventario 21 activos (5 retratos + 16 portadas), checklist técnico, especificaciones por plataforma
- **INSTAGRAM_TIKTOK_INVENTORY.html** — Dashboard visual interactivo
- **CARRUSELES_FICHAS_PERSONAJES.md** — 5 fichas (Bruno, Laia, Ágata, Ignaci, Anna) con paleta de colores
- **4 Captions listos** — Copy directo a Instagram, 18-20 hashtags cada uno, 4 enfoques distintos

### Próximos pasos
1. **Descarga de activos:**
   - Portada: `/02-WEB/public/portadas/v25_spotify_3000x3000.png` → redimensionar a 1080×1350 (feed) + 1080×1920 (Reels)
   - Retratos: `/02-WEB/public/personajes/` → descargar 5 JPGs (597×800px)

2. **Grabación de Reels** (batching, 30 min):
   - Cita de personaje (Bruno + portada)
   - Clip audiolibro (14s con música)
   - Ficha de personaje (carrusel)

3. **Programación:**
   - Instagram native scheduler (gratis)
   - 2-3 Reels/semana + 1-2 carruseles

---

## 📧 Frente 2: Brevo & Reseñas

**Status:** ✅ Completado · Archivos persistidos

### 📁 `/brevo/`

**campana_lanzamiento_brevo.html**
- HTML listo para copiar a Brevo (`POST /api/admin/dashboard/mailing/campaign`)
- 2 variantes asunto (A/B test)
- Requiere confirmación: destinatarios (compradores? testers? ambos?) + dominio remitente

**SYNC_BREVO_RESULT.md**
- 3 scripts TypeScript listos (`sync-brevo-contacts.ts`, `diagnose-brevo.ts`, `verify-brevo.ts`)
- 8 contactos ya sincronizados a Brevo como prueba
- Instrucciones: `npm install && npx tsx scripts/sync-brevo-contacts.ts`

### Próximos pasos
1. Revisar campaña HTML (copy, destinatarios)
2. Guardar scripts en `/02-WEB/scripts/`
3. Crear lista "Compradores+Testers" definitiva en Brevo
4. Envío controlado (primero test a ti, luego masivo)

---

## 🎁 Frente 3: Goodreads & ARCs

**Status:** ✅ Completado · Archivos persistidos

### 📁 `/goodreads/`

**ÍNDICE_COMPLETO.md**
- Punto de entrada: resumen de todos los documentos

**RESUMEN_EJECUTIVO_CAMPAÑA_ARC.md**
- Visión general en 3 minutos
- 4 fases de ejecución
- Recomendaciones estratégicas

**guia_implementacion_arc.md** (3.500+ palabras)
- Definición de ARC
- 3 opciones estrategia (Goodreads Giveaways ⭐, Email directo, Groups)
- Checklist 30+ items
- Timeline: 6 semanas ANTES de lanzamiento oficial
- Métricas y KPIs
- 8 errores a evitar

**email_oferta_arc_goodreads.md**
- 3 versiones email (formal, casual, ultra corta)
- FAQ incluida
- Plantillas follow-up

**email_arc_html.html**
- Email profesional responsive (copy-paste directo)
- Diseño visual + CTA prominente
- Funciona en mobile

**google_forms_arc_setup.md**
- Setup Google Form + Google Sheets
- 12 preguntas estructura
- 17 columnas de seguimiento
- 5 plantillas email automáticas (confirmación, follow-up, agradecimiento)

### Próximos pasos
1. Leer RESUMEN_EJECUTIVO (3 min)
2. Elegir estrategia: **Goodreads Giveaways** (recomendado)
3. Crear Google Form + Sheet (15 min)
4. Identificar 5-10 bookstagrammers + enviar email ARC
5. Lanzar 5-6 semanas ANTES de publicación oficial

---

## 🗞️ Frente 4: Local & Turismo

**Status:** ✅ Completado (parcialmente) · No persistido a disco

### Archivos generados (en memoria)
- **Nota de prensa (Vall de Boí + UNESCO)** — Borrador con campos `[COMPLETAR]`
- **Contactos medios Lleida/Pirineo** — Medios recomendados
- **Propuesta Boí Taüll** — Brief pendiente

### Bloqueantes para persistir
- **Remitente:** ¿Boí Taüll Resort? ¿Nombre de portavoz? ¿Firma?
- **CTA:** ¿Dónde dirigir clics? (web, Amazon, pre-order?)
- **Propuesta BTR:** ¿Ejemplar en recepción? ¿Mención en comunicaciones?

### Próximos pasos
1. Confirmar datos arriba
2. Redactar nota de prensa final
3. Enviar a 5-7 medios locales (Segre, Correo de Burgos, radio)

---

## 🔗 Recursos clave

- **Portada:** `/05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg`
- **Retratos:** `/02-WEB/public/personajes/` (5 JPGs, 597×800px)
- **Audiolibro:** `130+ capítulos, 7h 43m 20s, voz es-ES-AlvaroNeural`
- **Web:** `webtenseenergy.com` (venta actual)
- **Stripe:** `sk_live_...` (live mode verificado)

---

## ✅ Checklist de implementación

### Semana 1 (Instagram) — 1h
- [ ] Descargar + redimensionar portada (1080×1350 + 1080×1920)
- [ ] Descargar retratos (5 JPGs)
- [ ] Grabar 2-3 Reels test (cita + portada, clip audiolibro, ficha personaje)
- [ ] Programar en Instagram native scheduler
- [ ] Publicar durante semana

### Semana 2 (Brevo + Prensa) — 1.5h
- [ ] Revisar nota de prensa, confirmar campos
- [ ] Enviar a medios locales (5-7)
- [ ] Crear campaña Brevo: revisar HTML + asunto
- [ ] Sincronizar contactos (compradores + testers)
- [ ] Envío test a ti primero

### Semana 3 (ARCs) — 0.5h
- [ ] Crear Google Form + Sheet
- [ ] Redactar email ARC (versión casual)
- [ ] Identificar 5-10 bookstagrammers españoles
- [ ] Enviar emails ARC

---

## 📅 Cronograma

- **14/09** — Workflow completado, archivos organizados
- **21/09** — Instagram first batch live
- **28/09** — Prensa + Brevo enviados
- **05/10** — ARCs en circulación
- **TBD** — Lanzamiento oficial (KDP + web + plataformas)

---

## 📞 Contacto rápido

**¿Qué archivos necesito para empezar hoy?**
- Instagram: descarga desde scratchpad + espera sesión siguiente para regenerar + guardar
- Brevo: `/brevo/campana_lanzamiento_brevo.html` + `/brevo/SYNC_BREVO_RESULT.md`
- ARCs: `/goodreads/ÍNDICE_COMPLETO.md` (punto de entrada)
- Prensa: Regenerar en sesión siguiente con datos confirmados

---

**Última actualización:** 14/09/2026 · Sprint Haiku 4.5
