#!/usr/bin/env bash
# Guarda STRIPE_SECRET_KEY_LIVE en .env.local, sin tocar Stripe ni Vercel.
set -uo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WEB_DIR"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }

read -rsp "Pega tu STRIPE_SECRET_KEY de modo LIVE (sk_live_...): " SK
echo
if [[ ! "$SK" =~ ^sk_live_ ]]; then rojo "Debe ser sk_live_"; exit 1; fi

if grep -q "^STRIPE_SECRET_KEY_LIVE=" .env.local 2>/dev/null; then
  grep -v "^STRIPE_SECRET_KEY_LIVE=" .env.local > .env.local.tmp && mv .env.local.tmp .env.local
fi
printf 'STRIPE_SECRET_KEY_LIVE=%s\n' "$SK" >> .env.local
chmod 600 .env.local
verde "Guardada en .env.local (permisos 600, fuera de git). Dile a Claude: clave live guardada"
