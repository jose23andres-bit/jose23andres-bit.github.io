# Volver a Ti · Directo 24/7

Sistema que emite en YouTube sin parar, día y noche, con paisajes naturales, música ambiental original, respiración guiada y la identidad visual de Volver a Ti.

## Cómo funciona

```
programs.json ─┬─> stage.html + scenes.js ──(Chromium sin pantalla)──> fotogramas 1920×1080 · 30 fps ─┐
               └─> music.py (música generativa original) ──────────────────────────────────────────────┴─> ffmpeg ─> segments/*.mp4
segments/*.mp4 ──> stream.sh (orden aleatorio, sin recodificar, reconexión automática) ──RTMP──> YouTube Live
```

- **9 programas** (unas 2 h 40 min de contenido distinto): Bosque al amanecer, Océano al atardecer, Lluvia en la montaña, Luna sobre el agua, Respiración guiada 4·2·6, Alineación de chakras, Despertar del loto, Vuelo de la libélula y Geometría sagrada.
- **Música original generada por código**: acordes que evolucionan, cuencos tibetanos, arpa, pulso binaural y sonidos de naturaleza (lluvia, olas, arroyo, pájaros). No usa música de terceros, así que no hay reclamaciones de derechos de autor.
- **Identidad en pantalla**: logotipo como marca de agua, rótulo "Volver a Ti · En directo" cada 4 minutos y guía de respiración en los programas marcados con `"breath": true`.
- **Formato YouTube Live**: H.264 High, 1080p30, 4,5 Mbps constantes, fotograma clave cada 2 s y audio AAC de 160 kbps.

La emisión copia archivos ya codificados: un servidor de 2 vCPU va sobrado y la conexión solo necesita unos 5 Mbps de subida.

## Puesta en marcha (una sola vez)

### 1. Activar los directos en YouTube
1. Entra en [YouTube Studio](https://studio.youtube.com) → **Crear → Emitir en directo**.
2. Si es la primera vez, verifica el teléfono. **YouTube tarda hasta 24 h** en activar la función.
3. En **Emitir** → **Clave de emisión**, elige **Crear clave nueva** → tipo *Reutilizable*, 1080p. Copia la clave. Es secreta: no la publiques.
4. Ajustes recomendados del directo:
   - **Título**: `🔴 Volver a Ti 24/7 · Música para Meditar, Dormir y Sanar · 432 Hz · Paisajes Naturales y Respiración Guiada`
   - **Categoría**: Gente y blogs (o Música). **Latencia**: normal. **Activar DVR**: sí.
   - Activa **Inicio automático** y **Detención automática** para que el directo arranque solo al recibir señal.

### 2. Contratar un servidor
Cualquier VPS Linux con 2 vCPU, 4 GB de RAM y 40 GB de disco sirve (Hetzner CX22, Contabo, OVH o DigitalOcean, desde unos 4–6 € al mes). Instala Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Desplegar
```bash
git clone https://github.com/jose23andres-bit/jose23andres-bit.github.io.git
cd jose23andres-bit.github.io/volver-a-ti/broadcast
echo "YOUTUBE_STREAM_KEY=tu-clave-aqui" > .env
docker compose up -d --build
docker compose logs -f
```

La **primera vez** renderiza todos los programas, lo que tarda unas 3–5 horas en un servidor de 2 vCPU. Después emite al instante, y tras cualquier reinicio vuelve a emitir solo (`restart: always`).

## Cambiar o añadir programas

Edita `programs.json`: escena, minutos, título, subtítulo y música (`root` en Hz, `beat` en Hz, `nature`: `none|rain|waves|stream|birds`, `mood`: `warm|open|deep|night`). Después:

```bash
git pull && docker compose up -d --build
```

El sistema detecta los cambios y vuelve a renderizar.

Escenas disponibles: `bosque`, `oceano`, `lluvia`, `dormir`, `respiracion`, `chakras`, `loto`, `libelula`, `geometria`.

## Pruebas en tu ordenador

```bash
cd broadcast && npm install && npx playwright install chromium
pip install numpy scipy imageio-ffmpeg
node render.mjs --only bosque-432 --seconds 30     # crea segments/bosque-432.mp4
VAT_TEST_OUTPUT=prueba.flv bash stream.sh          # simula la emisión en un archivo
```

Vista previa animada en el navegador: abre `stage.html?scene=oceano&title=Prueba&breath=1&preview=1`.

## Límites

- YouTube solo guarda como vídeo los directos de menos de 12 h. Un 24/7 no deja grabación, y es normal.
- Si el servidor pierde la conexión, `stream.sh` reintenta cada 10 s. Con *Inicio automático* activado, YouTube retoma el mismo directo.
- La voz guiada no está incluida: la respiración se guía con el círculo en pantalla. Se puede añadir una voz en español con un servicio de síntesis de voz, como ElevenLabs, que es de pago.
