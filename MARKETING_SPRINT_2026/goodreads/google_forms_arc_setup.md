# Google Forms: Solicitud de ARC — "La Sombra del Pantocrátor"

Plantilla para crear un formulario de Google Forms que reciba solicitudes de ARCs.

---

## PASO 1: Crear el formulario

1. Ir a **https://forms.google.com**
2. Hacer clic en **"Crear nuevo formulario"** (icono +)
3. Título: **"Solicita tu ARC — La Sombra del Pantocrátor"**
4. Descripción (opcional):
   ```
   Formulario oficial para solicitar una copia anticipada (ARC) del libro
   "La Sombra del Pantocrátor" antes de su publicación.
   
   Solo 50 copias disponibles. Las solicitudes se procesan en orden de llegada.
   ```

---

## PASO 2: Configurar preguntas

### Pregunta 1: Consentimiento (Multiplechoice — Obligatoria)

**Pregunta:** Acepto que mi nombre pueda ser mencionado públicamente como lector anticipado del libro (opcional, pero apreciado).

**Opciones:**
- ☐ Sí, puedes mencionar mi nombre en redes sociales
- ☐ Prefiero permanecer anónimo
- ☐ Pregúntame cuando publiques la reseña

**Tipo:** Opción múltiple
**Obligatoria:** Sí

---

### Pregunta 2: Nombre Completo (Texto corto — Obligatoria)

**Pregunta:** ¿Cuál es tu nombre completo?

**Ayuda:** Este será el nombre que aparezca en la comunidad de lectores anticipados.

**Tipo:** Respuesta corta
**Obligatoria:** Sí

---

### Pregunta 3: Email (Email — Obligatoria)

**Pregunta:** ¿Cuál es tu email?

**Ayuda:** Aquí te enviaremos el ARC y las notificaciones de seguimiento.

**Tipo:** Email
**Obligatoria:** Sí

---

### Pregunta 4: Usuario de Goodreads (Texto corto — Obligatoria)

**Pregunta:** ¿Cuál es tu usuario/perfil de Goodreads?

**Ayuda:** Lo necesitamos para que puedas dejar tu reseña. Ejemplo: "JuanPérez123"

**Tipo:** Respuesta corta
**Obligatoria:** Sí

---

### Pregunta 5: URL Goodreads (URL — Obligatoria)

**Pregunta:** Link a tu perfil de Goodreads

**Ayuda:** Pega aquí el link completo a tu perfil. Ejemplo: https://www.goodreads.com/user/show/12345678

**Tipo:** URL
**Obligatoria:** Sí

---

### Pregunta 6: Ubicación (Texto corto)

**Pregunta:** ¿De qué país eres?

**Ayuda:** Información demográfica para nuestro seguimiento.

**Tipo:** Respuesta corta
**Obligatoria:** No

---

### Pregunta 7: Razón de Solicitud (Párrafo — Obligatoria)

**Pregunta:** ¿Por qué quieres leer "La Sombra del Pantocrátor"?

**Ayuda:** Cuéntanos qué te atrae del libro. Una o dos frases es suficiente.

**Tipo:** Párrafo
**Obligatoria:** Sí

---

### Pregunta 8: Género Literario Favorito (Opción múltiple — Obligatoria)

**Pregunta:** ¿Cuáles son tus géneros literarios favoritos? (Selecciona todos los que apliquen)

**Opciones:**
- ☐ Thriller/Suspenso
- ☐ Erótica/Romance adulto
- ☐ Ciencia Ficción/Tecnológico
- ☐ Misterio/Crimen
- ☐ Literatura/Literario
- ☐ Aventura
- ☐ Otro (especificar)

**Tipo:** Casillas (múltiple selección)
**Obligatoria:** Sí

---

### Pregunta 9: Formato Preferido (Opción múltiple — Obligatoria)

**Pregunta:** ¿En qué formato prefieres leer?

**Opciones:**
- ◯ EPUB (para e-readers/tablets)
- ◯ Audiolibro (MP3)
- ◯ Ambos

**Tipo:** Opción múltiple
**Obligatoria:** Sí

---

### Pregunta 10: Redes Sociales (Texto corto)

**Pregunta:** ¿Tienes Instagram, Twitter u otra red social?

**Ayuda:** (Opcional) Si dejas esto, podemos etiquetarte cuando publiques tu reseña.

**Tipo:** Respuesta corta
**Obligatoria:** No

---

### Pregunta 11: ¿Has leído antes libros similares? (Párrafo)

