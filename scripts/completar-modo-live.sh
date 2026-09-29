#!/usr/bin/env bash
# Termina lo que dejo a medias activar-modo-live.sh: borra el webhook LIVE que
# se quedo sin guardar su secret en Vercel, crea uno nuevo y lo guarda bien.
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WEB_DIR"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
azul()  { printf '\033[36m%s\033[0m\n' "$*"; }
gris()  { printf '\033[90m%s\033[0m\n' "$*"; }

VT=$(grep -E "^VERCEL_TOKEN=" .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d "\"'")

echo
azul "==========================================================="
azul "  Completar modo LIVE - webhook + Vercel"
azul "==========================================================="
echo

read -rsp "Pega otra vez tu STRIPE_SECRET_KEY de modo LIVE (sk_live_...): " SK
echo
echo
if [[ ! "$SK" =~ ^sk_live_ ]]; then rojo "Debe ser sk_live_"; exit 1; fi
verde "Clave recibida"

azul "-> Guardando en .env.local como STRIPE_SECRET_KEY_LIVE (no toca la de test)..."
if grep -q "^STRIPE_SECRET_KEY_LIVE=" .env.local 2>/dev/null; then
  grep -v "^STRIPE_SECRET_KEY_LIVE=" .env.local > .env.local.tmp && mv .env.local.tmp .env.local
fi
printf 'STRIPE_SECRET_KEY_LIVE=%s\n' "$SK" >> .env.local
chmod 600 .env.local
verde "  Guardada (permisos 600, fuera de git)"
echo

azul "-> Borrando el webhook LIVE anterior (we_1UDetV2ddqfPG4aoIFlNoVEC)..."
curl -s -u "$SK:" -X DELETE "https://api.stripe.com/v1/webhook_endpoints/we_1UDetV2ddqfPG4aoIFlNoVEC" | jq -c "."

azul "-> Creando webhook LIVE nuevo..."
WEBHOOK=$(curl -s -u "$SK:" https://api.stripe.com/v1/webhook_endpoints \
  -d "url=https://la-sombra-del-pantocrator.vercel.app/api/webhook" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "description=La Sombra del Pantocrator - LIVE (v2)")
WEBHOOK_SECRET=$(echo "$WEBHOOK" | jq -r ".secret // empty")
WEBHOOK_ID=$(echo "$WEBHOOK" | jq -r ".id // empty")
if [[ -z "$WEBHOOK_SECRET" ]]; then
  rojo "Error: $(echo "$WEBHOOK" | jq -r ".error.message // .")"
  exit 1
fi
verde "  Webhook: $WEBHOOK_ID"
echo

azul "-> Guardando en Vercel Production (con timeout, esta vez con mas margen)..."
timeout 60 npx --yes vercel env rm STRIPE_WEBHOOK_SECRET production --yes --token="$VT" 2>&1 | tail -3

printf '%s' "$WEBHOOK_SECRET" > /tmp/whsec_live.txt
timeout 60 npx --yes vercel env add STRIPE_WEBHOOK_SECRET production --token="$VT" < /tmp/whsec_live.txt 2>&1 | tail -5
rm -f /tmp/whsec_live.txt

echo
azul "-> Verificando..."
timeout 30 npx --yes vercel env ls production --token="$VT" 2>&1 | grep -i "STRIPE_WEBHOOK"

echo
azul "-> Redesplegando..."
timeout 120 npx --yes vercel --prod --token="$VT" 2>&1 | grep -E "Aliased|READY|Error"

echo
verde "LISTO. Dile a Claude: modo live activado"
