#!/bin/sh
# Inicia el servidor local de Oficina IA (necesita Node.js 18+)
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "Instalá Node.js 18 o más nuevo: https://nodejs.org"; exit 1; }
exec node server/oficina-server.js "$@"
