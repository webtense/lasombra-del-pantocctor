# VERIFICACIÓN QA — Campaña Lanzamiento "La Sombra del Pantocrátor"

**Fecha de creación:** 14 de septiembre 2026  
**Responsable:** Andrés Sánchez Serrano  
**Estado:** ⏳ PENDIENTE EJECUCIÓN

---

## 📋 VERIFICACIÓN PREVIA A ENVÍOS (Checklist Ejecutivo)

### 1. NOTA DE PRENSA

- [ ] Archivo existe: `/prensa/NOTA_DE_PRENSA_FINAL.md`
- [ ] Contiene: Título, autor, sinopsis, contexto Pirineo
- [ ] Contiene: Ficha técnica (palabras, capítulos, duración audiolibro)
- [ ] Contiene: Contacto de prensa (email + teléfono)
- [ ] Contiene: CTAs claros (Amazon + webtenseenergy.com)
- [ ] Accesibilidad: Texto plano + sin caracteres corruptos
- [ ] Longitud: 400-500 palabras (extensión estándar)
- [ ] Tono: Profesional, tercera persona, sin promoción excesiva

**Resultado:** ✅ VERIFICADO (fecha 14/09/2026)

---

### 2. MATERIALES VISUALES

#### Portada — 3 formatos requeridos

- [ ] Formato 1: 1600×2560 px (KDP estándar)
  - Archivo: `/05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg`
  - Tamaño: ~500-800 KB
  - Verificación: Leer con Image Viewer, comprobar resolución

- [ ] Formato 2: 3000×3000 px (Spotify/redes)
  - Archivo: `/05-PORTADAS/propuestas-v25/...` (Spotify 3000x3000px)
  - Tamaño: ~1-2 MB
  - Verificación: Leer con Image Viewer, comprobar resolución

- [ ] Formato 3: 500×750 px (web + email)
  - Archivo: Generar si no existe (resize 1600×2560)
  - Comando: `convert portada_1600x2560.jpg -resize 500x750 portada_500x750.jpg`

**Resultado:** ⏳ PARCIAL (Formatos 1-2 verificados; formato 3 requiere generación)

---

#### Retratos Personajes — 5 imágenes

- [ ] Bruno Martí: `/02-WEB/public/personajes/bruno.jpg`
  - Verificación: Leer, comprobar formato JPG 597×800px
- [ ] Laia Puig: `/02-WEB/public/personajes/laia.jpg`
  - Verificación: Leer, comprobar formato JPG 597×800px
- [ ] Ágata Soler: `/02-WEB/public/personajes/agata.jpg`
  - Verificación: Leer, comprobar formato JPG 597×800px
- [ ] Anna Puig: `/02-WEB/public/personajes/anna.jpg`
  - Verificación: Leer, comprobar formato JPG 597×800px
- [ ] Ignaci Castells: `/02-WEB/public/personajes/ignaci.jpg`
  - Verificación: Leer, comprobar formato JPG 597×800px

**Resultado:** ✅ VERIFICADO (5/5 retratos presentes)

---

### 3. AUDIOLIBRO — EXTRACTO DE MUESTRA

- [ ] Archivo de muestra existe: `/04-AUDIO/distribucion/...`
- [ ] Duración: 30 segundos a 1 minuto (introductorio)
- [ ] Formato: MP3 mono 44.1 kHz 192 kbps ACX-compliant
- [ ] Contenido: Prólogo o primeros párrafos
- [ ] Metadata ID3: Title, Artist (Álvaro Neuro), Album (La Sombra del Pantocrátor)
- [ ] Verificación: `ffprobe -v quiet -print_format json -show_format archivo.mp3`

**Comando de verificación:**
```bash
ffprobe -v quiet -print_format json -show_format \
  /home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/04-AUDIO/distribucion/spotify/audio/000_prologo.mp3 \
  | jq '.format | {duration, bit_rate, sample_rate, channels}'
```

**Resultado:** ⏳ PENDIENTE (verificar archivo exacto en ruta distribucion/)

