# Plan de Implementación — Campaña ARC
## La Sombra del Pantocrátor | 14/09/2026

**Estado:** ✅ LISTO PARA EJECUTAR  
**Responsable:** Andrés Sánchez Serrano  
**Fecha lanzamiento:** 5-6 semanas ANTES de publicación oficial

---

## 📋 RESUMEN EJECUTIVO

**Objetivo:** Distribuir 50 copias anticipadas del libro a lectores seleccionados a cambio de reseñas en Goodreads/Amazon antes del lanzamiento oficial.

**Estrategia recomendada:** Goodreads Giveaways (Opción A)  
**Alternativa backup:** Google Forms + Email directo (Opción B)

**Timeline:**
- **HOY (14/09):** Preparar materiales
- **Próxima semana:** Lanzar campaña
- **5-6 semanas después:** Ganadores reciben ARC
- **4 semanas de lectura:** Período para leer
- **Semana 10:** Recolectar reseñas

---

## 🎯 OPCIÓN A: GOODREADS GIVEAWAYS (RECOMENDADO)

### Ventajas
✅ Integración nativa con Goodreads  
✅ Goodreads promociona automáticamente  
✅ Datos detallados de solicitantes  
✅ Sorteo automatizado  
✅ Máxima visibilidad

### Requisitos
- Cuenta Amazon/KDP activa
- ISBN asignado (o usar ISBN temporal)
- Archivo EPUB validado
- Portada en alta resolución

### Pasos a ejecutar

#### 1. Preparar archivos (📋 Checklist)
- [ ] Verificar EPUB: `/01-MANUSCRITO/La_Sombra_del_Pantocctor_REVISION_5.epub`
- [ ] Validar MP3 audiolibro: `/04-AUDIO/distribucion/paquete-final-mp3/`
  - Crear ZIP: `La_Sombra_del_Pantocrator_audiobook.zip` (136 MP3)
- [ ] Portada en 1600×2560px: `/05-PORTADAS/kdp/portada_definitiva_v2_kdp_1600x2560.jpg`
- [ ] Crear versión ebook para Giveaway (PDF o EPUB)

#### 2. Acceder a KDP Goodreads Author Tools
```
URL: https://kdp.amazon.com/en_US/bookshelf
→ Seleccionar "La Sombra del Pantocrátor"
→ Pestaña "Goodreads Author Tools"
→ Botón "Create a Giveaway"
```

#### 3. Configurar Giveaway
```
Campo                    Valor
─────────────────────────────────
Título                   La Sombra del Pantocrátor
Cantidad de copias       50
Formato                  Ebook + Print (si aplica)
Duración                 30 días
Fecha inicio             [Seleccionar en KDP]
Descripción              Ver abajo
```

#### 4. Escribir descripción del Giveaway
```
---INICIO---
¡Gana una copia anticipada de "La Sombra del Pantocrátor"!

La novela completa (ebook + audiolibro de 14h 40m) está 
disponible para 50 lectores seleccionados antes de su 
publicación oficial.

BRUNO MARTÍ es un periodista que llega a la Vall de Boí 
siguiendo una nota imposible. Lo que empieza como una 
historia para publicar se convierte en una carrera contra 
una red de vigilancia —el Pantocrátor— que parece estar 
siempre un paso por delante.

135.916 palabras. 136 capítulos. Thriller tecnológico + 
erótica literaria.

✨ LOS GANADORES RECIBEN:
• Copia EPUB del libro completo
• Audiolibro MP3 (14h 40m, voz profesional)
• Acceso a contenido exclusivo (making-of, entrevistas)

📝 COMPROMISO:
• Leer en 4 semanas
• Dejar reseña honesta en Goodreads
• Compartir en redes sociales (opcional)

No es necesario una reseña positiva — solo honesta.

---FIN---
```

#### 5. Enviar & Monitorear
- [ ] Confirmar Giveaway en Goodreads
- [ ] Copiar link a sitio web / redes sociales
- [ ] Monitorear solicitudes diariamente
- [ ] Registrar datos en Sheets: `arc_seguimiento_goodreads.csv`

---

## 🔄 OPCIÓN B: GOOGLE FORMS + EMAIL DIRECTO (BACKUP)

Si prefieres máximo control sin Goodreads Giveaways.

### Pasos a ejecutar

#### 1. Crear Google Form
**Archivo de referencia:** `google_forms_arc_setup.md` (en este directorio)