**Pregunta:** ¿Qué otros thrillers o libros eróticos literarios te han gustado?

**Ayuda:** (Opcional) Nos ayuda a entender tu perfil como lector.

**Tipo:** Párrafo
**Obligatoria:** No

---

### Pregunta 12: Confirmación Final (Casilla — Obligatoria)

**Pregunta:** Confirmo que:
- He leído la información sobre el ARC
- Me comprometo a dejar una reseña en Goodreads después de leer
- Entiendo que las solicitudes se procesan en orden de llegada

**Tipo:** Casilla de verificación
**Obligatoria:** Sí

---

## PASO 3: Configurar respuesta automática

1. En el formulario, ir a **Configuración** (icono de engranaje)
2. En la pestaña **"General"**, asegurarse de que:
   - ✓ **Mostrar enlace para editar respuesta:** DESACTIVADO
   - ✓ **Mostrar número de respuestas:** DESACTIVADO (privacidad)
   - ✓ **Permitir una sola respuesta por usuario:** ACTIVADO (si quieres evitar duplicados)

3. En la pestaña **"Presentación"**:
   - Activar **"Mostrar un mensaje de confirmación"**
   - Mensaje de confirmación:
     ```
     ¡Gracias por tu solicitud!
     
     Hemos recibido tu solicitud de ARC. 
     Revisaremos todas las solicitudes por orden de llegada.
     
     Recibirás un email de confirmación en los próximos 1-2 días.
     
     Mientras tanto, sigue a la comunidad en redes sociales para updates.
     
     Instagram: @[USUARIO]
     Goodreads: [LINK]
     Web: [LINK]
     ```

---

## PASO 4: Configurar recolección de respuestas

1. En el formulario, ir a **"Respuestas"** (pestaña)
2. Hacer clic en el icono de **hojas de cálculo** (arriba a la derecha)
3. Crear nueva hoja de cálculo con nombre: **"ARC_Solicitudes_LaSombraDelPantocrator"**
4. Esto creará automáticamente una Google Sheet donde se registren todas las respuestas

---

## PASO 5: Sheet de seguimiento (Google Sheets)

Una vez creada la hoja automáticamente, AGREGAR estas columnas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| **Timestamp** | Auto | Marca de tiempo (generada automáticamente) |
| **Nombre** | Texto | Nombre del solicitante |
| **Email** | Email | Email de contacto |
| **Goodreads Usuario** | Texto | Usuario de Goodreads |
| **Goodreads URL** | URL | Link al perfil |
| **País** | Texto | Ubicación geográfica |
| **Razón** | Texto largo | Por qué solicita el ARC |
| **Géneros Favoritos** | Texto | Géneros que le atraen |
| **Formato** | Texto | EPUB, Audiolibro, Ambos |
| **Instagram/Redes** | Texto | Links a redes sociales |
| **Status** | Texto (Dropdown) | PENDIENTE / APROBADO / ENVIADO / RESEÑA PENDIENTE / COMPLETADO |
| **Fecha Aprobación** | Fecha | Cuándo fue aprobada la solicitud |
| **Fecha Envío ARC** | Fecha | Cuándo se envió el ARC |
| **Fecha Reseña** | Fecha | Cuándo dejó reseña |
| **Link Reseña** | URL | Link a la reseña en Goodreads |
| **Calificación** | Número | Estrellas que dio (1-5) |
| **Notas** | Texto | Feedback o notas adicionales |

---

## PASO 6: Obtener link público del formulario

1. En el formulario, hacer clic en **"Enviar"** (botón azul, arriba a la derecha)
2. Elegir el icono de **"Link"**
3. Copiar el link. Ejemplo:
   ```
   https://forms.google.com/u/0/forms/d/e/1FAIpQLSdXXXXXXXXXXXXX/viewform
   ```
4. Este es el link que compartirás por email, redes sociales, etc.

---

## PLANTILLA: EMAIL COMPARTIENDO EL FORMULARIO

### Asunto
```
Solicita tu ARC: Copia anticipada de "La Sombra del Pantocrátor"
```

### Body
```
Hola,

¡Tengo una noticia emocionante! Estoy distribuyendo 50 copias anticipadas (ARCs) 
de mi novela "La Sombra del Pantocrátor" antes de su publicación oficial.

Si quieres ser uno de los primeros en leerla, solicita tu ARC aquí:

👉 [LINK AL FORMULARIO]

Solo tienes que:
1. Completar el formulario (2 minutos)
2. Esperar a que validemos tu solicitud (1-2 días)
3. ¡Recibir tu ARC por email!

Como agradecimiento, solo te pedimos que dejes una reseña honesta en Goodreads.

El link expira el [FECHA], así que no esperes si te interesa.

¿Preguntas? Responde este email.

Gracias,
Andrés
```

