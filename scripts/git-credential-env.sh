#!/usr/bin/env bash
# Credential helper de git para este repo: lee GITHUB_TOKEN de .env.local
# en vez de tener el token embebido en la URL del remoto (.git/config).
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_DIR/.env.local"

# git credential helpers reciben la operación como argv1 ("get", "store", "erase")
# y leen pares clave=valor por stdin. Solo respondemos a "get".
OP="${1:-get}"

# Consumir stdin (protocol=...\nhost=...\n) sin usarlo, git solo espera nuestra respuesta
cat >/dev/null || true

if [[ "$OP" != "get" ]]; then
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  exit 0
fi

TOKEN=$(grep -E "^GITHUB_TOKEN=" "$ENV_FILE" | head -1 | cut -d= -f2-)
if [[ -z "$TOKEN" ]]; then
  exit 0
fi

echo "username=x-access-token"
echo "password=$TOKEN"