---

### 4. WEB — VERIFICACIÓN ACCESIBILIDAD

- [ ] URL webtenseenergy.com accesible (HTTPS válido)
- [ ] Página del libro visible en web
- [ ] Link a Amazon funcional
- [ ] Link a audiolibro funcional
- [ ] Contacto de autor visible
- [ ] Bio del autor actualizada

**Verificación manual:**
```
1. Abrir https://webtenseenergy.com en navegador
2. Buscar "Sombra del Pantocrátor"
3. Verificar: Links Amazon, audiolibro, contacto
```

**Resultado:** ✅ VERIFICADO (web operativa 14/09/2026)

---

### 5. EMAILS — VALIDACIÓN CONTACTOS

#### Segmento 1: Diarios Comarcales (5 contactos)

| Medio | Email | Verificación |
|---|---|---|
| Segre | cultura@segre.com | ⏳ Pendiente validación |
| La Mañana | cultura@lamanyana.cat | ⏳ Pendiente validación |
| Diari de Lleida | cultura@diariedelleida.cat | ⏳ Pendiente validación |
| Regió7 | cultura@regio7.cat | ⏳ Pendiente validación |
| El Periódico de Aragón | cultura@elperiodicoaragon.com | ⏳ Pendiente validación |

**Validación recomendada:**
- Google Search: `[nombremedios] contacto redaccion`
- LinkedIn: Buscar "Editor Cultura [medio]"
- Teléfono: Llamar centralita, preguntar por redacción cultura

#### Segmento 2: Radios (3 contactos)

| Medio | Email | Verificación |
|---|---|---|
| Ràdio Lleida | programacion@radiolleda.com | ⏳ Pendiente validación |
| Onda Cero Lleida | redaccio@ondacero-lleida.com | ⏳ Pendiente validación |
| iCat Ràdio | lectures@icat.es | ⏳ Pendiente validación |

#### Segmento 3: Webs Especializadas (7 contactos)

| Medio | Email | Verificación |
|---|---|---|
| ConeixLleida | info@coneixlleida.cat | ⏳ Pendiente validación |
| CatalunyaPress | redaccio@catalunyapress.com | ⏳ Pendiente validación |
| Pirineus.net | redaccio@pirineus.net | ⏳ Pendiente validación |
| ElPeriódico.cat | cultura@elperiodico.cat | ⏳ Pendiente validación |
| Vilaweb | redaccio@vilaweb.cat | ⏳ Pendiente validación |
| LleRespondent | redaccio@llerespondent.cat | ⏳ Pendiente validación |
| BallarinasXL | info@ballarinasxl.cat | ⏳ Pendiente validación |

**Protocolo de validación:**
1. Google Search: `[medio] contacto`
2. Buscar página web oficial
3. Localizar sección "Contacto" o "Envía tu noticia"
4. Verificar email en la web
5. Test: Enviar email con asunto "[TEST] Verificación contacto"
6. Anotar en REGISTRO_ENVIOS.csv

**Resultado:** ⏳ PENDIENTE (validar todos 15 contactos)

---

### 6. PLANTILLA DE EMAIL — VALIDACIÓN

- [ ] Plantilla incluida en `MEDIOS_LISTA_CONTACTO.md`
- [ ] Plantilla adaptable a cada medio
- [ ] Contiene párrafo de introducción personalizable
- [ ] Incluye CTA claro (Amazon + webtenseenergy.com)
- [ ] Incluye contacto directo autor
- [ ] Línea de "Adjuntos" especificada
- [ ] Tono profesional, sin spam

**Template verificado:** ✅ PRESENTE (líneas 325-360 de MEDIOS_LISTA_CONTACTO.md)

---

### 7. CALENDARIO DE ENVÍO — VALIDACIÓN

- [ ] Fase 1 (Impacto local): 14-16 sep — 8 medios
- [ ] Fase 2 (Amplificación): 17-19 sep — 8 medios
- [ ] Fase 3 (Turismo): 20-22 sep — 6 medios
- [ ] Fase 4 (Digital/Community): 23-25 sep — 5 medios
- [ ] Extra (Suplementos/Revistas): 26 sep - 5 oct — 3 medios
- [ ] Total: 30 medios en 15-20 días

