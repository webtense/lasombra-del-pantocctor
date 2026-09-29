# Guía de Implementación: Campaña de ARCs (Advanced Reader Copies)

Documento de referencia para ejecutar la campaña de distribución de copias anticipadas de "La Sombra del Pantocrátor" a través de Goodreads.

---

## 1. QUÉ ES UN ARC Y POR QUÉ USARLO

### Definición
Un **ARC (Advanced Reader Copy)** es una copia anticipada del libro distribuida **antes de la publicación oficial** a lectores seleccionados, críticos, bloggers o influencers para que escriban reseñas.

### Objetivos principales

| Objetivo | Beneficio |
|----------|-----------|
| **Generar reseñas anticipadas** | Más reseñas en Goodreads/Amazon antes del lanzamiento oficial |
| **Construir buzz/anticipación** | Los lectores comparten en redes sociales |
| **Obtener feedback genuino** | Críticas honestas que mejoran futuras ediciones |
| **Posicionar en rankings** | Más reseñas = mejor posicionamiento en categorías Goodreads |
| **Crear comunidad inicial** | Lectores leal que se convierten en fans |

### Por qué funciona
- Lectores sienten que son "elegidos" (acceso exclusivo)
- No tienen que pagar (incentivo fuerte)
- Puedes pedirles reseña, pero es voluntario
- Goodreads usa reseñas anticipadas en el algoritmo de recomendación

---

## 2. PLATAFORMA: GOODREADS (OPCIONES)

### Opción A: Goodreads Giveaways (Oficial, RECOMENDADO)

**Qué es:**
Programa oficial de Amazon/Goodreads para regalar copias de libros.

**Ventajas:**
✓ Integración nativa con Goodreads
✓ Amazon gestiona el envío (si es ebook)
✓ Los lectores se registran automáticamente
✓ Goodreads promociona el giveaway en su web
✓ Datos de solicitudes (edad, ubicación, género favorito)

**Desventajas:**
✗ Requiere ISBN asignado
✗ Comisión de Amazon (~15%)
✗ Menos control sobre quién recibe copias
✗ No funciona bien con archivos EPUB personalizados

**Cómo usarlo:**
1. Ir a kdp.amazon.com → Goodreads Author Tools
2. Crear "Giveaway"
3. Subir cantidad de copias (50, 100, 200, etc.)
4. Goodreads gestiona solicitudes y sorteo
5. Ganadores reciben aviso automático

---

### Opción B: Email directo a lista de contactos (MÁXIMO CONTROL)

**Qué es:**
Enviar email personalizado a lectores interesados solicitando que se registren.

**Ventajas:**
✓ Control total sobre quién recibe
✓ Puedes personalizar el ARC (marca de agua, metadata)
✓ Relación directa con lector
✓ Datos de respuesta para análisis

**Desventajas:**
✗ Requiere tener lista de contactos (newsletter, redes sociales)
✗ Más trabajo de seguimiento manual
✗ Menor alcance orgánico

**Cómo usarlo:**
1. Crear formulario (Google Forms o Typeform)
2. Compartir link en email/redes
3. Lectores se registran respondiendo
4. Tú validas y envías ARC manualmente
5. Haces seguimiento para reseñas

---

### Opción C: Goodreads Groups + Directamente

**Qué es:**
Publicar oferta en grupos temáticos de Goodreads (thriller, erótica, etc.)

**Ventajas:**
✓ Audiencia ya interesada en tu género
✓ Sin requisitos previos
✓ Bajo coste/esfuerzo

**Desventajas:**
✗ Menor control de quién solicita
✗ Algunos grupos no permiten auto-promoción
✗ Menos visibilidad que Giveaway oficial

**Cómo usarlo:**
1. Encontrar grupos de thriller/erótica en Goodreads
2. Revisar normas del grupo
3. Publicar post con enlace a formulario
4. Usuarios responden y recibes solicitudes

---

## 3. CHECKLIST PRE-CAMPAÑA

### Archivos & Metadatos

- [ ] **EPUB finalizado** — validado y sin errores
  - Ruta: `/home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/01-MANUSCRITO/La_Sombra_del_Pantocctor_REVISION_5.epub`
  - Verificar tabla de contenidos, fuentes, márgenes

- [ ] **MP3 audiolibro** — descargable y verificado
  - Ruta: `/home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/04-AUDIO/distribucion/paquete-final-mp3/`
  - Duración: 14h 40m
  - Formato: ZIP con los 136 MP3 mastered

- [ ] **Portada en alta resolución** — para email y Goodreads
  - Ruta: `/home/asanchez/Documentos/@PERSONAL/Proyectos/Personal/LaSombraDelPantocrator/05-PORTADAS/Buena .jpeg`
  - Mínimo 1200x1600px

- [ ] **Sinopsis corta** (~150 palabras)
  ```
  [COPIAR DE GUÍA KDP O CREAR UNA NUEVA]
  ```

- [ ] **Biografía del autor** (~100-150 palabras)
  ```
  [CREAR SI NO EXISTE]
  ```

