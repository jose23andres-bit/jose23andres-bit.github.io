#!/usr/bin/env bash
# Arranque del contenedor: renderiza lo que falte y empieza a emitir.
set -euo pipefail
cd "$(dirname "$0")"
HASH="$(cat programs.json stage.html ../assets/js/scenes.js music.py | sha256sum | cut -c1-16)"
STAMP="$VAT_OUT/.build-$HASH"
mkdir -p "$VAT_OUT"
if [[ ! -f "$STAMP" ]]; then
  echo "Programas nuevos o modificados: renderizando (la primera vez tarda unas horas)…"
  rm -f "$VAT_OUT"/*.mp4 "$VAT_OUT"/.build-*
  node render.mjs
  touch "$STAMP"
fi
exec ./stream.sh