**Calendario verificado:** ✅ PRESENTE (líneas 358-370 de MEDIOS_LISTA_CONTACTO.md)

---

### 8. REGISTRO DE SEGUIMIENTO

- [ ] Archivo CSV existe: `/REGISTRO_ENVIOS.csv`
- [ ] 30 filas (1 por medio)
- [ ] Campos: ID, Fase, Fecha, Medio, Email, Adjuntos, Estado, etc.
- [ ] Estado inicial: PENDIENTE
- [ ] Columnas vacías para: Fecha publicación, URL, Engagement

**CSV verificado:** ✅ PRESENTE (30 medios, 13 columnas)

---

### 9. DOCUMENTACIÓN ADICIONAL

- [ ] Archivo MEDIOS_LISTA_CONTACTO.md completo (6 segmentos)
- [ ] Notas operativas incluidas
- [ ] Checklist previo a envío (líneas 370+)
- [ ] Métricas a monitorear especificadas
- [ ] Horarios óptimos de envío indicados

**Documentación verificada:** ✅ PRESENTE

---

## 🚀 ACCIONES PENDIENTES ANTES DE LANZAR

### CRÍTICAS (Must-do antes del 16/09)

1. **Generar portada 500×750 px**
   ```bash
   convert /home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg \
     -resize 500x750 portada_500x750.jpg
   ```
   - **Responsable:** Andrés Sánchez Serrano
   - **Plazo:** 14/09/2026
   - **Verificación:** Confirmar tamaño con `identify portada_500x750.jpg`

2. **Validar 30 emails de contacto**
   - **Protocolo:** Google Search + LinkedIn + llamada teléfonica
   - **Responsable:** Andrés Sánchez Serrano
   - **Plazo:** 14-15/09/2026
   - **Output:** Tabla con ✅/❌ en MEDIOS_LISTA_CONTACTO.md

3. **Extraer muestra audiolibro (30 seg - 1 min)**
   ```bash
   ffmpeg -i 000_prologo.mp3 -ss 0 -t 60 -acodec copy sample_prologo_30seg.mp3
   ```
   - **Responsable:** Andrés Sánchez Serrano
   - **Plazo:** 14/09/2026
   - **Output:** MP3 ACX-compliant en carpeta `/04-AUDIO/distribucion/sample/`

4. **Crear carpeta de envío con todos los adjuntos**
   ```
   /02-WEB/MARKETING_SPRINT_2026/adjuntos_para_enviar/
   ├── NOTA_DE_PRENSA_FINAL.pdf  (convertir MD a PDF)
   ├── portada_1600x2560.jpg
   ├── portada_3000x3000.jpg
   ├── portada_500x750.jpg
   ├── bruno.jpg
   ├── laia.jpg
   ├── agata.jpg
   ├── anna.jpg
   ├── ignaci.jpg
   └── sample_prologo_30seg.mp3
   ```
   - **Responsable:** Andrés Sánchez Serrano
   - **Plazo:** 15/09/2026
   - **Verificación:** 10 archivos, tamaño total ~15-20 MB

### IMPORTANTES (Must-do antes del 17/09)

5. **Prueba de envío (test email)**
   - Enviar email de prueba a: asanchez@webtenseenergy.com
   - Verificar: Formato, adjuntos, links, visualización
   - Registrar en REGISTRO_ENVIOS.csv como "TEST"

6. **Revisar tono de cada email personalizado**
   - Generar 5 plantillas personalizadas (Fase 1)
   - Revisar: Nombres correctos, ángulos temáticos, CTAs
   - Plazo: 16/09/2026

---

## 📊 CHECKLIST DE EJECUCIÓN (POR FASE)

### FASE 1: 14-16/09/2026 — IMPACTO LOCAL (8 medios)

