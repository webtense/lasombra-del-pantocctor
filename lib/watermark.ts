// Marca de agua dinámica aplicada en el momento de la descarga (no se
// pre-generan ficheros por comprador: se parte del master en
// app/api/download/_data/ y se estampa el email + sesión de Stripe al vuelo).
//
// PDF y EPUB llevan watermark (visible + metadata invisible). MOBI/AZW3 NO
// llevan watermark: son formatos binarios propietarios de Amazon sin una
// librería fiable en JS puro para parchearlos sin arriesgar corromper el
// fichero — se sirven tal cual desde el master.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import JSZip from 'jszip'

export type WatermarkInfo = {
  email: string
  sessionId: string
}

// ─────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────
export async function watermarkPdf(pdfBytes: Uint8Array, info: WatermarkInfo): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Metadata invisible: no se ve al leer el PDF, pero identifica la copia
  // si alguna vez circula fuera de quien la compró.
  const stamp = `La Sombra del Pantocrátor · copia personal · ${info.email} · sesión ${info.sessionId} · ${new Date().toISOString()}`
  pdfDoc.setSubject(stamp)
  pdfDoc.setKeywords([`email:${info.email}`, `session:${info.sessionId}`])
  pdfDoc.setProducer('La Sombra del Pantocrátor')

  // Pie de página visible en cada hoja.
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const footerText = `Copia personal de ${info.email} — no distribuir`
  const fontSize = 7

  for (const page of pdfDoc.getPages()) {
    const { width } = page.getSize()
    const textWidth = font.widthOfTextAtSize(footerText, fontSize)
    page.drawText(footerText, {
      x: Math.max(18, (width - textWidth) / 2),
      y: 16,
      size: fontSize,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: 0.85,
    })
  }

  return pdfDoc.save()
}

// ─────────────────────────────────────────────
// EPUB
// ─────────────────────────────────────────────
function extractOpfPath(containerXml: string): string | null {
  const match = containerXml.match(/full-path="([^"]+)"/)
  return match ? match[1] : null
}

function isContentDocument(path: string): boolean {
  const lower = path.toLowerCase()
  if (!/\.(xhtml|html|htm)$/.test(lower)) return false
  // Evitamos tocar nav/toc/portada: son documentos con estructura sensible
  // (el nav en particular debe conservar exactamente su semántica EPUB3).
  if (/nav|toc|cover|title/.test(lower)) return false
  return true
}

export async function watermarkEpub(epubBytes: Buffer, info: WatermarkInfo): Promise<Buffer> {
  const zip = await JSZip.loadAsync(epubBytes)

  // 1) Localizar el .opf a través de META-INF/container.xml
  const containerFile = zip.file('META-INF/container.xml')
  const containerXml = containerFile ? await containerFile.async('string') : ''
  const opfPath = extractOpfPath(containerXml)

  const watermarkComment =
    `<!-- watermark: email=${info.email} session=${info.sessionId} ts=${new Date().toISOString()} -->`

  // 2) Insertar metadata invisible en el .opf (custom <meta>, ignorado por
  // lectores que no lo conocen; no rompe la validez del paquete).
  if (opfPath) {
    const opfFile = zip.file(opfPath)
    if (opfFile) {
      let opfXml = await opfFile.async('string')
      const metaTag =
        `<meta name="watermark" content="email:${info.email};session:${info.sessionId}"/>\n`
      if (opfXml.includes('</metadata>')) {
        opfXml = opfXml.replace('</metadata>', `${metaTag}</metadata>`)
      } else {
        opfXml = `${watermarkComment}\n${opfXml}`
      }
      zip.file(opfPath, opfXml)
    }
  }

  // 3) Pie de página visible en cada documento de contenido (capítulos),
  // excluyendo nav/toc/portada.
  const footerHtml =
    `<div style="margin-top:2em;padding-top:0.8em;border-top:1px solid #ccc;` +
    `font-size:0.65em;color:#999;text-align:center;">` +
    `Copia personal de ${info.email} — no distribuir</div>`

  const entries = Object.keys(zip.files).filter((path) => isContentDocument(path) && !zip.files[path].dir)

  for (const path of entries) {
    const file = zip.file(path)
    if (!file) continue
    let html = await file.async('string')
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${footerHtml}</body>`)
    } else {
      html = `${html}\n${watermarkComment}`
    }
    zip.file(path, html)
  }

  // 4) El mimetype debe ir primero y SIN comprimir (requisito del formato
  // EPUB) — lo reafirmamos explícitamente al volver a generar el zip.
  const mimetypeFile = zip.file('mimetype')
  if (mimetypeFile) {
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return buffer
}
