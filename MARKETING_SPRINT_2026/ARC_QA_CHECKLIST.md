# QA Checklist - Programa ARCs
## La Sombra del Pantocrátor

**Proyecto:** ARCs (Advance Reader Copies)  
**Fecha Creación:** 14/09/2026  
**Versión:** 1.0  
**Responsable:** Andrés Sánchez Serrano

---

## ✅ CHECKLIST FASE 1: SETUP INICIAL

### Google Sheet
- [ ] Sheet creado: `ARCs - La Sombra del Pantocrátor (Goodreads)`
  - Verificar: Acceso compartido (solo lectura para otros)
  - Verificar: ID guardado en arc_config.json
  - **URL:** https://docs.google.com/spreadsheets/d/1nGbveN7gghxXDfi0diOSwKGWjCPtXzwOfPrbjzCBpZM/edit

### Documentación
- [ ] `ARC_IMPLEMENTATION_GUIDE.md` creado ✅
- [ ] `arc_config.json` creado ✅
- [ ] `arc_email_templates.md` creado ✅
- [ ] Especificación Google Doc creado ✅
  - **URL:** https://docs.google.com/document/d/1UfUZnTgyOTyHjmS1GFiXy890ZZhdQLJ11_u2gzdKmi8/edit

### Archivos locales
- [ ] `/MARKETING_SPRINT_2026/ARC_IMPLEMENTATION_GUIDE.md` ✅
- [ ] `/MARKETING_SPRINT_2026/arc_config.json` ✅
- [ ] `/MARKETING_SPRINT_2026/arc_email_templates.md` ✅
- [ ] `/MARKETING_SPRINT_2026/ARC_QA_CHECKLIST.md` ✅ (este archivo)

---

## ✅ CHECKLIST FASE 2: CREAR GOOGLE FORM

### Form Base
- [ ] **Nombre:** "Solicita tu copia ARC - La Sombra del Pantocrátor"
- [ ] **Descripción:** Completa con info del libro
  - [ ] ¿Quieres leer antes de tiempo?
  - [ ] 14h 40m audiolibro
  - [ ] 135.916 palabras, 136 capítulos
  - [ ] webtenseenergy.com
- [ ] **Tema:** Azul/morado (colores primarios)
- [ ] **Portada:** Imagen de portada (1600x400px)

### Vinculación a Sheet
- [ ] Form vinculado a Sheet: `ARCs - La Sombra del Pantocrátor`
- [ ] Respuestas guardadas en pestaña: `📋 Solicitudes Pendientes`
- [ ] Timestamp automático activado

### Campos (20 campos totales)
- [ ] 1. Sección: DATOS PERSONALES
- [ ] 2. Nombre completo (texto corto, required)
- [ ] 3. Email (email, required)
- [ ] 4. País/Región (dropdown, required)
- [ ] 5. Teléfono (texto corto, optional)
- [ ] 6. Sección: PERFIL DE LECTOR
- [ ] 7. Edad (dropdown 13+, required)
- [ ] 8. Géneros favoritos (checkboxes min 1, required)
- [ ] 9. Tienes redes sociales (radio, optional)
- [ ] 10. Cuáles son tus redes (texto, conditional)
- [ ] 11. Perfil Goodreads (URL texto, optional)
- [ ] 12. Sección: COMPROMISO CON EL ARC
- [ ] 13. Prometo leer 4 semanas (radio, required)
- [ ] 14. Prometo reseña Amazon (radio, required)
- [ ] 15. Prometo reseña Goodreads (radio, required)
- [ ] 16. Autorizo uso marketing (checkbox, optional)
- [ ] 17. Sección: FORMATO Y PREFERENCIAS
- [ ] 18. Formato preferido (radio PDF/ePub/Ambos, required)
- [ ] 19. Tipo de lectura (radio pantalla/papel/audiobook, optional)
- [ ] 20. Sección: COMENTARIOS FINALES
- [ ] 21. Comentarios finales (párrafo, optional)

