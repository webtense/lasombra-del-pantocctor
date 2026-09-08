#!/usr/bin/env bash
# Configura el webhook de Stripe (test mode) y guarda las claves localmente.
# Las claves se piden por consola (ocultas) y NUNCA se muestran en pantalla.
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$WEB_DIR/.env.local"
WEBHOOK_URL="https://la-sombra-del-pantocrator.vercel.app/api/webhook"
EVENTO="checkout.session.completed"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
azul()  { printf '\033[36m%s\033[0m\n' "$*"; }
gris()  { printf '\033[90m%s\033[0m\n' "$*"; }

echo
azul "═══════════════════════════════════════════════════════"
azul "  Configurar webhook de Stripe — La Sombra del Pantocrátor"
azul "═══════════════════════════════════════════════════════"
echo

# ---------- Dependencias ----------
for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    rojo "✗ Falta '$cmd'. Instálalo con:  sudo apt install $cmd"
    exit 1
  fi
done

# ---------- Pedir la clave secreta ----------
gris "La clave se escribe oculta y no se mostrará en pantalla ni en el historial."
gris "Está en: https://dashboard.stripe.com/test/apikeys  →  'Clave secreta' → Revelar"
echo
read -rsp "Pega tu STRIPE_SECRET_KEY (sk_test_...): " SK
echo
echo

if [[ -z "$SK" ]]; then
  rojo "✗ No has introducido nada."
  exit 1
fi
if [[ ! "$SK" =~ ^sk_test_ ]]; then
  rojo "✗ La clave debe empezar por 'sk_test_' (modo test)."
  rojo "  Recibida una que empieza por: ${SK:0:8}…"
  rojo "  No uses la clave 'live' aquí."
  exit 1
fi

verde "✓ Clave de test válida (${#SK} caracteres)"
echo

# ---------- Comprobar que la clave funciona ----------
azul "→ Verificando la clave contra la API de Stripe…"
CUENTA=$(curl -s -u "$SK:" https://api.stripe.com/v1/balance)
if echo "$CUENTA" | jq -e '.error' >/dev/null 2>&1; then
  rojo "✗ Stripe rechaza la clave:"
  echo "$CUENTA" | jq -r '.error.message'
  exit 1
fi
verde "✓ La clave funciona"
echo

# ---------- Buscar webhook existente ----------
azul "→ Buscando webhooks ya configurados…"
LISTA=$(curl -s -u "$SK:" "https://api.stripe.com/v1/webhook_endpoints?limit=100")
EXISTENTE_ID=$(echo "$LISTA" | jq -r --arg u "$WEBHOOK_URL" '.data[] | select(.url==$u) | .id' | head -1)

WHSEC=""

if [[ -n "$EXISTENTE_ID" ]]; then
  echo
  gris "Ya existe un webhook para esa URL (id: $EXISTENTE_ID)."
  gris "Stripe solo entrega el signing secret en el momento de crearlo,"
  gris "así que para obtenerlo hay que borrar el actual y crear uno nuevo."
  echo
  read -rp "¿Borrar el existente y crear uno nuevo? [s/N]: " CONFIRMA
  if [[ "$CONFIRMA" =~ ^[sS]$ ]]; then
    azul "→ Borrando el webhook anterior…"
    curl -s -u "$SK:" -X DELETE "https://api.stripe.com/v1/webhook_endpoints/$EXISTENTE_ID" >/dev/null
    verde "✓ Borrado"
    EXISTENTE_ID=""
  else
    echo
    gris "Vale. Entonces pega tú el signing secret del webhook existente."
    gris "Está en: https://dashboard.stripe.com/test/webhooks/$EXISTENTE_ID"
    echo
    read -rsp "Pega el signing secret (whsec_...): " WHSEC
    echo
    if [[ ! "$WHSEC" =~ ^whsec_ ]]; then
      rojo "✗ Debe empezar por 'whsec_'."
      exit 1
    fi
  fi
fi

# ---------- Crear el webhook si hace falta ----------
if [[ -z "$WHSEC" ]]; then
  azul "→ Creando el webhook en Stripe…"
  gris "   URL:    $WEBHOOK_URL"
  gris "   Evento: $EVENTO"
  RESP=$(curl -s -u "$SK:" https://api.stripe.com/v1/webhook_endpoints \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]=$EVENTO" \
    -d "description=La Sombra del Pantocrator - checkout completado")

  if echo "$RESP" | jq -e '.error' >/dev/null 2>&1; then
    rojo "✗ Stripe devolvió un error:"
    echo "$RESP" | jq -r '.error.message'
    exit 1
  fi

  WHSEC=$(echo "$RESP" | jq -r '.secret')
  WH_ID=$(echo "$RESP" | jq -r '.id')

  if [[ -z "$WHSEC" || "$WHSEC" == "null" ]]; then
    rojo "✗ Stripe no devolvió el signing secret. Respuesta completa:"
    echo "$RESP" | jq .
    exit 1
  fi
  verde "✓ Webhook creado (id: $WH_ID)"
fi

echo
verde "✓ Signing secret obtenido: ${WHSEC:0:11}…[oculto]"
echo

# ---------- Guardar en .env.local ----------
azul "→ Guardando en .env.local…"
touch "$ENV_FILE"
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%s)"

