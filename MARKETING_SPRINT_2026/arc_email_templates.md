# Plantillas de Email para ARCs
## La Sombra del Pantocrátor

**Proyecto:** ARCs (Advance Reader Copies)  
**Plataforma:** Brevo  
**Creado:** 14/09/2026  
**Versión:** 1.0

---

## 📧 PLANTILLA 1: CONFIRMACIÓN DE SOLICITUD
**Nombre en Brevo:** `ARC_Confirmacion`  
**Trigger:** Respuesta en Google Form (automático)  
**Destinatarios:** {{EMAIL}} (del form)

---

### Asunto
```
¡Tu solicitud de ARC de La Sombra del Pantocrátor ha sido recibida! 📖
```

### Preheader
```
Revisaremos tu perfil en los próximos días...
```

### HTML Body

```html
<html>
<body style="font-family: 'Roboto', Arial, sans-serif; background-color: #f5f5f5; color: #333;">

  <!-- Encabezado -->
  <table width="100%" style="background: linear-gradient(135deg, #2d4b91 0%, #800080 100%); padding: 40px 0; text-align: center;">
    <tr>
      <td>
        <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: bold;">
          ¡Enhorabuena! 🎉
        </h1>
        <p style="color: #fff; font-size: 16px; margin: 10px 0 0 0;">
          Tu solicitud de ARC ha sido recibida
        </p>
      </td>
    </tr>
  </table>

  <!-- Contenido -->
  <table width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">

        <!-- Saludo -->
        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hola <strong>{{NOMBRE}}</strong>,
        </p>

        <!-- Mensaje principal -->
        <p style="font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
          Gracias por tu interés en formar parte del programa de Advance Reader Copies (ARCs) de <strong>"La Sombra del Pantocrátor"</strong>.
        </p>

        <p style="font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
          ✅ <strong>Hemos recibido tu solicitud</strong> y la revisaremos cuidadosamente.
        </p>

        <!-- Información del libro -->
        <div style="background: #f0f4f8; border-left: 4px solid #2d4b91; padding: 15px; margin: 20px 0;">
          <p style="font-size: 14px; margin: 0 0 10px 0;">
            <strong>Sobre el libro:</strong>
          </p>
          <ul style="font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>📖 <strong>135.916 palabras</strong> | 136 capítulos</li>
            <li>⏱️ <strong>Audiolibro:</strong> 14h 40m (voz profesional)</li>
            <li>✨ <strong>Géneros:</strong> Fantasía épica, Drama, Paranormal</li>
            <li>🎯 <strong>Público:</strong> Lectores 18+</li>
          </ul>
        </div>

        <!-- Próximos pasos -->
        <p style="font-size: 15px; line-height: 1.8; margin: 20px 0;">
          <strong>📋 Próximos pasos:</strong>
        </p>
        <ol style="font-size: 14px; line-height: 2; margin: 0 0 20px 0;">
          <li><strong>Revisión (2-3 días)</strong> — Analizaremos tu perfil</li>
          <li><strong>Aprobación</strong> — Te contactaremos para confirmar</li>
          <li><strong>Descarga</strong> — Recibirás tu ARC (PDF/ePub)</li>
          <li><strong>Lectura (4 semanas)</strong> — Tiempo para leer el libro</li>
          <li><strong>Reseña</strong> — Deja tu opinión en Amazon & Goodreads</li>
        </ol>

        <!-- Compromiso -->
        <div style="background: #fffacd; border: 1px solid #daa520; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="font-size: 14px; margin: 0;">
            <strong>📌 Recordatorio:</strong> Como parte del programa, te comprometiste a:
          </p>
          <ul style="font-size: 13px; line-height: 1.8; margin: 10px 0 0 0; padding-left: 20px;">
            <li>✅ Leer en 4 semanas</li>
            <li>✅ Dejar reseña en Amazon</li>
            <li>✅ Dejar reseña en Goodreads</li>
          </ul>
        </div>

        <!-- Preguntas -->
        <p style="font-size: 15px; line-height: 1.8; margin: 20px 0;">
          ¿Tienes preguntas? Responde a este email y te ayudaremos encantado.
        </p>

        <!-- CTA -->
        <p style="font-size: 15px; line-height: 1.8; margin: 20px 0 30px 0;">
          Mientras tanto, puedes:
        </p>
        <table width="100%" style="margin: 20px 0;">
          <tr>
            <td style="text-align: center; padding: 10px;">
              <a href="https://webtenseenergy.com" style="background: #2d4b91; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                🌐 Visita nuestra web
              </a>
            </td>
            <td style="text-align: center; padding: 10px;">
              <a href="https://www.goodreads.com/search?q=sombra+pantocrator" style="background: #800080; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                📚 Goodreads
              </a>
            </td>
          </tr>
        </table>

        <!-- Cierre -->
        <p style="font-size: 15px; line-height: 1.8; margin: 20px 0 0 0; color: #666;">
          Gracias por tu entusiasmo y apoyo.
        </p>

      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" style="background: #2d4b91; color: #fff; padding: 30px 20px; text-align: center;">
    <tr>
      <td>
        <p style="font-size: 13px; margin: 0;">
          <strong>La Sombra del Pantocrátor</strong> | Andrés Sánchez Serrano
        </p>
        <p style="font-size: 12px; margin: 5px 0 0 0;">
          <a href="https://webtenseenergy.com" style="color: #fff; text-decoration: none;">webtenseenergy.com</a> • 
          <a href="https://instagram.com/webtenseenergy" style="color: #fff; text-decoration: none;">Instagram</a> • 
          <a href="https://linkedin.com/in/asanchez" style="color: #fff; text-decoration: none;">LinkedIn</a>
        </p>
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 📧 PLANTILLA 2: APROBACIÓN + ENLACE DESCARGA
**Nombre en Brevo:** `ARC_Aprobado`  
**Trigger:** Manual (después de revisar y aprobar en Sheet)  
**Destinatarios:** {{EMAIL}}

---

### Asunto
```
🎁 ¡Tu ARC de La Sombra del Pantocrátor está listo! Descárgalo aquí
```

### Preheader
```
Tu copia gratuita te espera...
```

### HTML Body

```html
<html>
<body style="font-family: 'Roboto', Arial, sans-serif; background-color: #f5f5f5; color: #333;">

  <!-- Encabezado -->
  <table width="100%" style="background: linear-gradient(135deg, #2d4b91 0%, #800080 100%); padding: 40px 0; text-align: center;">
    <tr>
      <td>
        <h1 style="color: #fff; font-size: 28px; margin: 0;">
          🎉 ¡Aprobado!
        </h1>
        <p style="color: #fff; font-size: 16px; margin: 10px 0 0 0;">
          Tu ARC está listo para descargar
        </p>
      </td>
    </tr>
  </table>

  <!-- Contenido -->
  <table width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">

        <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Hola <strong>{{NOMBRE}}</strong>,
        </p>

        <p style="font-size: 15px; line-height: 1.8; margin: 0 0 20px 0;">
          ¡Excelente noticia! Tu solicitud ha sido <strong>aprobada</strong> y tu copia ARC de <strong>"La Sombra del Pantocrátor"</strong> ya está disponible para descargar.
        </p>

        <!-- CTA Principal -->
        <table width="100%" style="margin: 30px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="{{DOWNLOAD_LINK}}" style="background: linear-gradient(135deg, #2d4b91 0%, #800080 100%); color: #fff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                📥 DESCARGAR MI ARC ({{FORMAT}})
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; text-align: center; color: #999; margin: 0 0 20px 0;">
          El enlace expirará en 30 días
        </p>

        <!-- Información del archivo -->
        <div style="background: #f0f4f8; border-left: 4px solid #2d4b91; padding: 15px; margin: 20px 0;">
          <p style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">
            📄 Tu descarga:
          </p>
          <ul style="font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Formato:</strong> {{FORMAT}} (PDF / ePub)</li>
            <li><strong>Tamaño:</strong> ~15-20 MB</li>
            <li><strong>Calidad:</strong> Texto completo, versión final pre-lanzamiento</li>
            <li><strong>Válido hasta:</strong> 30 días</li>
          </ul>
        </div>

        <!-- Timeline y compromisos -->
        <p style="font-size: 15px; font-weight: bold; margin: 20px 0 10px 0;">
          ⏰ Tu cronograma:
        </p>
        <table width="100%" style="font-size: 14px; border-collapse: collapse;">
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Hoy</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">Descargar tu ARC</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Próxima semana</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">Empezar a leer</td>
          </tr>
          <tr style="background: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Semana 4</strong></td>
            <td style="border: 1px solid #ddd; padding: 10px;">Dejar reseña en Amazon & Goodreads</td>
          </tr>
        </table>

        <!-- Instrucciones de reseña -->
        <div style="background: #fffacd; border: 1px solid #daa520; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">
            📝 Instrucciones para dejar tu reseña:
          </p>
          <ol style="font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li><strong>Termina de leer</strong> (tienes 4 semanas)</li>
            <li><strong>Abre tu cuenta en Amazon:</strong> <a href="https://www.amazon.es" style="color: #2d4b91;">amazon.es</a></li>
            <li><strong>Busca el libro:</strong> "La Sombra del Pantocrátor"</li>
            <li><strong>Deja tu reseña honesta</strong> (mínimo 50 palabras)</li>
            <li><strong>Repite en Goodreads:</strong> <a href="https://www.goodreads.com" style="color: #2d4b91;">goodreads.com</a></li>
          </ol>
        </div>

        <!-- Bonificación -->
        <p style="font-size: 15px; line-height: 1.8; margin: 20px 0;">
          <strong>🎁 Bonus:</strong> Si compartes tu reseña con nosotros (responde a este email), podrías ser destacado en nuestras redes sociales.
        </p>

        <!-- Problemas técnicos -->
        <p style="font-size: 14px; margin: 20px 0; color: #666;">
          ¿Problemas para descargar? El enlace puede tardar un momento en activarse. Si el problema persiste, responde a este email.
        </p>

      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" style="background: #2d4b91; color: #fff; padding: 30px 20px; text-align: center;">
    <tr>
      <td>
        <p style="font-size: 13px; margin: 0;">
          <strong>La Sombra del Pantocrátor</strong> | Andrés Sánchez Serrano
        </p>
        <p style="font-size: 12px; margin: 5px 0 0 0;">
          <a href="https://webtenseenergy.com" style="color: #fff; text-decoration: none;">webtenseenergy.com</a>
        </p>
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## 📧 PLANTILLA 3: RECORDATORIO SEMANA 2
**Nombre en Brevo:** `ARC_Recordatorio_Semana2`  
**Trigger:** 14 días después de aprobación (programado)  
**Destinatarios:** {{EMAIL}}

---

### Asunto
```
¿Cómo va la lectura de La Sombra del Pantocrátor? 📚
```

### HTML Body (Versión simplificada)

```
Hola {{NOMBRE}},

¿Cómo va la lectura de "La Sombra del Pantocrátor"?

Te escribo para recordarte que ya han pasado 2 semanas desde tu descarga.
Esto significa que tienes otras 2 semanas para terminar de leer.

📊 Tu progreso:
- Tiempo restante: 2 semanas
- Próximo paso: Dejar reseña en Amazon & Goodreads

Si tienes algún problema con el archivo o la lectura, responde a este email.

¡Sigue leyendo!

— Andrés Sánchez Serrano
Autor, La Sombra del Pantocrátor
webtenseenergy.com
```

---

## 📧 PLANTILLA 4: SOLICITUD DE RESEÑA (SEMANA 4)
**Nombre en Brevo:** `ARC_Recordatorio_Semana4_Reseña`  
**Trigger:** 28 días después de aprobación (programado)  
**Destinatarios:** {{EMAIL}}

---

### Asunto
```
¡Cuéntanos qué te pareció La Sombra del Pantocrátor! 🌟
```

### HTML Body

```html
Hola {{NOMBRE}},

Esperamos que hayas terminado de leer "La Sombra del Pantocrátor" 
y que hayas disfrutado de la experiencia.

🌟 ¿Nos dejas tu reseña?

Tu opinión es muy importante. Los lectores confían en las reseñas 
honestas para decidir qué leer, así que tu feedback es valiosísimo.

📍 Deja tu reseña en:

▶ Amazon (4-5 min)
https://www.amazon.es/s?k=sombra+pantocrator

▶ Goodreads (5-10 min)
https://www.goodreads.com/search?q=sombra+pantocrator

No importa la puntuación (⭐ hasta ⭐⭐⭐⭐⭐) — 
queremos tu opinión honesta.

📧 Bonus: Si compartes el link de tu reseña con nosotros, 
la retuiteamos y te mencionamos en nuestras redes.

Gracias por ser parte de esta aventura.

— Andrés Sánchez Serrano
Autor, La Sombra del Pantocrátor
webtenseenergy.com
```

---

## 📧 PLANTILLA 5: AGRADECIMIENTO
**Nombre en Brevo:** `ARC_Agradecimiento`  
**Trigger:** Manual (después de verificar reseña)  
**Destinatarios:** {{EMAIL}}

---

### Asunto
```
¡Gracias por tu reseña de La Sombra del Pantocrátor! 🙏
```

### HTML Body

```html
Hola {{NOMBRE}},

Acabo de leer tu reseña en {{PLATAFORMA}} y quería agradecerte personalmente.

{{RESEÑA_RESUMEN}}

Tu apoyo significa el mundo para mí. Cada reseña, cada comentario, 
cada compartir nos ayuda a llegar a más lectores.

He retuiteado tu reseña en nuestras redes para que otros la vean.

Si en el futuro publico algo nuevo, ¿te gustaría ser de los primeros en enterarse?

Un millón de gracias.

— Andrés Sánchez Serrano
Autor, La Sombra del Pantocrátor
webtenseenergy.com
```

---

## 🔧 GUÍA DE IMPLEMENTACIÓN EN BREVO

### Pasos para cada plantilla:

1. **Acceder a Brevo**
   - Email Marketing → Campaigns → Create a template (o Edit existing)

2. **Copiar HTML**
   - Pestaña "HTML"
   - Pegar contenido HTML completo

3. **Variables dinámicas**
   - `{{NOMBRE}}` → contacto.first_name
   - `{{EMAIL}}` → contacto.email
   - `{{DOWNLOAD_LINK}}` → custom attribute
   - `{{FORMAT}}` → custom attribute
   - `{{PLATAFORMA}}` → custom attribute (Amazon o Goodreads)
   - `{{RESEÑA_RESUMEN}}` → custom field (copiar fragmento de reseña)

4. **Probar**
   - Enviar prueba a asanchez@viajesparati.com
   - Verificar display en Outlook, Gmail, móvil

5. **Guardar como Template**
   - Campaigns > Templates > Save
   - Nombre: tal cual está en "Nombre en Brevo" arriba

---

## 📅 CRONOGRAMA DE ENVÍOS

| Día | Evento | Template | Trigger |
|-----|--------|----------|---------|
| D+0 | Solicitud recibida | ARC_Confirmacion | Automático (Google Form) |
| D+2 | Aprobación | ARC_Aprobado | Manual (después de revisar) |
| D+14 | Recordatorio lectura | ARC_Recordatorio_Semana2 | Automático (Schedule) |
| D+28 | Solicitar reseña | ARC_Recordatorio_Semana4_Reseña | Automático (Schedule) |
| D+35+ | Agradecimiento | ARC_Agradecimiento | Manual (si deja reseña) |

---

## ✅ CHECKLIST IMPLEMENTACIÓN

- [ ] Copiar plantillas HTML arriba
- [ ] Crear 5 templates en Brevo (nombres exactos)
- [ ] Configurar variables dinámicas para cada template
- [ ] Probar envío a tu email
- [ ] Vincular templates a automation en Zapier/n8n (opcional)
- [ ] Verificar deliverability en Gmail spam folder
- [ ] Documentar en ARC_IMPLEMENTATION_GUIDE.md

---

**Versión:** 1.0  
**Última actualización:** 14/09/2026