**Antes de enviar cualquier email:**
- [ ] Todos los 4 adjuntos generados y validados
- [ ] Carpeta adjuntos_para_enviar completada
- [ ] 5 templates personalizadas (Segre, La Mañana, Diari, Regió7, Periódico Aragón) revisadas
- [ ] Email de prueba enviado y verificado
- [ ] REGISTRO_ENVIOS.csv abierto y listo para actualizar

**Envíos Fase 1:**
- [ ] 14/09 08:00: Segre (cultura@segre.com)
- [ ] 14/09 09:00: La Mañana (cultura@lamanyana.cat)
- [ ] 14/09 10:00: Diari de Lleida (cultura@diariedelleida.cat)
- [ ] 15/09 08:00: Regió7 (cultura@regio7.cat)
- [ ] 15/09 09:00: El Periódico de Aragón (cultura@elperiodicoaragon.com)
- [ ] 15/09 17:00: Ràdio Lleida (programacion@radiolleda.com)
- [ ] 15/09 17:30: Onda Cero Lleida (redaccio@ondacero-lleida.com)
- [ ] 16/09 08:00: iCat Ràdio (lectures@icat.es)

**Después de cada envío:**
- [ ] Actualizar Estado en REGISTRO_ENVIOS.csv ("ENVIADO")
- [ ] Anotar hora exacta de envío
- [ ] Guardar confirmación de entrega (si el email la proporciona)

**Seguimiento Fase 1 (Día 3-4):**
- [ ] Llamadas a redactores/productores que no hayan respondido
- [ ] Nota: "¿Recibió nuestra nota de prensa sobre La Sombra del Pantocrátor?"
- [ ] Registrar en "Notas" del CSV

---

### FASE 2: 17-19/09/2026 — AMPLIFICACIÓN (8 medios)

**Condición previa:** Fase 1 completada

**Envíos Fase 2:**
- [ ] 17/09 09:00: CatalunyaPress (redaccio@catalunyapress.com)
- [ ] 18/09 09:00: ConeixLleida (info@coneixlleida.cat)
- [ ] 18/09 10:00: Pirineus.net (redaccio@pirineus.net)
- [ ] 19/09 09:00: ElPeriódico.cat (cultura@elperiodico.cat)
- [ ] 19/09 10:00: Vilaweb (redaccio@vilaweb.cat)
- [ ] 20/09 09:00: LleRespondent (redaccio@llerespondent.cat)
- [ ] 20/09 10:00: BallarinasXL (info@ballarinasxl.cat)

**Notas especiales:**
- CatalunyaPress: Esperar confirmación de sindicación (puede tardar 5-7 días)

---

### FASE 3: 20-22/09/2026 — TURISMO (6 medios)

**Personalizaciones requeridas:**
- Énfasis en Vall de Boí como atracción turística
- Conexión naturaleza/patrimonio Pirineo
- CTAs a portales turísticos además de Amazon

**Envíos Fase 3:**
- [ ] 20/09 10:00: Turisme de Lleida (comunicacio@turismedelleida.com)
- [ ] 21/09 10:00: Vall de Boí Turisme (turisme@valldeboi.cat)
- [ ] 21/09 11:00: Guía Turismo Pirineo (redaccio@pirineotours.com)
- [ ] 22/09 10:00: National Geographic (viajes@ngspain.com) [NOTA: Lead time largo]
- [ ] 22/09 11:00: Viajeros.com (redaccio@viajeros.com)
- [ ] 23/09 10:00: Aventurapack (info@aventurapack.es)

---

### FASE 4: 23-25/09/2026 — DIGITAL/COMMUNITY (5 medios)

**Personalizaciones requeridas:**
- Énfasis en thriller tecnológico vs suspense romántico
- Community engagement: hashtags, menciones
- CTAs a Goodreads + Amazon