### Configuración Respuestas
- [ ] Mostrar barra de progreso: SÍ
- [ ] Permitir editar respuestas: NO
- [ ] Recopilar direcciones email: SÍ
- [ ] Respuesta personalizada configurada
  - Mensaje: "¡Enhorabuena! Tu solicitud ha sido recibida."
- [ ] Notificación por email: asanchez@viajesparati.com
- [ ] Notificación para cada respuesta: SÍ

### Prueba de Funcionamiento
- [ ] Completar formulario como solicitante
- [ ] Verificar que respuesta aparezca en Sheet
- [ ] Verificar email de confirmación recibido
- [ ] Verificar timestamp correcto
- [ ] Verificar que datos se mapeen a columnas correctas

---

## ✅ CHECKLIST FASE 3: SHEET - PESTAÑAS Y ESTRUCTURA

### Pestaña 1: 📋 Solicitudes Pendientes
- [ ] Encabezados creados (A-V):
  - [ ] A: Timestamp
  - [ ] B: Nombre
  - [ ] C: Email
  - [ ] D: País
  - [ ] E: Edad
  - [ ] F: Géneros
  - [ ] G: Tiene redes sociales
  - [ ] H: Redes sociales (usuarios)
  - [ ] I: Perfil Goodreads
  - [ ] J: Promete leer
  - [ ] K: Promete reseña Amazon
  - [ ] L: Promete reseña Goodreads
  - [ ] M: Autoriza uso marketing
  - [ ] N: Formato preferido
  - [ ] O: Tipo lectura
  - [ ] P: Comentarios
  - [ ] Q: Estado (dropdown)
  - [ ] R: Fecha envío ARC
  - [ ] S: Notas internas
  - [ ] T: Recordatorio enviado
  - [ ] U: Reseña Amazon (URL)
  - [ ] V: Reseña Goodreads (URL)
- [ ] Columna Q (Estado) con datos validation:
  - [ ] Dropdown: "Pendiente" / "Aprobado" / "Rechazado"
  - [ ] Color condicional: Pendiente=naranja, Aprobado=verde, Rechazado=rojo
- [ ] Filtro de vista: "Pendientes" (mostrar solo Q=Pendiente)
- [ ] Freeze row 1 (encabezados fijos)

### Pestaña 2: ✅ Aprobadas
- [ ] Misma estructura que Pestaña 1
- [ ] Filtro de vista: "Aprobadas" (mostrar solo Q=Aprobado)
- [ ] Ordenar por: Fecha envío ARC (DESC)

### Pestaña 3: ❌ Rechazadas
- [ ] Misma estructura que Pestaña 1
- [ ] Filtro de vista: "Rechazadas" (mostrar solo Q=Rechazado)

### Pestaña 4: 📊 KPIs + Análisis
- [ ] KPI 1: Total Solicitudes
  - [ ] Celda: A1
  - [ ] Fórmula: `=COUNTA(Pendientes!A2:A) + COUNTA(Aprobadas!A2:A) + COUNTA(Rechazadas!A2:A)`
- [ ] KPI 2: Solicitudes Aprobadas
  - [ ] Celda: A2
  - [ ] Fórmula: `=COUNTA(Aprobadas!A2:A)`
- [ ] KPI 3: Tasa Aprobación (%)
  - [ ] Celda: A3
  - [ ] Fórmula: `=(A2/A1)*100`
- [ ] KPI 4: Reseñas Amazon
  - [ ] Celda: A4
  - [ ] Fórmula: `=COUNTIF(Aprobadas!U:U, "<>")`
- [ ] KPI 5: Reseñas Goodreads
  - [ ] Celda: A5
  - [ ] Fórmula: `=COUNTIF(Aprobadas!V:V, "<>")`
- [ ] Gráfico: Línea (Solicitudes vs Aprobadas por fecha)
- [ ] Gráfico: Pastel (Distribución de edades)
- [ ] Gráfico: Barras (Top 5 géneros)

