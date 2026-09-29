# ARCs para "La Sombra del Pantocrátor"
## Guía Paso a Paso - Google Form + Sheet

**Creado:** 14/09/2026  
**Objetivo:** Distribuir Advance Reader Copies (ARCs) vía Goodreads  
**Estado:** 🟡 Listos para implementar (hecho: Sheet + Especificación, falta: Form)

---

## 📋 ARCHIVOS GENERADOS

| Archivo | Tipo | Ubicación | Estado |
|---------|------|-----------|--------|
| ARCs - La Sombra del Pantocrátor (Goodreads) | Google Sheet | Google Drive | ✅ Creado |
| ESPECIFICACIÓN - Google Form + Sheet para ARCs | Google Doc | Google Drive | ✅ Creado |
| ARC_IMPLEMENTATION_GUIDE.md | Local | Este archivo | ✅ Creado |

---

## 🚀 PASO A PASO: CREAR GOOGLE FORM

### 1. Crear el formulario base
```
1. Ir a forms.google.com
2. Hacer clic en "Crear formulario vacío"
3. Nombre: "Solicita tu copia ARC - La Sombra del Pantocrátor"
4. Descripción: [Ver abajo, sección "Descripción del Form"]
5. Tema: Elegir color azul/morado (línea con libro)
6. Hacer clic en Configuración (rueda arriba a la derecha)
```

### 2. Configuración de respuestas (Respuestas)
```
Pestaña: "Respuestas"
├─ Destino: "Seleccionar "Crear una nueva hoja de cálculo"
├─ Nombre: "ARCs - La Sombra del Pantocrátor (Goodreads)"
└─ ✅ Esto vinculará las respuestas al Sheet ya creado
   (O abrir el Sheet y hacer Edit → Link to Form)
```

### 3. Configuración de notificaciones (Configuración)
```
Pestaña: "Configuración"
├─ Responder: Mostrar confirmación personalizada
│  └─ Texto: "¡Enhorabuena! Tu solicitud ha sido recibida."
├─ Cambiar a cuestionario: NO
├─ Permitir vista previa: SÍ
└─ Recopilar direcciones de email: SÍ
```

### 4. Configuración de notificaciones por email (Respuestas > Más)
```
Haz clic en los tres puntos (⋮) > "Obtener respuesta por email"
├─ Email: asanchez@viajesparati.com
├─ Notificación: Para cada respuesta
└─ Salvar
```

---

## 📝 CONTENIDO DEL FORM

### Descripción principal
```
¿Quieres leer antes de tiempo "La Sombra del Pantocrátor"?

Únete a nuestro programa de Advance Reader Copies (ARCs) 
y recibe una copia gratuita del eBook.

A cambio, nos encantaría que dejaras tu reseña 
en Amazon y Goodreads.

⏱️ Audiolibro: 14h 40m | 136 capítulos | 135.916 palabras
📖 Formato: PDF (ePub disponible bajo petición)
🎯 Compromisos: Leer en 4 semanas + 1 reseña honesta

Autor: Andrés Sánchez Serrano
Web: webtenseenergy.com
```

---

## ❓ CAMPOS DEL FORM (Crear en este orden)

### SECCIÓN 1: DATOS PERSONALES

**Campo 1: Nombre completo**
- Tipo: Texto corto
- Requerido: ✅ SÍ
- Descripción: -

**Campo 2: Email**
- Tipo: Email
- Requerido: ✅ SÍ
- Descripción: Te enviaremos tu ARC aquí

**Campo 3: País / Región**
- Tipo: Lista desplegable
- Requerido: ✅ SÍ
- Opciones:
  ```
  España
  Latinoamérica
  Europa (excluida España)
  Otros
  ```
- Descripción: Esto nos ayuda a entender nuestra audiencia

**Campo 4: Teléfono (opcional)**
- Tipo: Texto corto
- Requerido: ❌ NO
- Descripción: (Opcional) Formato: +34 XXXXXXXXX

---

### SECCIÓN 2: PERFIL DE LECTOR

**Campo 5: ¿Cuál es tu edad?**
- Tipo: Lista desplegable
- Requerido: ✅ SÍ
- Opciones:
  ```
  13-17
  18-25
  26-35
  36-45
  46-55
  56-65
  65+
  ```

**Campo 6: Géneros favoritos**
- Tipo: Casillas (Checkboxes)
- Requerido: ✅ SÍ (al menos 1)
- Opciones:
  ```
  ☐ Fantasía épica
  ☐ Paranormal/Sobrenatural
  ☐ Aventura
  ☐ Drama
  ☐ Romántica
  ☐ Misterio/Thriller
  ☐ Ciencia ficción
  ☐ Otros
  ```

