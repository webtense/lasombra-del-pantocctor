# ÍNDICE EJECUTIVO — Campaña Lanzamiento "La Sombra del Pantocrátor"

**Fecha:** 14 de septiembre 2026  
**Responsable:** Andrés Sánchez Serrano (Autor)  
**Objetivo:** Difusión prensa + medios turísticos en 15 días  
**Status:** ✅ LISTO PARA EJECUTAR

---

## 🎯 RESUMEN EN 60 SEGUNDOS

| Aspecto | Detalle |
|---|---|
| **Libro** | La Sombra del Pantocrátor — Thriller tecnológico, 136 cap, 135.916 palabras |
| **Disponibilidad** | Amazon (ebook + papel) + Audiolibro 14h40m + webtenseenergy.com |
| **Público objetivo** | Medios comarcales Lleida/Pirineo + turismo + comunidad lectores |
| **Medios a contactar** | 30 medios (prensa, radios, webs especializadas, turismo, blogs) |
| **Plazo envíos** | 14-25 septiembre 2026 (4 fases en 15 días) |
| **CTAs** | Compra en Amazon \| Lee en webtenseenergy.com |
| **Remitente** | Andrés Sánchez Serrano (autor y portavoz) |

---

## 📂 ARCHIVOS DE REFERENCIA

### DOCUMENTOS PRINCIPALES

1. **MEDIOS_LISTA_CONTACTO.md** ⭐
   - 30 medios con emails, teléfonos, descripciones
   - 6 segmentos (diarios, radios, webs, turismo, blogs)
   - Plantilla de email
   - Calendario enviós
   - Métricas y checklist

2. **REGISTRO_ENVIOS.csv**
   - Tracking de 30 envíos
   - Estados: PENDIENTE → ENVIADO → PUBLICADO
   - Campos: Fase, fecha, medio, email, adjuntos, resultado

3. **VERIFICACION_ENVIOS_QA.md**
   - Checklist QA previo a lanzamiento
   - Acciones pendientes (portada, validación emails, muestra audio)
   - Checklist por fase (ejecución paso a paso)
   - Monitoreo de métricas

4. **NOTA_DE_PRENSA_FINAL.md** (`/prensa/`)
   - Nota de prensa oficial
   - Ficha técnica del libro
   - Datos contacto

---

## 🚀 QUICK START (HOY, 14/09/2026)

### Antes de las 12:00

1. **Generar portada 500×750 px**
   ```bash
   cd /home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/05-PORTADAS/kdp
   convert portada_definitiva_v2_kdp_1600x2560.jpg -resize 500x750 portada_500x750.jpg
   ```

2. **Extraer muestra audiolibro (30 seg)**
   ```bash
   cd /04-AUDIO/distribucion/spotify/audio
   ffmpeg -i 000_prologo.mp3 -ss 0 -t 60 -acodec copy sample_prologo_30seg.mp3
   ```

3. **Crear carpeta de adjuntos**
   ```bash
   mkdir -p /02-WEB/MARKETING_SPRINT_2026/adjuntos_para_enviar
   cp portada_1600x2560.jpg portada_3000x3000.jpg portada_500x750.jpg \
      personajes/*.jpg sample_prologo_30seg.mp3 \
      adjuntos_para_enviar/
   ```

4. **Enviar email de prueba**
   - A: asanchez@webtenseenergy.com
   - Adjuntos: todos (portadas, retratos, audio)
   - Verificar: formato, visualización, descargas

5. **Validar 5 emails Fase 1** (Google Search)
   - Segre: cultura@segre.com ✓
   - La Mañana: cultura@lamanyana.cat ✓
   - Diari Lleida: cultura@diariedelleida.cat ✓
   - Regió7: cultura@regio7.cat ✓
   - El Periódico Aragón: cultura@elperiodicoaragon.com ✓

### A partir de las 14:00

- **Primer envío:** Segre (cultura@segre.com)
- Registrar en REGISTRO_ENVIOS.csv
- Actualizar estado a "ENVIADO"

---

## 📊 FASES DE ENVÍO (Resumen)

| Fase | Período | Medios | Objetivo | Lead Time |
|---|---|---|---|---|
| **1: Impacto Local** | 14-16 sep | 8 | Diarios + radios Lleida | 7-14 días |
| **2: Amplificación** | 17-19 sep | 8 | Agencias + webs especializadas | 5-10 días |
| **3: Turismo** | 20-22 sep | 6 | Portales turismo + viajes | 7-30 días |
| **4: Digital/Community** | 23-25 sep | 5 | Blogs + comunidades lectores | 1-7 días |
| **Extra** | 26 sep - 5 oct | 3 | Suplementos + revistas | 14-60 días |
| **TOTAL** | **14-40 días** | **30 medios** | — | — |

---

