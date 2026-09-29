#!/usr/bin/env bash
# Activa el modo LIVE de Stripe: crea producto+precio+webhook en live,
# y configura Vercel PRODUCTION (deja Preview en modo test a propósito).
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WEB_DIR"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
azul()  { printf '\033[36m%s\033[0m\n' "$*"; }
gris()  { printf '\033[90m%s\033[0m\n' "$*"; }

echo
azul "═══════════════════════════════════════════════════════"
azul "  ACTIVAR MODO LIVE — La Sombra del Pantocrátor"
azul "  (esto empieza a cobrar dinero REAL a partir de ahora)"
azul "═══════════════════════════════════════════════════════"
echo

for cmd in curl jq openssl; do
  command -v "$cmd" >/dev/null 2>&1 || { rojo "✗ Falta '$cmd'"; exit 1; }
done

VT=$(grep -E "^VERCEL_TOKEN=" .env.local 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
if [[ -z "$VT" ]]; then
  rojo "✗ No encuentro VERCEL_TOKEN en .env.local"
  exit 1
fi

gris "La clave se escribe oculta, no se muestra ni queda en el historial."
gris "Sácala de: https://dashboard.stripe.com/apikeys (arriba a la izquierda, cambia a 'Modo de prueba' → OFF, o sea modo LIVE)"
echo
read -rsp "Pega tu STRIPE_SECRET_KEY de modo LIVE (sk_live_...): " SK
echo
echo

if [[ -z "$SK" ]]; then rojo "✗ Vacío."; exit 1; fi
if [[ ! "$SK" =~ ^sk_live_ ]]; then
  rojo "✗ Debe empezar por 'sk_live_'. Recibida: ${SK:0:8}…"
  rojo "  Si es sk_test_, no es esta la clave — esa ya la tenemos."
  exit 1
fi
verde "✓ Clave live recibida (${#SK} chars)"
echo

azul "→ Verificando la cuenta y si ya puede cobrar de verdad…"
ACCOUNT=$(curl -s -u "$SK:" https://api.stripe.com/v1/account)
if echo "$ACCOUNT" | jq -e '.error' >/dev/null 2>&1; then
  rojo "✗ Stripe rechaza la clave: $(echo "$ACCOUNT" | jq -r '.error.message')"
  exit 1
fi
CHARGES_OK=$(echo "$ACCOUNT" | jq -r '.charges_enabled')
PAYOUTS_OK=$(echo "$ACCOUNT" | jq -r '.payouts_enabled')
verde "✓ Cuenta válida (charges_enabled=$CHARGES_OK, payouts_enabled=$PAYOUTS_OK)"
if [[ "$CHARGES_OK" != "true" ]]; then
  rojo "⚠ ATENCIÓN: charges_enabled=false — Stripe todavía no ha activado del todo la cuenta"
  rojo "  para cobros reales (verificación de negocio pendiente en el dashboard)."
  rojo "  Puedo seguir configurando todo, pero los cobros reales fallarán hasta que"
  rojo "  Stripe complete su revisión. Revisa: https://dashboard.stripe.com/account/onboarding"
  echo
  read -rp "¿Continuar de todas formas? [s/N]: " SEGUIR
  [[ "$SEGUIR" =~ ^[sS]$ ]] || { echo "Cancelado."; exit 0; }
fi
echo

azul "→ Buscando si ya existe el producto en modo LIVE…"
EXISTING=$(curl -s -u "$SK:" "https://api.stripe.com/v1/products?active=true&limit=100" \
  | jq -r '.data[] | select(.name | test("Pantocr")) | .id' | head -1)

if [[ -n "$EXISTING" ]]; then
  PRODUCT_ID="$EXISTING"
  verde "  ✓ Ya existe: $PRODUCT_ID — lo reutilizo, no creo uno nuevo"
else
  azul "  No existe todavía, lo creo…"
  PRODUCT=$(curl -s -u "$SK:" https://api.stripe.com/v1/products \
    --data-urlencode "name=La Sombra del Pantocrátor — Ebook + Audiolibro" \
    --data-urlencode "description=EPUB, PDF y audiolibro completo (voz narrada, calidad ACX). Descarga inmediata tras el pago, sin DRM restrictivo — marca de agua personal contra redistribución." \
    -d "metadata[book]=lsp-v3")
  PRODUCT_ID=$(echo "$PRODUCT" | jq -r '.id // empty')
  if [[ -z "$PRODUCT_ID" ]]; then
    rojo "✗ Error creando el producto: $(echo "$PRODUCT" | jq -r '.error.message // .')"
    exit 1
  fi
  verde "  ✓ Producto creado: $PRODUCT_ID"
fi
echo

azul "→ Buscando si ese producto ya tiene un precio de 9,99 € activo…"
EXISTING_PRICE=$(curl -s -u "$SK:" "https://api.stripe.com/v1/prices?product=$PRODUCT_ID&active=true&limit=100" \
  | jq -r '.data[] | select(.unit_amount==999 and .currency=="eur") | .id' | head -1)

if [[ -n "$EXISTING_PRICE" ]]; then
  PRICE_ID="$EXISTING_PRICE"
  verde "  ✓ Ya existe: $PRICE_ID (9,99 €) — lo reutilizo"
else
  azul "  No existe, lo creo…"
  PRICE=$(curl -s -u "$SK:" https://api.stripe.com/v1/prices \
    -d "product=$PRODUCT_ID" -d "unit_amount=999" -d "currency=eur")
  PRICE_ID=$(echo "$PRICE" | jq -r '.id // empty')
  if [[ -z "$PRICE_ID" ]]; then
    rojo "✗ Error creando el precio: $(echo "$PRICE" | jq -r '.error.message // .')"
    exit 1
  fi
  verde "  ✓ Precio creado: $PRICE_ID (9,99 €)"
fi
echo

azul "→ Comprobando webhooks LIVE ya existentes…"
EXISTING_WH=$(curl -s -u "$SK:" "https://api.stripe.com/v1/webhook_endpoints?limit=100" \
  | jq -r '.data[] | select(.url=="https://la-sombra-del-pantocrator.vercel.app/api/webhook") | .id' | head -1)

if [[ -n "$EXISTING_WH" ]]; then
  gris "  Ya existe un webhook ($EXISTING_WH) para esa URL. Stripe solo entrega el"
  gris "  signing secret al crearlo, así que para tenerlo hay que borrar y recrear."
  read -rp "  ¿Borrar el existente y crear uno nuevo? [s/N]: " RECREAR
  if [[ "$RECREAR" =~ ^[sS]$ ]]; then
    curl -s -u "$SK:" -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$EXISTING_WH" >/dev/null
    verde "  ✓ Borrado, creando uno nuevo…"
    EXISTING_WH=""
  else
    rojo "  Necesito el secret para configurar Vercel. Pégalo tú (lo tendrás guardado"
    rojo "  de cuando lo creaste) o deja que lo recree."
    read -rsp "  Signing secret del webhook existente (whsec_...), o vacío para recrear: " WEBHOOK_SECRET
    echo
    if [[ -z "$WEBHOOK_SECRET" ]]; then
      curl -s -u "$SK:" -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$EXISTING_WH" >/dev/null
      EXISTING_WH=""
    else
      WEBHOOK_ID="$EXISTING_WH"
    fi
  fi
fi

if [[ -z "${WEBHOOK_SECRET:-}" ]]; then
  azul "→ Creando webhook en modo LIVE…"
  WEBHOOK=$(curl -s -u "$SK:" https://api.stripe.com/v1/webhook_endpoints \
    -d "url=https://la-sombra-del-pantocrator.vercel.app/api/webhook" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "description=La Sombra del Pantocrator - LIVE - checkout completado")
  WEBHOOK_SECRET=$(echo "$WEBHOOK" | jq -r '.secret // empty')
  WEBHOOK_ID=$(echo "$WEBHOOK" | jq -r '.id // empty')
  if [[ -z "$WEBHOOK_SECRET" ]]; then
    rojo "✗ Error creando el webhook: $(echo "$WEBHOOK" | jq -r '.error.message // .')"
    exit 1
  fi
  verde "  ✓ Webhook creado: $WEBHOOK_ID"
fi
echo

azul "→ Configurando Vercel PRODUCTION con las claves LIVE (Preview queda en TEST)…"
npx --yes vercel env rm STRIPE_SECRET_KEY production --yes --token="$VT" >/dev/null 2>&1 || true
printf '%s' "$SK" | npx --yes vercel env add STRIPE_SECRET_KEY production --token="$VT" >/dev/null 2>&1 \
  && verde "  ✓ STRIPE_SECRET_KEY (live) → Production" || rojo "  ✗ Falló STRIPE_SECRET_KEY"

npx --yes vercel env rm STRIPE_PRICE_ID production --yes --token="$VT" >/dev/null 2>&1 || true
printf '%s' "$PRICE_ID" | npx --yes vercel env add STRIPE_PRICE_ID production --token="$VT" >/dev/null 2>&1 \
  && verde "  ✓ STRIPE_PRICE_ID (live) → Production" || rojo "  ✗ Falló STRIPE_PRICE_ID"

npx --yes vercel env rm STRIPE_WEBHOOK_SECRET production --yes --token="$VT" >/dev/null 2>&1 || true
printf '%s' "$WEBHOOK_SECRET" | npx --yes vercel env add STRIPE_WEBHOOK_SECRET production --token="$VT" >/dev/null 2>&1 \
  && verde "  ✓ STRIPE_WEBHOOK_SECRET (live) → Production" || rojo "  ✗ Falló STRIPE_WEBHOOK_SECRET"
echo

azul "→ Redesplegando producción…"
npx --yes vercel --prod --token="$VT" 2>&1 | grep -E "Aliased|READY|Error" || true
echo

azul "═══════════════════════════════════════════════════════"
verde "  LISTO — modo LIVE activado"
azul "═══════════════════════════════════════════════════════"
echo "  Producto:  $PRODUCT_ID"
echo "  Precio:    $PRICE_ID (9,99 €)"
echo "  Webhook:   $WEBHOOK_ID"
echo
if [[ "$CHARGES_OK" != "true" ]]; then
  rojo "  ⚠ RECUERDA: charges_enabled=false — completa la verificación de Stripe"
  rojo "    antes de anunciar la venta, o los cobros reales fallarán."
fi
gris "  Dile a Claude: 'modo live activado' para la verificación final."
echo