**Campo 7: ¿Tienes presencia en redes sociales?**
- Tipo: Opción múltiple (Radio buttons)
- Requerido: ❌ NO
- Opciones:
  ```
  ○ Sí
  ○ No
  ○ Prefiero no decir
  ```
- [OPCIONAL] Si eliges "Sí" → ir a siguiente:

**Campo 8: ¿Cuáles son tus redes sociales?** *(Mostrar solo si anterior = Sí)*
- Tipo: Texto corto
- Requerido: ❌ NO (aunque está condicionado)
- Descripción: (Opcional) Ej: @miusuario (Instagram, TikTok, YouTube)

**Campo 9: Perfil de Goodreads**
- Tipo: Texto corto (URL)
- Requerido: ❌ NO
- Descripción: (Opcional) Tu URL de Goodreads si la tienes

---

### SECCIÓN 3: COMPROMISO CON EL ARC

**Campo 10: Prometo leer el libro en 4 semanas**
- Tipo: Opción múltiple
- Requerido: ✅ SÍ
- Opciones:
  ```
  ○ Sí, me comprometo
  ○ No puedo comprometer
  ```

**Campo 11: Prometo dejar reseña en Amazon**
- Tipo: Opción múltiple
- Requerido: ✅ SÍ
- Opciones:
  ```
  ○ Sí, dejaré reseña
  ○ No puedo prometer
  ```

**Campo 12: Prometo dejar reseña en Goodreads**
- Tipo: Opción múltiple
- Requerido: ✅ SÍ
- Opciones:
  ```
  ○ Sí, dejaré reseña
  ○ No puedo prometer
  ```

**Campo 13: Autorizas el uso de tu reseña en marketing**
- Tipo: Casilla (checkbox)
- Requerido: ❌ NO
- Descripción: Podemos usar tu reseña (con crédito) en web/redes

---

### SECCIÓN 4: FORMATO Y PREFERENCIAS

**Campo 14: Formato preferido para tu ARC**
- Tipo: Opción múltiple
- Requerido: ✅ SÍ
- Opciones:
  ```
  ○ PDF (recomendado para lectores de pantalla)
  ○ ePub (para Kindle, Apple Books)
  ○ Ambos (tengo espacio)
  ```

**Campo 15: ¿Cómo prefieres leer?**
- Tipo: Opción múltiple
- Requerido: ❌ NO
- Opciones:
  ```
  ○ En pantalla (ebook reader, tablet, móvil)
  ○ En papel (impresión)
  ○ Audiolibro (si está disponible)
  ○ No importa
  ```

---

### SECCIÓN 5: COMENTARIOS FINALES

**Campo 16: Algo más que quieras contarnos**
- Tipo: Párrafo (Texto largo)
- Requerido: ❌ NO
- Descripción: (Opcional) Cuéntanos si tienes blog, podcast, comunidad de lectores, etc.

---

## 🔗 VINCULAR FORM A SHEET

**Opción 1: Desde el Form**
```
1. Abrir el Form
2. Pestaña "Respuestas"
3. Hacer clic en "Link to Sheets" (icono de hoja)
4. Seleccionar: "Usar hoja de cálculo existente"
5. Seleccionar: "ARCs - La Sombra del Pantocrátor (Goodreads)"
6. ✅ Aceptar
```

**Opción 2: Desde el Sheet**
```
1. Abrir Sheet: ARCs - La Sombra del Pantocrátor (Goodreads)
2. Menu > "Tools" > "Create a form"
3. Seleccionar pestaña "📋 Solicitudes Pendientes"
4. Google creará automáticamente el Form vinculado
```

---

## 📧 CONFIGURAR RESPUESTA AUTOMÁTICA

**En Google Forms: Configuración > Confirmación personalizada**

```
Asunto: [NO SE PUEDE PERSONALIZAR EN FORM, pero puedes en Brevo]

Mensaje de confirmación:
"¡Enhorabuena! Tu solicitud de ARC ha sido recibida.

Revisaremos tu perfil y te contactaremos en 2-3 días 
con los detalles de tu descarga.

Mientras tanto:
👉 Síguenos en redes: @webtenseenergy
👉 Visita nuestra web: webtenseenergy.com

Gracias por tu interés en "La Sombra del Pantocrátor".

— Andrés Sánchez Serrano, Autor"
```

---