**Preguntas a incluir:**
```
1. Nombre completo *
2. Email *
3. Perfil Goodreads (URL) *
4. ¿Por qué te gustaría leer este libro? *
5. Géneros favoritos (multi-selección) *
6. Formato preferido (EPUB / PDF / Audiolibro MP3)
7. País/Región *
8. ¿Has dejado reseñas en Goodreads? (sí/no)
9. Redes sociales (Instagram, Twitter, TikTok)
10. ¿Tienes experiencia con reseñas de libros?
11. ¿Aceptas los términos y condiciones?
12. Comentarios adicionales
```

**Link del form:**  
→ Crear en: https://forms.google.com/  
→ Nombre: "ARC Solicitud — La Sombra del Pantocrátor"  
→ Respuesta automática: Enviar email de confirmación

#### 2. Crear Google Sheet de seguimiento
**Columnas:**
```
A: Timestamp
B: Nombre
C: Email
D: Goodreads ID
E: Razón de interés
F: Géneros favoritos
G: Formato preferido
H: País
I: Status (Solicitado/Aprobado/ARC Enviado/Reseña Pendiente/Completado)
J: Fecha envío ARC
K: Link Goodreads reseña
L: Calificación ⭐
M: Notas internas
N: Fecha recordatorio
O: Follow-up completado
```

#### 3. Enviar invitación
**Plantilla email (versión casual):**
```
Asunto: ¿Quieres leer "La Sombra del Pantocrátor" ANTES de su lanzamiento? 📖

Hola [Nombre],

Estoy preparando el lanzamiento de mi primer libro, "La Sombra del Pantocrátor" 
(135.916 palabras, 136 capítulos, 14h 40m de audiolibro).

Busco 50 LECTORES ADELANTADOS que quieran:
✓ Leer el libro GRATIS (ebook + audiolibro)
✓ Dar su opinión honesta
✓ Dejar una reseña en Goodreads/Amazon

No tienes que escribir un ensayo — dos párrafos bastan. Y la reseña puede ser 
1 estrella o 5 estrellas, lo importante es que sea honesta.

Si te interesa, rellena este FORMULARIO (2 min):
[LINK A GOOGLE FORM]

Selecciono a 50 personas basándome en diversidad de géneros favoritos y perfil 
de lectores reseñadores en Goodreads.

¿Te animas?

Un saludo,
Andrés Sánchez Serrano
Autor, La Sombra del Pantocrátor
https://webtenseenergy.com
```

#### 4. Revisar solicitudes
**Criterios de selección:**
- ✅ Email válido y Goodreads ID verificable
- ✅ Perfil de lector activo (tiene reseñas previas)
- ✅ Género coincide (thriller, erótica, paranormal)
- ✅ Diversidad geográfica

**No aprobar si:**
- ❌ Email sospechoso o incompleto
- ❌ Perfil Goodreads sin reseñas previas
- ❌ Solicitud automatizada o spam

#### 5. Enviar ARC
**Plantilla de aprobación:**
```
Asunto: 🎁 ¡Aprobado! Tu ARC de La Sombra del Pantocrátor está listo

Hola [Nombre],

¡Enhorabuena! Tu solicitud ha sido aprobada.

Descarga tu copia aquí:
📥 EPUB: [LINK DRIVE O VERCEL]
🎧 Audiolibro (ZIP): [LINK DRIVE O VERCEL]

El enlace expira en 30 días. Tienes 4 semanas para leer.

Cuando termines, por favor deja tu reseña en:
📚 Goodreads: https://www.goodreads.com/search?q=sombra+pantocrator
📖 Amazon: https://amazon.es/s?k=sombra+pantocractor

¿Preguntas? Responde a este email.

¡Espero que disfrutes el libro!

— Andrés
```

---

## 📊 SEGUIMIENTO & MÉTRICAS

### Indicadores a registrar

| Métrica | Dónde | Frecuencia |
|---------|-------|-----------|
| Solicitudes totales | Goodreads Giveaway / Google Forms | Diario |
| Solicitudes aprobadas | Google Sheet | Manual |
| ARCs enviados | Google Sheet | Al enviar |
| Reseñas completadas | Google Sheet + Goodreads/Amazon | Semanal |
| Calificación promedio | Google Sheet | Semanal |
| Tasa de reseña | (Reseñas / ARCs enviados) × 100 | Semanal |

### Dashboard de resultados

