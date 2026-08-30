#!/bin/bash
# Sube los 136 MP3 del audiolibro al VPS para servirlos desde la web.
# Uso: bash scripts/upload_audiobook.sh

VPS_USER="asanchez"
VPS_HOST="217.154.188.166"
VPS_DIR="/var/www/lsp-audiobook"
LOCAL_DIR="$(dirname "$0")/../../../../../DEFINITIVO/PAQUETE_FINAL_PUB/AUDIOBOOK/chapters_mastered/"

echo "Subiendo audiolibro a $VPS_HOST:$VPS_DIR ..."
echo ""

# Crear directorio en el VPS si no existe
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_DIR"

# Sincronizar archivos MP3
rsync -avz --progress \
  --include="*.mp3" \
  --exclude="*" \
  "$LOCAL_DIR" \
  "$VPS_USER@$VPS_HOST:$VPS_DIR/"

echo ""
echo "Listo. Ahora configura nginx (ver abajo) y añade en Vercel:"
echo "  NEXT_PUBLIC_AUDIO_BASE_URL=https://tu-dominio.com/lsp-audiobook"