### Pestaña 5: 📌 Plantillas
- [ ] Sección: Plantillas Email
  - [ ] 1. Confirmación
  - [ ] 2. Aprobación
  - [ ] 3. Recordatorio Semana 2
  - [ ] 4. Recordatorio Semana 4 (Reseña)
  - [ ] 5. Agradecimiento
- [ ] Enlace a: arc_email_templates.md

---

## ✅ CHECKLIST FASE 4: ARCHIVOS DE DISTRIBUCIÓN

### ARC Files - Preparación
- [ ] **PDF**
  - [ ] Archivo: `LaSombraPantocrator_ARC_v1.pdf`
  - [ ] Tamaño: ~15-20 MB
  - [ ] Watermark: "ADVANCE READER COPY - Not for Distribution"
  - [ ] Ubicación: Google Drive (carpeta privada)
  - [ ] Acceso: Enlace público + contraseña (opcional)

- [ ] **ePub**
  - [ ] Archivo: `LaSombraPantocrator_ARC_v1.epub`
  - [ ] Testear en: Kindle, Apple Books, Calibre
  - [ ] Ubicación: Google Drive (carpeta privada)
  - [ ] Validación: EPUB3 estándar

- [ ] **Audiolibro (Preview)**
  - [ ] Archivo: `LaSombraPantocrator_ARC_Preview_1h.m4b`
  - [ ] Duración: 1 hora (de 14h 40m total)
  - [ ] Voz: es-ES-AlvaroNeural (verificar calidad)
  - [ ] Bitrate: 192 kbps
  - [ ] Ubicación: Google Drive (carpeta privada)

### Google Drive - Estructura
- [ ] Carpeta: `/ARCs - La Sombra del Pantocrátor/`
  - [ ] Subcarpeta: `/PDF/`
  - [ ] Subcarpeta: `/ePub/`
  - [ ] Subcarpeta: `/Audiobook/`
  - [ ] Archivo: `LEEME.txt` (instrucciones)
- [ ] Permisos: Privado (solo compartir via enlace temporal)

---

## ✅ CHECKLIST FASE 5: INTEGRACIONES

### Brevo (Email Marketing)
- [ ] 5 plantillas creadas:
  - [ ] ARC_Confirmacion
  - [ ] ARC_Aprobado
  - [ ] ARC_Recordatorio_Semana2
  - [ ] ARC_Recordatorio_Semana4_Reseña
  - [ ] ARC_Agradecimiento
- [ ] Variables dinámicas configuradas:
  - [ ] {{NOMBRE}} → first_name
  - [ ] {{EMAIL}} → email
  - [ ] {{DOWNLOAD_LINK}} → custom attribute
  - [ ] {{FORMAT}} → custom attribute
- [ ] Listas creadas:
  - [ ] "La Sombra del Pantocrátor" (existente)
  - [ ] "ARC Aprobados" (nueva)
- [ ] Test enviado a: asanchez@viajesparati.com
- [ ] Verificar en spam folder: NO

### Automación (Opcional: Zapier / Make)
- [ ] Zapier zap creado: "Google Form → Brevo List"
  - [ ] Trigger: New response in Google Form
  - [ ] Action: Add to list "ARC Aprobados"
- [ ] Zapier zap creado: "Google Sheet → Send Email"
  - [ ] Trigger: New row in Sheet (Aprobadas)
  - [ ] Action: Send email from Brevo template
- [ ] Testing: Completar form de prueba

---

## ✅ CHECKLIST FASE 6: PUBLICACIÓN Y PROMOCIÓN

### Web
- [ ] Banner en homepage: webtenseenergy.com
  - [ ] Texto: "¿Quieres leer antes de tiempo?"
  - [ ] CTA: "Solicitar ARC"
  - [ ] Enlace: [Copiar del Form]
  - [ ] Posición: Hero o sección destacada

### Redes Sociales
- [ ] **Instagram**
  - [ ] Post: Carrusel con portada + detalles del libro
  - [ ] Link en Bio (o Stories)
  - [ ] Hashtags: #ARC #Goodreads #LaSombraDelPantocrátor
  
- [ ] **TikTok**
  - [ ] Video: 15-30s teaser del libro
  - [ ] CTA: "Link en bio"
  