```
Semana 1: Solicitudes llegan
Semana 2-3: Fase aprobación y envío
Semana 4-5: Lectura
Semana 6-7: Reseñas empiezan a llegar
Semana 8+: Análisis y documentación
```

---

## 📧 PLANTILLAS DE EMAIL (PARA AMBAS OPCIONES)

### Email 1: CONFIRMACIÓN DE SOLICITUD
```
Asunto: ¡Tu solicitud ha sido recibida! 📖

Hola {{NOMBRE}},

Gracias por tu interés en ser parte del programa ARC de 
"La Sombra del Pantocrátor".

Tu solicitud ha sido recibida y la revisaremos en los 
próximos 2-3 días.

Mientras tanto, puedes:
• Ver la portada: [WEB]
• Leer los primeros capítulos: [WEB]
• Seguir en Instagram: @webtenseenergy

Te escribiremos pronto.

— Andrés
```

### Email 2: RECORDATORIO (Semana 2 de lectura)
```
Asunto: ¿Cómo va la lectura? 📚

Hola {{NOMBRE}},

¿Qué tal va "La Sombra del Pantocrátor"? Ya has estado 
leyendo 2 semanas, así que te quedan 2 más.

Si tienes dudas o problemas con el archivo, responde 
a este email.

Nos vemos en Goodreads 📖

— Andrés
```

### Email 3: SOLICITUD DE RESEÑA (Semana 4)
```
Asunto: ¡Cuéntanos qué te pareció! ⭐

Hola {{NOMBRE}},

¿Ya terminaste "La Sombra del Pantocrátor"?

Tu opinión es muy valiosa. Por favor, deja una reseña:

📚 Goodreads: https://www.goodreads.com/...
📖 Amazon: https://amazon.es/...

No importa si 1 ⭐ o 5 ⭐ — queremos tu opinión honesta.

Bonus: Si compartes el link de tu reseña con nosotros,
la destacamos en nuestras redes 📱

¡Gracias!

— Andrés
```

---

## ✅ CHECKLIST FINAL

### Antes de lanzar
- [ ] Archivos validados (EPUB, MP3, Portada)
- [ ] Formulario Google creado (si Opción B)
- [ ] Plantillas email personalizadas
- [ ] Google Sheet de seguimiento configurada
- [ ] Drive/Vercel preparados para descargas
- [ ] Goodreads Giveaway configurado (si Opción A)
- [ ] Redes sociales listas para publicar link

### Durante la campaña (Semana 1-2)
- [ ] Promocionar en Twitter/Instagram
- [ ] Enviar email a newsletter (si tienes)
- [ ] Publicar en Goodreads Groups
- [ ] Monitorear solicitudes
- [ ] Responder preguntas

### Fase aprobación (Semana 3)
- [ ] Revisar solicitudes
- [ ] Aprobar 50 mejores candidatos
- [ ] Enviar ARCs
- [ ] Registrar en Google Sheet

### Seguimiento (Semana 4-7)
- [ ] Email recordatorio Semana 2
- [ ] Recopilar reseñas
- [ ] Email agradecimiento cuando reseña llega
- [ ] Compartir en redes sociales

### Post-campaña (Semana 8+)
- [ ] Compilar resultados finales
- [ ] Analizar feedback
- [ ] Documentar aprendizajes
- [ ] Preparar reportaje (blog post, email)

---

## 📞 CONTACTOS Y RECURSOS

**Goodreads Author Program:**  
https://www.goodreads.com/author/register

**Amazon KDP Giveaways:**  
https://kdp.amazon.com/en_US/bookshelf

**Google Forms:**  
https://forms.google.com

**Drive Compartir:**  
https://drive.google.com (EBOOK + AUDIOLIBRO)

---

## 🎯 PRÓXIMOS PASOS

1. **HOY:** Elegir Opción A (Goodreads Giveaways) o Opción B (Google Forms)
2. **Mañana:** Preparar archivos (EPUB, MP3, Portada)
3. **Día 3:** Crear Giveaway / Google Form
4. **Día 4:** Publicar en redes sociales
5. **Semana 2:** Monitorear y aprobar solicitantes
6. **Semana 3+:** Enviar ARCs y hacer seguimiento

---

**Documento:** Plan de Implementación ARC — La Sombra del Pantocrátor  
**Creado:** 14/09/2026  
**Estado:** ✅ LISTO PARA USAR  
**Última actualización:** 14/09/2026, 14:15 CET