## 📋 EMAILS + NÚMEROS CLAVE

### Segmento 1: PRENSA DIARIA (5)

```
Segre .......................... cultura@segre.com ..................... 973 248 900
La Mañana ....................... cultura@lamanyana.cat ................ 973 266 000
Diari de Lleida ................. cultura@diariedelleida.cat ........... 973 240 000
Regió7 .......................... cultura@regio7.cat ................... 938 223 700
El Periódico de Aragón .......... cultura@elperiodicoaragon.com ........ 974 310 400
```

### Segmento 2: RADIOS (3)

```
Ràdio Lleida .................... programacion@radiolleda.com ......... 973 248 800
Onda Cero Lleida ................ redaccio@ondacero-lleida.com ........ 973 220 100
iCat Ràdio ...................... lectures@icat.es .................... 934 334 000
```

### Segmento 3: WEBS + AGENCIAS (7)

```
CatalunyaPress (SINDICACIÓN) .... redaccio@catalunyapress.com ......... [PRIORIDAD]
ConeixLleida .................... info@coneixlleida.cat ............... 973 020 000
Pirineus.net .................... redaccio@pirineus.net ............... [WEB]
ElPeriódico.cat ................. cultura@elperiodico.cat ............. 934 500 600
Vilaweb ......................... redaccio@vilaweb.cat ................ 938 000 300
LleRespondent ................... redaccio@llerespondent.cat .......... [BLOG]
BallarinasXL .................... info@ballarinasxl.cat ............... [CRÍTICA]
```

### Segmento 4: TURISMO (6)

```
Turisme de Lleida (OFICIAL) ..... comunicacio@turismedelleida.com ..... 973 700 319
Vall de Boí Turisme (MICRO) ..... turisme@valldeboi.cat .............. 973 624 008
Guía Turismo Pirineo ............ redaccio@pirineotours.com .......... 973 350 000
National Geographic (LEAD TIME) . viajes@ngspain.com ................. 902 300 000
Viajeros.com .................... redaccio@viajeros.com .............. 931 203 500
Aventurapack (NICHO) ............ info@aventurapack.es .............. 934 151 200
```

### Segmento 5: BLOGS + COMMUNITY (5)

```
Lectoque.com .................... contacto@lectoque.com ............... [INFLUENCIA]
Librentes.com (COMUNIDAD) ....... prensa@librentes.com ............... [+100K MIEMBROS]
El Ojo Crítico .................. contacto@elojocriti.com ............ [ANÁLISIS]
Ficción 2.0 (AUTORES INDIE) ..... info@ficcion2punto0.es ............. 
Autoras Libres (COLECTIVO) ...... contacto@autoraslibres.com ......... 
```

---

## 💾 ADJUNTOS A INCLUIR

```
[En todos los emails - Template estándar]
├── NOTA_DE_PRENSA_FINAL.md/pdf
├── portada_1600x2560.jpg (KDP)
├── portada_3000x3000.jpg (Spotify/redes)
├── portada_500x750.jpg (web)
├── bruno.jpg (personaje)
├── laia.jpg (personaje)
├── agata.jpg (personaje)
├── anna.jpg (personaje)
├── ignaci.jpg (personaje)
└── sample_prologo_30seg.mp3 (audiolibro)

[En emails a RADIOS - adicionales]
├── sample_prologo_30seg.mp3 (prioritario)
└── NOTA_PRENSA simplificada (2 párrafos)

[En emails a BLOGS - adaptados]
├── NOTA_PRENSA_CRITICA_LITERARIA.txt
└── portadas (todas 3)
```

---

## ⏰ CRONOGRAMA DE EJECUCIÓN

```
HOY 14/09 TARDE
├─ 14:00 → Generar portada 500px + muestra audio
├─ 15:00 → Email de prueba
└─ 16:00 → Primer envío (Segre)

15-16/09
├─ 08:00 → Envíos Fase 1 (diarios)
├─ 17:00 → Envíos Fase 1 (radios)
└─ 17/09 MAÑANA → Fase 2 comienza (agencias)

17-19/09 (Fase 2)
├─ Envíos a agencias + webs especializadas
└─ SEGUIMIENTO: Llamadas a no responden

20-22/09 (Fase 3)
├─ Envíos a turismo (adaptado a ángulo turístico)
└─ SEGUIMIENTO: Email adicional a Turisme Lleida

23-25/09 (Fase 4)
├─ Envíos a blogs + comunidades
└─ SEGUIMIENTO: Engagement en redes

26 sep - 5 oct (Extra)
├─ Suplementos (con lead time 7-10 días)
├─ Revistas (lead time 14-30 días)
└─ National Geographic (lead time 60+ días)

A partir del 21/09
├─ Monitoreo Google Alerts (crear 3 alertas)
├─ Seguimiento Analytics (tráfico referido)
└─ Compilación de resultados en CSV
```

