#!/usr/bin/env bash
# Genera libro.mobi y libro.azw3 a partir del EPUB master, usando Calibre
# (ebook-convert). Esto NO se puede automatizar en el pipeline web/CI: Calibre
# no está instalado en el entorno de build de Vercel/CI, así que se ejecuta
# en local una vez (o cada vez que cambie el EPUB master) y los ficheros
# resultantes se comitan junto al resto de app/api/download/_data/.
#
# Requisitos:
#   - Calibre instalado (aporta el binario `ebook-convert`).
#     Ubuntu/Debian: sudo apt install calibre
#     macOS:         brew install --cask calibre
#     Web:           https://calibre-ebook.com/download
#
# Uso:
#   cd 02-WEB
#   ./scripts/convert-ebooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/../app/api/download/_data"
EPUB_SRC="$DATA_DIR/libro.epub"

if ! command -v ebook-convert >/dev/null 2>&1; then
  echo "ERROR: no se encuentra 'ebook-convert' (Calibre) en el PATH." >&2
  echo "Instala Calibre y vuelve a ejecutar este script." >&2
  exit 1
fi

if [ ! -f "$EPUB_SRC" ]; then
  echo "ERROR: no existe $EPUB_SRC — copia antes el EPUB master." >&2
  exit 1
fi

echo "Generando libro.mobi..."
ebook-convert "$EPUB_SRC" "$DATA_DIR/libro.mobi" \
  --output-profile kindle \
  --mobi-file-type both

echo "Generando libro.azw3..."
ebook-convert "$EPUB_SRC" "$DATA_DIR/libro.azw3" \
  --output-profile kindle

echo "Listo:"
ls -la "$DATA_DIR"/libro.mobi "$DATA_DIR"/libro.azw3
