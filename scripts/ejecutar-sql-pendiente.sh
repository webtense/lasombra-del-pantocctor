#!/usr/bin/env bash
# Ejecuta uno o varios ficheros SQL en Supabase vía la Management API,
# usando un Personal Access Token que se pide por consola (oculto, nunca se
# imprime ni se guarda en disco).
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_REF="pllmguryaubhnynubfpk"
API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query"

# Ficheros a ejecutar, EN ESTE ORDEN (el base primero: audit/analytics
# referencian tablas que crea supabase-schema.sql).
SQL_FILES=(
  "$WEB_DIR/supabase-schema.sql"
  "$WEB_DIR/supabase-schema-audit.sql"
  "$WEB_DIR/supabase-schema-analytics.sql"
)
# Permite pasar ficheros distintos por argumento: ./script.sh fichero1.sql fichero2.sql
if [[ $# -gt 0 ]]; then
  SQL_FILES=("$@")
fi

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

for f in "${SQL_FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    rojo "✗ No encuentro $f"
    exit 1
  fi
done
verde "✓ ${#SQL_FILES[@]} ficheros SQL encontrados:"
for f in "${SQL_FILES[@]}"; do
  gris "    - $(basename "$f") ($(wc -l < "$f") líneas)"
done
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

for f in "${SQL_FILES[@]}"; do
  azul "→ Ejecutando $(basename "$f") contra el proyecto ${PROJECT_REF}…"

  # Empaquetar el fichero SQL como JSON de forma segura (sin romper comillas/saltos de línea)
  PAYLOAD=$(jq -Rs '{query: .}' < "$f")

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Authorization: Bearer $PAT" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    verde "  ✓ OK (HTTP $HTTP_CODE)"
  else
    rojo "  ✗ Error ejecutando $(basename "$f") (HTTP $HTTP_CODE)"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    rojo "  Deteniendo — revisa el error antes de continuar con los siguientes ficheros."
    exit 1
  fi
done
echo

azul "→ Verificando que las tablas y funciones existen…"

SUPA_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY=$(grep -E "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$WEB_DIR/.env.local" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' ')

if [[ -z "$ANON_KEY" ]]; then
  gris "  (no se encontró NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local, salto la verificación)"
else
  check_tabla() {
    local nombre="$1" resp
    resp=$(curl -s "$SUPA_URL/rest/v1/$nombre?select=id&limit=1" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
      -H "Accept-Profile: public")
    if echo "$resp" | grep -q "PGRST205"; then
      rojo "  ✗ tabla $nombre — NO existe"
    else
      verde "  ✓ tabla $nombre — existe"
    fi
  }
  check_fn() {
    local nombre="$1" resp
    resp=$(curl -s -X POST "$SUPA_URL/rest/v1/rpc/$nombre" \
      -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
      -H "Content-Type: application/json" -H "Content-Profile: public" \
      -d '{}')
    if echo "$resp" | grep -q "PGRST202"; then
      rojo "  ✗ función $nombre — NO existe"
    else
      verde "  ✓ función $nombre — existe"
    fi
  }

  gris "  -- Base --"
  check_tabla "visits"
  check_tabla "testers"
  check_tabla "leads"
  check_tabla "reviews"
  check_tabla "marketing_campaigns"
  check_tabla "events"
  gris "  -- Auditoría --"
  check_tabla "admin_audit_log"
  check_fn "get_admin_audit_log"
  check_fn "get_purchases_activity"
  gris "  -- Analítica --"
  check_fn "get_purchases_since"
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