**Envíos Fase 4:**
- [ ] 23/09 10:00: Lectoque.com (contacto@lectoque.com)
- [ ] 24/09 10:00: Librentes.com (prensa@librentes.com)
- [ ] 24/09 11:00: El Ojo Crítico (contacto@elojocriti.com)
- [ ] 25/09 10:00: Ficción 2.0 (info@ficcion2punto0.es)
- [ ] 25/09 11:00: Autoras Libres (contacto@autoraslibres.com)

---

### EXTRA: SUPLEMENTOS (3 medios) — 26/09 onwards

**Lead time especial:** Suplementos publican 7-10 días después del envío

- [ ] 26/09: Suplemento Lleida Cultura (cultura@segre.com) — para viernes 27/09
- [ ] 27/09: Suplemento Lleida en Viu (cultura@lamanyana.cat) — para domingo 28/09
- [ ] 01/10: Revista Pallars Jussà (redaccio@pallars-jusssa.cat) — flexible, bimestral
- [ ] 05/10: Revista Ecoturis (redaccio@ecoturis.cat) — flexible, trimestral

---

## 📈 MONITOREO Y MÉTRICAS

### Indicadores Clave (KPIs)

**Por email enviado:**
- Confirmación de entrega (bounce rate)
- Respuesta del medio (sí/no)
- Tipo de cobertura (noticia/reseña/entrevista)
- Fecha de publicación estimada

**Agregadas:**
- **Cobertura total:** n° medios que publican / n° medios contactados
- **Alcance estimado:** suma de audiencias de cada medio
- **Lead time promedio:** días entre envío y publicación
- **Tráfico referido:** Analytics webtenseenergy.com (origen "Prensa")
- **Ventas attributables:** Amazon sales tag tracking (si disponible)

### Herramientas de Monitoreo

1. **Google Alerts** (automatizado)
   - Crear 3 alertas:
     - "La Sombra del Pantocrátor"
     - "Andrés Sánchez Serrano" autor
     - "Pantocrátor" thriller

2. **Google Analytics** (webtenseenergy.com)
   - Filtro: Tráfico → Referrer "segre.com", "lamanyana.cat", etc.
   - Seguimiento de conversión Amazon

3. **Spreadsheet de resultados** (actualizar semanalmente)
   - Copiar columnas clave de REGISTRO_ENVIOS.csv
   - Añadir: Fecha publicación real, URL, tráfico referido, ventas

---

## ✅ ÚLTIMO CHECKLIST PRE-LANZAMIENTO

**De aquí a las 12:00 del 14/09/2026:**

- [ ] Portada 500×750 px generada
- [ ] Muestra audiolibro (30 seg) extraída
- [ ] Carpeta adjuntos_para_enviar completada
- [ ] 30 emails validados (Google Search)
- [ ] Email de prueba enviado a asanchez@webtenseenergy.com y verificado
- [ ] Plantillas personalizadas Fase 1 (5 medios) revisadas
- [ ] REGISTRO_ENVIOS.csv abierto en editor de texto/Excel
- [ ] Google Alerts creadas
- [ ] Recordatorio en calendario: Seguimiento Fase 1 día 17/09

**Estado final:** ⏳ LISTO PARA EJECUTAR

---

## 📝 NOTAS FINALES

1. **Flexibilidad de fechas:** Si un medio responde con disponibilidad antes de la fase prevista, adelantar el envío (anotar en CSV).

2. **Documentación de errores:** Si un email bouncea, anotar en CSV y buscar email alternativo (teléfono → buscar contacto en web).

3. **Personalizaciones:** Cada email debe tener un párrafo de 2-3 líneas que mencione específicamente al medio o su audiencia (no es spam genérico).

4. **Follow-up:** Día 7 después de cada fase, si no hay respuesta, ofrecer entrevista exclusiva por teléfono/vídeo.

5. **Publicaciones:** Tan pronto como un medio publique, guardar URL en REGISTRO_ENVIOS.csv y compartir en redes sociales (crédito al medio).

---

**Última actualización:** 14 de septiembre 2026  
**Responsable:** Andrés Sánchez Serrano  
**Estado:** ⏳ PENDIENTE VALIDACIÓN FINAL + EJECUCIÓN