- [ ] **Metadata del ARC** — si distribuyes EPUB personalizado
  - Marcar como "versión de prueba" / "ARC"
  - Incluir fecha de publicación oficial
  - Incluir disclaimer de confidencialidad (opcional)

### Datos de Contacto

- [ ] **Email del autor** — público y monitorizable
  - Ej: andres@lasombradelpantocrator.com
  - O usar formulario Google Forms integrado

- [ ] **Goodreads Author Profile** — actualizado y activo
  - https://www.goodreads.com/author/...
  - Bio completa
  - Foto de perfil
  - Enlaces a web/redes

- [ ] **Newsletter/Mailing list** (opcional)
  - Si tienes lista de suscriptores, notificarles

- [ ] **Redes sociales** — preparadas para amplificar
  - Instagram post
  - Twitter/X post
  - TikTok teaser (si aplica)

### Tracking & Base de Datos

- [ ] **Google Sheet para registrar solicitudes**
  - Columnas: Nombre | Email | Goodreads | Fecha solicitud | Formato | Fecha envío | Reseña (sí/no) | Link reseña
  - Compartir solo con vos (privado)

- [ ] **Plantilla de respuesta automática** (si usas email)
  - Confirmar recepción de solicitud
  - Indicar fecha de envío aproximada
  - Instrucciones para leer el ARC

---

## 4. CONFIGURACIÓN TÉCNICA

### Opción A: Usar Goodreads Giveaways (Recomendado)

```
PASO 1: Preparar ISBN
├─ El EPUB debe tener ISBN asignado
├─ Puedes obtener ISBN gratis en KDP
└─ Si no tienes, Amazon te asigna uno automáticamente

PASO 2: Entrar a Goodreads Author Tools
├─ Login en https://www.goodreads.com
├─ Ir a Mis libros > Ediciones del libro
└─ Buscar botón "Crear Giveaway"

PASO 3: Configurar Giveaway
├─ Seleccionar cantidad de copias (50)
├─ Elegir países de distribución (España, mundo, etc.)
├─ Establecer fechas (inicio hoy, fin en 2-3 semanas)
├─ Escrito promocional (usar versión corta del email)
└─ Goodreads enviará notificaciones automáticamente

PASO 4: Monitorear & Recolectar
├─ Goodreads muestra solicitudes en tiempo real
├─ Ganadores se seleccionan automáticamente en la fecha final
├─ Amazon notifica a ganadores
├─ Reseñas aparecen en Goodreads cuando se publican
```

---

### Opción B: Distribución manual por email

```
PASO 1: Crear formulario de solicitud
├─ Ir a https://forms.google.com
├─ Crear formulario con campos:
│  ├─ Nombre completo
│  ├─ Email
│  ├─ Goodreads username
│  └─ "¿Por qué quieres leer este libro?" (texto)
├─ Configurar respuestas automáticas
└─ Obtener link público del formulario

PASO 2: Preparar archivos para compartir
├─ EPUB: Subir a Google Drive > compartir link descargable
├─ MP3: Comprimir ZIP y subir a Drive o Vercel
├─ Alternativa: Enviar via email directo (si <25MB)
└─ Crear carpeta "ARCs_LaSOmbraDelPantocrator" en Drive

PASO 3: Enviar email de invitación
├─ A lista de newsletter (si existe)
├─ A tus seguidores en redes (con link)
├─ A grupos de Goodreads (si es permitido)
└─ Copiar texto de "email_oferta_arc_goodreads.md"

PASO 4: Recopilar solicitudes
├─ Monitorear respuestas de formulario
├─ Registrar en Google Sheet
├─ Validar emails antes de enviar ARC
└─ Enviar ARC en máximo 3-5 días

PASO 5: Hacer seguimiento para reseñas
├─ Email 1: Al enviar ARC ("Gracias por solicitar")
├─ Email 2: A los 2 semanas ("¿Cómo va la lectura?")
├─ Email 3: A 1 mes ("¿Ya dejaste reseña?")
└─ Gracias final cuando dejan reseña
```

---

## 5. TIMELINE SUGERIDO

| Fase | Duración | Acción |
|------|----------|--------|
| **Pre-lanzamiento** | T-6 semanas | Preparar archivos y metadatos |
| **Campaña ARC** | T-5 a T-2 semanas | Aceptar solicitudes (3 semanas aprox.) |
| **Envío de ARCs** | T-2 semanas | Distribuir copias a aceptados |
| **Lectura & Reseñas** | T-1 semana a T | Lectores leen y dejan reseñas |
| **Lanzamiento oficial** | T | Publicar libro oficialmente |
| **Monitoreo post-lanzamiento** | T+1 a T+30 días | Responder reseñas, agradecer a lectores |

---

## 6. TEMPLATE: CONFIRMACIÓN DE ENVÍO

**Asunto:** Tu copia anticipada de "La Sombra del Pantocrátor" está lista

---

Hola [nombre],

¡Enhorabuena! Tu solicitud de ARC fue aceptada.

Adjunto encontrarás dos archivos:

📖 **la-sombra-del-pantocrator-arc.epub**
- Libro completo en formato EPUB
- Compatible con: Kindle, Apple Books, Kobo, tablets, PC/Mac