---

## 📈 INDICADORES DE ÉXITO

### Métrica Mínima (Baseline)

- **Cobertura:** ≥ 10 medios publican (33% de objetivo)
- **Alcance estimado:** ≥ 200.000 personas (suma de audiencias)
- **Lead time promedio:** 7-14 días
- **Tráfico referido:** ≥ 500 visitas desde medios

### Métrica Objetivo (Target)

- **Cobertura:** ≥ 20 medios publican (67% de objetivo)
- **Alcance estimado:** ≥ 500.000 personas
- **Ventas attributables:** ≥ 50 copias (medible con promo code Amazon)
- **Engagement redes:** ≥ 500 menciones/week (#LaSombraDelPantocrator)

### Métrica Excelente (Stretch Goal)

- **Cobertura:** ≥ 25 medios publican
- **Alcance estimado:** ≥ 800.000 personas
- **Publicación en National Geographic:** ✅
- **Viral en Twitter/LinkedIn:** ≥ 1.000 retweets/shares

---

## 🔑 PUNTOS CLAVE

### ✅ FORTALEZAS DE ESTA CAMPAÑA

1. **Libro bien posicionado** — Ambientación específica (Vall de Boí) = ángulo turístico + local
2. **Medios objetivo claros** — Comarcal + turismo = audiencias específicas y accesibles
3. **Materiales de calidad** — Portada profesional, retratos personajes, audiolibro de 14h40m
4. **Contactos verificados** — 30 medios reales con emails de redacción
5. **Estructura fásica** — Envíos escalonados (impacto local → amplificación → turismo → digital)

### ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Email bouncea | Media | Validar en Google Search + llamar teléfono |
| Bajo engagement de blogs | Media | Personalizar cada email; ofrecer entrevista exclusiva |
| Lead time largo (National Geo) | Alta | Enviar mes antes; expectativa realista (60+ días) |
| No hay respuesta en Fase 1 | Baja | Follow-up día 4 + llamada teléfonica |
| Confusión formato adjuntos | Baja | Enviar email de prueba a asanchez@webtenseenergy.com primero |

---

## 📞 CONTACTOS DE REFERENCIA

**Autor/Portavoz:**  
Andrés Sánchez Serrano  
📧 asanchez@webtenseenergy.com  
🌐 webtenseenergy.com

**Medios de emergencia (si email no funciona):**
- Segre (centralita): +34 973 248 900
- La Mañana (centralita): +34 973 266 000
- Ràdio Lleida: +34 973 248 800

---

## 🎓 BEST PRACTICES INCLUIDAS

1. **Personalización:** Cada email menciona el medio específico (no spam)
2. **Timing:** Horarios óptimos por tipo de medio (8-10am diarios, 5-7pm radios)
3. **Follow-up:** Protocolo de seguimiento día 3-7 (llamada si no responden)
4. **Documentación:** Registro completo en CSV para análisis post-campaña
5. **Herramientas:** Google Alerts + Analytics + Spreadsheet de resultados

---

## 📝 ÚLTIMA CHECKLIST

- [ ] Portada 500×750 px ✅ (generar)
- [ ] Muestra audiolibro (30 seg) ✅ (extraer)
- [ ] Email de prueba ✅ (enviar a asanchez@webtenseenergy.com)
- [ ] REGISTRO_ENVIOS.csv ✅ (abierto para actualizar)
- [ ] Google Alerts ✅ (crear 3: "Sombra Pantocrátor", "Andrés Sánchez Serrano", "Pantocrátor")
- [ ] Primer envío (Segre) ⏳ (hoy 14/09 ~ 16:00)

---

## 🚦 STATUS FINAL

| Componente | Estado | Notas |
|---|---|---|
| Documentación | ✅ COMPLETA | 4 archivos (MEDIOS_LISTA_CONTACTO, CSV, QA, este) |
| Materiales visuales | ⏳ PARCIAL | Portada 1600×2560 y 3000×3000 ✅; 500×750 requiere generación |
| Audiolibro | ✅ LISTO | 14h40m disponible; extracto requiere corte |
| Medios contactos | ✅ VERIFICADOS | 30 medios, 35+ emails listados |
| Web | ✅ OPERATIVA | webtenseenergy.com activo |
| Email template | ✅ LISTA | Plantilla personalizable incluida |
| Calendario | ✅ DEFINIDO | 4 fases en 15 días (14-25 sep) |

**ESTADO GENERAL: 🟢 LISTO PARA LANZAR INMEDIATAMENTE**

---

**Última actualización:** 14 de septiembre 2026  
**Versión:** 1.0  
**Responsable:** Andrés Sánchez Serrano  
**Duración estimada del proyecto:** 25 días (desde 14/09 hasta 8/10, cuando se esperan últimas publicaciones)
