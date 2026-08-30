#!/bin/bash

echo "================================"
echo "Vercel Token Setup"
echo "================================"
echo ""
echo "Pega el token Vercel y presiona ENTER:"
echo ""

read -sp "VERCEL_TOKEN: " TOKEN
echo ""
echo ""

# Validación básica
if [ -z "$TOKEN" ]; then
    echo "❌ Error: Token vacío. Intenta de nuevo."
    exit 1
fi

if [[ ! $TOKEN =~ ^Ver ]]; then
    echo "⚠️  Aviso: El token no parece válido (no empieza con 'Ver')"
    echo "Continuando de todas formas..."
    echo ""
fi

# Exportar variable de entorno para esta sesión
export VERCEL_TOKEN=$TOKEN

# Guardar en .env.local para future
echo "VERCEL_TOKEN=$TOKEN" > .env.local
echo "NEXT_PUBLIC_URL=https://la-sombra-del-pantocrator.vercel.app" >> .env.local

echo "✅ Token configurado correctamente"
echo ""
echo "Archivos creados:"
echo "  - .env.local (con VERCEL_TOKEN)"
echo ""
echo "Variable de entorno exportada: VERCEL_TOKEN"
echo ""
echo "El deploy puede ejecutarse ahora."
echo "================================"