🎧 **la-sombra-del-pantocrator-audiolibro.zip** (opcional)
- Los 136 segmentos de audio en MP3 (14h 40m)
- Narración profesional en español
- Puedes escuchar mientras lees

**Instrucciones:**

1. Descarga ambos archivos
2. Abre el EPUB en tu lector preferido
3. Lee a tu ritmo (sin fecha límite)
4. Cuando termines, deja una reseña en Goodreads
   - Aquí está el link directo: [LINK A GOODREADS]

**Recordatorio importante:**

Este ARC está marcado como copia de prueba y está destinado solo a ti. La fecha de publicación oficial es [FECHA], y en ese momento el libro estará disponible en todas las plataformas.

Si tienes preguntas mientras lees, no dudes en responder este email. Me encanta recibir feedback.

Gracias por ser parte de la comunidad de lectores anticipados de "La Sombra del Pantocrátor".

Un abrazo,

**Andrés Sánchez Serrano**

---

## 7. SEGUIMIENTO: PLANTILLA EMAIL REMINDER

**Asunto:** ¿Cómo va la lectura?

---

Hola [nombre],

Solo te escribo para comprobar cómo va tu lectura de "La Sombra del Pantocrátor".

Sin prisas — algunos lectores lo devoran en una semana, otros disfrutan tomándose su tiempo.

Cuando termines y dejes tu reseña en Goodreads, agradeceré si me pasas el link. Me encanta leer qué piensan los lectores.

¿Alguna pregunta? Estoy aquí para ayudarte.

Gracias de nuevo,
Andrés

---

## 8. MÉTRICAS A RASTREAR

### KPIs principales

| Métrica | Target | Importancia |
|---------|--------|-------------|
| **Solicitudes recibidas** | 50+ | Alta — indica demanda |
| **Tasa de conversión** | 80%+ aceptados | Alta — calidad de solicitud |
| **Reseñas generadas** | 60%+ de ARCs | Alta — objetivo principal |
| **Rating promedio** | 4+ estrellas | Media — indica calidad |
| **Tráfico web** | +50% durante campaña | Media — visibilidad |
| **Menciones en redes** | 10+ posts | Media — buzz |

### Dónde medir

- **Goodreads:** New reviews, rating promedio, número de ratings
- **Google Analytics:** Tráfico a la web de La Sombra
- **Redes sociales:** Menciones, hashtags, engagement
- **Google Sheet:** Número de solicitudes, tasa de respuesta

---

## 9. ERRORES A EVITAR

| Error | Consecuencia | Cómo evitarlo |
|-------|-------------|--------------|
| Ofrecer ARC pero archivos incompletos | Lectores decepcionados | Verificar EPUB/MP3 antes de enviar |
| No dar seguimiento para reseñas | Pocas reseñas finales | Email reminder a los 2-3 semanas |
| Marcar límite de tiempo muy corto | Solicitudes perdidas | Dejar campaña abierta 3+ semanas |
| Distribuir a demasiadas personas | Calidad de reseñas baja | Limitar a 50-100 copias |
| No responder emails de lectores | Mala experiencia | Monitorear email activamente |
| Pedir reseña positiva (contra políticas) | Amazon/Goodreads penaliza | Aclarar que reseñas honestas son bienvenidas |
| Enviar EPUB con DRM/protección | Lectores no pueden abrir | Distribuir sin DRM |

---

## 10. POST-CAMPAÑA

### Al terminar la fase de reseñas (T+30 días):

- [ ] Recopilar todos los links de reseñas
- [ ] Agradecer públicamente en redes sociales (mencionar lectores si lo desean)
- [ ] Compilar feedback en documento (para próxima edición si aplica)
- [ ] Publicar "ARC Tour" en tu web con fotos de lectores leyendo
- [ ] Usar reseñas en marketing futuro (con permiso del lector)
- [ ] Actualizar memoria del proyecto con resultados

### Documento final de resultados:

```markdown
# Resultados Campaña ARC — La Sombra del Pantocrátor

**Fechas:** [inicio] a [fin]
**Copias ofertadas:** 50
**Solicitudes recibidas:** [número]
**ARCs distribuidos:** [número]
**Reseñas generadas:** [número]
**Rating promedio:** [X.X estrellas]
**Tráfico web +:** [X%]

## Feedback destacado:
- [Quote de reseña positiva]
- [Quote interesante crítica]
- [Learning adquirido]

## Para próxima campaña:
- [Cambio 1]
- [Cambio 2]
```

---

## RECURSOS FINALES

- **Goodreads Author Tools:** https://www.goodreads.com/author
- **KDP Giveaways:** https://kdp.amazon.com/en/help/topic/G2XHKHD5PQP4
- **Google Forms:** https://forms.google.com
- **Email templates:** Ver "email_oferta_arc_goodreads.md"

---

**Próximos pasos:**
1. Elegir Opción A (Goodreads Giveaways) o B (Manual)
2. Completar checklist pre-campaña
3. Preparar emails y formulario
4. Lanzar campaña (recomendado 4-5 semanas antes de publicación oficial)
5. Monitorear y dar seguimiento
6. Documentar resultados en memoria del proyecto

