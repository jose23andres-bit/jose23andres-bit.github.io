#!/usr/bin/env bash
# VOLVER A TI · Emisor 24/7 hacia YouTube Live.
# Encadena los programas renderizados (sin recodificar, apenas usa CPU) en orden aleatorio
# y se reconecta solo si se corta la conexión.
#
# Variables:
#   YOUTUBE_STREAM_KEY  clave de emisión de YouTube Studio (obligatoria)
#   YOUTUBE_RTMP_URL    por defecto rtmp://a.rtmp.youtube.com/live2
#   VAT_OUT             carpeta con los MP4 (por defecto ./segments)
#   VAT_TEST_OUTPUT     si se define, emite a ese archivo en lugar de a YouTube (pruebas)
set -uo pipefail
cd "$(dirname "$0")"

SEGMENTS="${VAT_OUT:-./segments}"
RTMP="${YOUTUBE_RTMP_URL:-rtmp://a.rtmp.youtube.com/live2}"
FF="${FFMPEG:-ffmpeg}"
LIST="$(mktemp)"
trap 'rm -f "$LIST"' EXIT

if [[ -z "${VAT_TEST_OUTPUT:-}" && -z "${YOUTUBE_STREAM_KEY:-}" ]]; then
  echo "Falta YOUTUBE_STREAM_KEY" >&2; exit 1
fi
TARGET="${VAT_TEST_OUTPUT:-$RTMP/${YOUTUBE_STREAM_KEY:-}}"

build_list() {
  # 30 vueltas barajadas (varios días de emisión) sin repetir el mismo programa dos veces seguidas
  : > "$LIST"
  local last="" files
  mapfile -t files < <(ls "$SEGMENTS"/*.mp4 2>/dev/null)
  if (( ${#files[@]} == 0 )); then echo "No hay programas en $SEGMENTS. Ejecuta: node render.mjs" >&2; exit 1; fi
  for _ in $(seq ${VAT_ROUNDS:-30}); do
    while read -r f; do
      [[ "$f" == "$last" && ${#files[@]} -gt 1 ]] && continue
      printf "file '%s'\n" "$(realpath "$f")" >> "$LIST"; last="$f"
    done < <(printf '%s\n' "${files[@]}" | shuf)
  done
}

while true; do
  build_list
  echo "$(date '+%F %T') ▶ Emitiendo $(grep -c ^file "$LIST") programas en cola"
  "$FF" -hide_banner -loglevel warning -re -f concat -safe 0 -i "$LIST" \
    -c copy -f flv -flvflags no_duration_filesize "$TARGET"
  [[ -n "${VAT_TEST_OUTPUT:-}" ]] && exit 0
  echo "$(date '+%F %T') ⚠ La emisión se detuvo. Reintento en 10 s…" >&2
  sleep 10
done
