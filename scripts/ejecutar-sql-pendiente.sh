#!/usr/bin/env bash
# Ejecuta SQL_FIXES_PENDIENTE_EJECUTAR.sql en Supabase vía la Management API,
# usando un Personal Access Token que se pide por consola (oculto, nunca se
# imprime ni se guarda en disco).
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$WEB_DIR/SQL_FIXES_PENDIENTE_EJECUTAR.sql"
PROJECT_REF="pllmguryaubhnynubfpk"
API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
azul()  { printf '\033[36m%s\033[0m\n' "$*"; }
gris()  { printf '\033[90m%s\033[0m\n' "$*"; }

echo
azul "═══════════════════════════════════════════════════════"
azul "  Ejecutar SQL pendiente en Supabase — La Sombra del Pantocrátor"
azul "═══════════════════════════════════════════════════════"
echo

for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    rojo "✗ Falta '$cmd'. Instálalo con: sudo apt install $cmd"
    exit 1
  fi
done

if [[ ! -f "$SQL_FILE" ]]; then
  rojo "✗ No encuentro $SQL_FILE"
  exit 1
fi
verde "✓ Fichero SQL encontrado ($(wc -l < "$SQL_FILE") líneas)"
echo

gris "El token se escribe oculto y no se muestra en pantalla ni queda en el historial."
gris "Sácalo de: https://supabase.com/dashboard/account/tokens"
gris "(fine-grained, restringido a este proyecto, permiso 'database_write' si te deja elegir)"
echo
read -rsp "Pega tu Personal Access Token de Supabase (sbp_...): " PAT
echo
echo

if [[ -z "$PAT" ]]; then
  rojo "✗ No has introducido nada."
  exit 1
fi

azul "→ Ejecutando el SQL contra el proyecto ${PROJECT_REF}…"

# Empaquetar el fichero SQL como JSON de forma segura (sin romper comillas/saltos de línea)
PAYLOAD=$(jq -Rs '{query: .}' < "$SQL_FILE")

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  verde "✓ SQL ejecutado correctamente (HTTP $HTTP_CODE)"
else
  rojo "✗ Error ejecutando el SQL (HTTP $HTTP_CODE)"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi

echo
azul "→ Verificando que las funciones y la tabla existen…"

SUPA_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(grep -E "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$WEB_DIR/.env.local" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')

if [[ -z "$ANON_KEY" ]]; then
  gris "  (no se encontró NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local, salto la verificación)"
else
  check() {
    local nombre="$1" resp
    resp=$(curl -s -X POST "$SUPA_URL/rest/v1/rpc/$nombre" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
      -H "Content-Type: application/json" -H "Content-Profile: public" \
      -d '{}')
    if echo "$resp" | grep -q "PGRST202"; then
      rojo "  ✗ $nombre — NO existe"
      return 1
    else
      verde "  ✓ $nombre — existe"
      return 0
    fi
  }

  TABLA_EVENTS=$(curl -s "$SUPA_URL/rest/v1/events?select=id&limit=1" \
    -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
    -H "Accept-Profile: public")
  if echo "$TABLA_EVENTS" | grep -q "PGRST205"; then
    rojo "  ✗ tabla events — NO existe"
  else
    verde "  ✓ tabla events — existe"
  fi
fi

echo
azul "═══════════════════════════════════════════════════════"
verde "  LISTO"
azul "═══════════════════════════════════════════════════════"
echo
gris "  Revoca el token ahora que ya no hace falta:"
gris "  https://supabase.com/dashboard/account/tokens"
echo
gris "  Cuando termines, dile a Claude: 'SQL ejecutado'"
echo
