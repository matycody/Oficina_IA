#!/bin/sh
# Une las partes de src/ en index.html (archivo único para publicar como artefacto o abrir local)
cd "$(dirname "$0")" && cat src/a_head.html src/j1.js src/j2.js src/j3.js > index.html && echo "index.html generado"