guardar_var() {
  local clave="$1" valor="$2"
  if grep -qE "^${clave}=" "$ENV_FILE" 2>/dev/null; then
    grep -vE "^${clave}=" "$ENV_FILE" > "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
  fi
  printf '%s=%s\n' "$clave" "$valor" >> "$ENV_FILE"
}

guardar_var "STRIPE_SECRET_KEY"     "$SK"
guardar_var "STRIPE_WEBHOOK_SECRET" "$WHSEC"
chmod 600 "$ENV_FILE"
verde "✓ Guardadas en $ENV_FILE (permisos 600, ignorado por git)"
echo

# ---------- Configurar en Vercel ----------
azul "→ Configurando STRIPE_WEBHOOK_SECRET en Vercel (production)…"
if command -v vercel >/dev/null 2>&1; then
  VERCEL_CMD="vercel"
elif command -v npx >/dev/null 2>&1; then
  VERCEL_CMD="npx --yes vercel"
  gris "   (usando npx, el CLI no está instalado globalmente)"
else
  VERCEL_CMD=""
fi

VERCEL_OK=0
if [[ -n "$VERCEL_CMD" ]]; then
  cd "$WEB_DIR"
  $VERCEL_CMD env rm STRIPE_WEBHOOK_SECRET production --yes >/dev/null 2>&1 || true
  if printf '%s' "$WHSEC" | $VERCEL_CMD env add STRIPE_WEBHOOK_SECRET production >/dev/null 2>&1; then
    verde "✓ Configurada en Vercel"
    VERCEL_OK=1
  else
    rojo "✗ No se pudo configurar automáticamente (¿falta autenticación?)"
  fi
else
  rojo "✗ No hay CLI de Vercel ni npx disponibles"
fi
echo

# ---------- Resumen ----------
azul "═══════════════════════════════════════════════════════"
verde "  LISTO"
azul "═══════════════════════════════════════════════════════"
echo
echo "  Webhook:  $WEBHOOK_URL"
echo "  Evento:   $EVENTO"
echo "  Secret:   ${WHSEC:0:11}…[guardado, no se muestra]"
echo
if [[ "${VERCEL_OK:-0}" == "1" ]]; then
  echo "  Falta un redeploy para que Vercel use la nueva variable:"
  echo "      cd \"$WEB_DIR\" && ${VERCEL_CMD:-npx vercel} --prod"
else
  echo "  Configúralo a mano en Vercel:"
  echo "      Settings → Environment Variables → Production"
  echo "      Nombre: STRIPE_WEBHOOK_SECRET"
  echo "      Valor:  (está en $ENV_FILE)"
fi
echo
gris "  Cuando termines, dile a Claude: 'webhook configurado'"
echo