---

## PASO 7: Gestión de respuestas (Flujo de trabajo)

### Cuando llegas a 50 solicitudes:
1. Cambiar el formulario a **"No aceptar más respuestas"** (en Configuración)
2. Mensaje: "Hemos recibido todas las solicitudes. Gracias por tu interés."

### Para cada solicitud APROBADA:
1. Cambiar status en Sheet a **"APROBADO"**
2. Copiar email del solicitante
3. Enviar email de confirmación + ARC (ver template más abajo)
4. Cambiar status a **"ENVIADO"**

### Recordatorio para dejar reseña (T+2 semanas):
1. Cambiar status a **"RESEÑA PENDIENTE"**
2. Enviar email de follow-up (ver template)

### Cuando deja reseña:
1. Pegar link de reseña en columna "Link Reseña"
2. Pegar calificación en "Calificación"
3. Cambiar status a **"COMPLETADO"**
4. Agradecer por email

---

## PLANTILLA: EMAIL DE CONFIRMACIÓN DE ARC ENVIADO

### Asunto
```
Tu ARC de "La Sombra del Pantocrátor" está listo
```

### Body
```
¡Hola [nombre]!

Tu solicitud ha sido aprobada. Aquí está tu ARC.

📖 DESCARGAR:

EPUB: [LINK A DESCARGAR]
Audiolibro MP3: [LINK A DESCARGAR]

Una vez descargues los archivos, puedes leer a tu ritmo.

Cuando termines, nos gustaría que dejaras una reseña en Goodreads:
[LINK A GOODREADS DEL LIBRO]

Preguntas? Responde este email.

Gracias de nuevo,
Andrés
```

---

## PLANTILLA: EMAIL DE FOLLOW-UP

### Asunto (T+2 semanas)
```
¿Qué tal va la lectura?
```

### Body
```
Hola [nombre],

Solo quería comprobar cómo va tu lectura de "La Sombra del Pantocrátor".

Sin prisas — algunos lectores lo terminan en una semana, otros se toman más tiempo.

Cuando termines, no olvides dejar tu reseña en Goodreads:
[LINK]

Si tienes alguna pregunta sobre el libro, estoy encantado de ayudarte.

¡Que disfrutes la lectura!

Andrés
```

---

## PLANTILLA: EMAIL AGRADECIMIENTO POR RESEÑA

### Asunto
```
¡Gracias por tu reseña!
```

### Body
```
Hola [nombre],

Acabo de leer tu reseña de "La Sombra del Pantocrátor" y quería darte las gracias.

[COMENTARIO PERSONALIZADO BASADO EN SU RESEÑA]

Tu feedback es invaluable y realmente aprecio el tiempo que tomaste 
para leer y reseñar.

Si compartes la reseña en redes sociales, con gusto la compartiré también.

¡Espero verte leyendo mi próximo libro!

Andrés
```

---

## MÉTRICAS QUE PUEDES SACAR DE LA SHEET

1. **Total solicitudes:** Contar filas completadas
2. **Tasa aprobación:** (Aprobados / Total) %
3. **Géneros más populares:** Contar menciones en "Géneros Favoritos"
4. **Países:** Distribuir por ubicación
5. **Formato preferido:** Contar EPUB vs Audiolibro vs Ambos
6. **Tasa de reseñas:** (Con reseña / Aprobados) %
7. **Rating promedio:** Promedio de columna "Calificación"

**Crear pivot table** (Google Sheets) para visualizar estos datos.

---

## CHECKLIST ANTES DE LANZAR

- [ ] Crear formulario en Google Forms
- [ ] Agregar todas las preguntas listadas arriba
- [ ] Configurar mensaje de confirmación automático
- [ ] Conectar a Google Sheets para respuestas
- [ ] Crear sheet de seguimiento con columnas extras
- [ ] Obtener link público del formulario
- [ ] Probar el formulario (completarlo como usuario)
- [ ] Verificar que las respuestas aparezcan en la sheet
- [ ] Personalizar emails de follow-up con fecha de publicación oficial
- [ ] Preparar links de descarga de EPUB y MP3
- [ ] Comparar límite de 50 respuestas en Configuración (opcional)
- [ ] Compartir link en email, redes sociales e Instagram