## 🎨 ESTILO Y TEMA

```
Pestaña "Diseño" > Personalizar tema
├─ Color principal: Azul oscuro (RGB: 45, 75, 145)
├─ Color secundario: Púrpura (RGB: 128, 0, 128)
├─ Fuente: Roboto o Arial
├─ Imagen de portada: /05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg
│  (Recortar a 1600x400 para el header del Form)
└─ Alineación: Centro
```

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] Google Sheet creado: "ARCs - La Sombra del Pantocrátor (Goodreads)"
- [ ] Google Form creado y vinculado al Sheet
- [ ] Todos los 16 campos agregados en el orden especificado
- [ ] Configuración de respuestas vinculada al Sheet
- [ ] Respuesta de confirmación personalizada
- [ ] Notificaciones por email activadas (a asanchez@viajesparati.com)
- [ ] Tema visual aplicado (portada + colores)
- [ ] Prueba: Completar el Form como solicitante
- [ ] Verificar que la respuesta aparezca en Sheet
- [ ] Verificar email de confirmación recibido
- [ ] Publicar enlace en:
  - [ ] Web: webtenseenergy.com
  - [ ] Instagram Stories (link)
  - [ ] LinkedIn (post)
  - [ ] Email Brevo a "La Sombra del Pantocrátor" (compradores + testers)

---

## 📲 COMPARTIR EL FORM

**Obtener el enlace público:**
```
1. Abrir el Form
2. Arriba a la derecha: Icono de "Enviar" (Paper Plane)
3. Copiar el enlace público (https://forms.gle/XXXXXX)
4. Acortar con bit.ly o goo.gl si lo prefieres
```

**Ejemplo de CTA:**
```
🎁 ¿Quieres leer antes de tiempo "La Sombra del Pantocrátor"?
Solicita tu copia ARC: [ENLACE_AQUI]

⏰ 4 semanas para leer + 1 reseña honesta = ¡copia gratuita!
Abierto a lectores de todo el mundo 🌍

👉 Solicitar ARC: [ENLACE_AQUI]
```

---

## 🔄 AUTOMATIZACIÓN (OPCIONAL)

Para automatizar el envío de ARC y recordatorios, usa:

- **Zapier**: Form → Email personalizado → Brevo
- **Make (ex-Integromat)**: Form → Dropbox → Email
- **n8n**: (selfhosted) Form → Webhook → Tu sistema

Ejemplo Zapier:
```
1. Trigger: New response in Google Form
2. Action 1: Add to list in Brevo "ARC Aprobados"
3. Action 2: Send email from template con link ARC
4. Action 3: Schedule email reminder en D+14
```

---

## 📊 KPIs A MEDIR

| KPI | Objetivo | Fórmula |
|-----|----------|---------|
| Solicitudes totales | 100-200 | COUNTA(Sheet!A:A) - 1 |
| Tasa aprobación | 70-80% | Aprobados / Total |
| Reseñas Amazon | >50 | COUNTIF(Sheet!T:T, "<>") |
| Reseñas Goodreads | >50 | COUNTIF(Sheet!U:U, "<>") |
| Rating promedio | 4.0+ | AVERAGE(ratings) |
| Conversión a ventas | +10 | Usar código descuento único |

---

## 📝 PRÓXIMOS PASOS

1. **Hoy (14/09)**: 
   - [ ] Crear Google Form siguiendo pasos arriba
   - [ ] Vincular al Sheet
   - [ ] Probar con respuesta de prueba

2. **Mañana (15/09)**:
   - [ ] Preparar archivos ARC (PDF, ePub)
   - [ ] Cargar a Google Drive (acceso restringido)
   - [ ] Configurar plantillas de email en Brevo

3. **Esta semana (16-18/09)**:
   - [ ] Publicar enlace en web + redes
   - [ ] Email Brevo anunciando programa ARC
   - [ ] Monitorear primeras solicitudes

4. **Semana próxima (21-28/09)**:
   - [ ] Revisar y aprobar solicitudes
   - [ ] Enviar ARCs a aprobados
   - [ ] Configurar recordatorios automáticos

---

## 📞 CONTACTO / PREGUNTAS

Si necesitas ayuda:
- Documentación completa: ESPECIFICACIÓN - Google Form + Sheet para ARCs (Google Drive)
- Datos del libro: contexto_proyecto.md
- Email para contacto: asanchez@viajesparati.com

---

**Generado:** 14/09/2026  
**Versión:** 1.0  
**Estado:** Listo para ejecutar ✅