- [ ] **LinkedIn**
  - [ ] Artículo: "Programa de Advance Reader Copies"
  - [ ] Datos de éxito esperado
  - [ ] CTA: "Solicita aquí"

### Email Marketing
- [ ] Campaña Brevo a "La Sombra del Pantocrátor"
  - [ ] Asunto: "¿Quieres leer antes de tiempo?"
  - [ ] Template: HTML personalizado
  - [ ] CTA: Enlace del Form
  - [ ] Fecha envío: [Coordinar con estrategia]
  - [ ] A/B test: Sí/No

### Documentación Web
- [ ] Página FAQ: /arc-faq
  - [ ] ¿Qué es un ARC?
  - [ ] ¿Cuáles son los compromisos?
  - [ ] ¿Cuándo recibo mi copia?
  - [ ] ¿Cuáles son los formatos?
  - [ ] ¿Puedo compartir el ARC?

---

## ✅ CHECKLIST FASE 7: MONITOREO Y SEGUIMIENTO

### Métricas Semanales (Automated Reports)
- [ ] Total nuevas solicitudes
- [ ] Tasa de aprobación (%)
- [ ] Reseñas completadas (Amazon + Goodreads)
- [ ] Rating promedio (⭐)
- [ ] Conversión a ventas (tracking code)

### Tareas Manuales
- [ ] Revisar solicitudes: Lunes + Viernes
  - [ ] Aprobar/rechazar
  - [ ] Enviar email "ARC_Aprobado"
  - [ ] Registrar fecha de envío
  
- [ ] Monitoreo de reseñas: Semanal
  - [ ] Buscar en Amazon/Goodreads
  - [ ] Actualizar Sheet (columnas U, V)
  - [ ] Enviar "ARC_Agradecimiento"
  
- [ ] Actualizar KPIs: Quincenal
  - [ ] Pestaña 📊 Análisis
  - [ ] Generar reportes

---

## ✅ CHECKLIST FASE 8: VALIDACIÓN FINAL

### Seguridad
- [ ] ARC files: No accesibles públicamente
- [ ] Contraseña en ZIP (opcional): 
  - [ ] Password: [Compartir solo con aprobados]
- [ ] Watermark en PDF: Verificado
- [ ] Derechos: Clarificar en email (no redistribuir)

### Compliance
- [ ] RGPD: Datos almacenados correctamente
  - [ ] Política de privacidad linkeada
  - [ ] Consentimiento explícito obtenido
- [ ] Terms of Service: "ARCs no para reventa"
- [ ] Derechos de autor: Protegidos en documentos

### Testing Final
- [ ] Completar form de inicio a fin
- [ ] Verificar respuesta en Sheet
- [ ] Verificar confirmación por email
- [ ] Probar acceso a download (simulado)
- [ ] Verificar navegación en móvil
- [ ] Verificar links no están rotos

---

## 🎯 OBJETIVOS DE ÉXITO

| Métrica | Target | Plazo |
|---------|--------|-------|
| Total solicitudes | 100-200 | 8 semanas |
| Tasa aprobación | 70-80% | Continuo |
| Reseñas completadas | 50%+ aprobados | 6 semanas |
| Rating promedio | 4.0+ estrellas | Post-lanzamiento |
| Ventas derivadas | 10+ copias | 2 meses |
| Engagement social | 100+ likes/shares | 2 semanas |

---

## 📋 FIRMA Y VALIDACIÓN

**Persona responsable:** Andrés Sánchez Serrano  
**Correo:** asanchez@viajesparati.com

**Checklist completado por:** [Nombre]  
**Fecha:** ________________  
**Hora:** ________________

**Validación QA:**
- [ ] Todos los campos completados
- [ ] Todas las pruebas pasadas
- [ ] Listo para lanzamiento público

**Notas finales:**
```
[Espacio para comentarios]
```

---

**Versión:** 1.0  
**Última actualización:** 14/09/2026  
**Estado:** ✅ Listo para ejecutar
