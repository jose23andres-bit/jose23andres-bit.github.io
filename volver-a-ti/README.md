# Volver a Ti · Web oficial

Landing oficial de **Volver a Ti**: meditación guiada, sueño profundo, los siete chakras y consciencia.
Es una web estática (HTML, CSS y JavaScript sin dependencias), lista para publicar en GitHub Pages, Netlify o Vercel.

## Qué incluye

| Sección | Contenido |
|---|---|
| **Hero** | Logotipo oficial con halo dorado animado y cielo estrellado interactivo. |
| **Esencia** | Manifiesto de marca y el simbolismo de la libélula, el loto y los chakras. |
| **Sala de meditación** | 6 clips vivos generados en tiempo real (canvas) con reproductor a pantalla completa, temporizador y sonido binaural sintetizado. |
| **Los siete chakras** | Mapa interactivo: elemento, mantra, frecuencia, afirmación, práctica y un tono audible por chakra. |
| **Canal** | Las 5 series del canal de YouTube con miniaturas de marca. Los vídeos publicados aparecen solos al añadirlos a `config.js`. |
| **Estudio cinematográfico** | 13 prompts profesionales para generar clips con IA (Sora, Veo, Runway, Kling, Luma) y botón de copiar. |

### Clips vivos

| Clip | Serie | Sonido |
|---|---|---|
| Respiración Cósmica | Meditación guiada | Base 216 Hz, pulso theta 6 Hz. Guía de respiración 4 · 2 · 6 |
| Ascenso de la Luz | Los siete chakras | 256 Hz, pulso 7,83 Hz |
| Luna sobre el Agua | Dormir profundamente | 108 Hz, pulso delta 2 Hz y ruido de agua |
| Despertar del Loto | Paz interior | 264 Hz, pulso alfa 8 Hz |
| Vuelo de la Libélula | Transformación | 288 Hz, pulso alfa 10 Hz |
| Geometría Sagrada | Espiritualidad y consciencia | 216 Hz, pulso 7 Hz |

Todo se genera en el navegador: las animaciones y el audio no usan archivos de vídeo ni de sonido.

## Configuración

Edita `assets/js/config.js`:

```js
channelUrl: "https://www.youtube.com/@volveratibydayanaquintero",   // URL real de tu canal
social: { youtube: "...", instagram: "", tiktok: "", spotify: "" },
videos: [
  { id: "ID_DEL_VIDEO", title: "Meditación para soltar la ansiedad", series: "guiada", duration: "15:00" },
],
```

> `@VolverATi` es provisional. Cámbialo por el identificador real cuando crees el canal.

### Usar el PNG original del logotipo

La web usa una reconstrucción vectorial del logotipo (`assets/img/logo-transparent.svg`).
Si guardas el archivo original como `assets/img/logo-original.png`, el hero lo mostrará automáticamente en su lugar.

## Estructura

```
index.html
assets/
  css/styles.css        Estilos y sistema visual
  js/config.js          Enlaces y vídeos del canal (editable)
  js/data.js            Textos: clips, chakras, series y prompts
  js/scenes.js          Las 6 escenas generativas (canvas)
  js/audio.js           Paisaje sonoro binaural (Web Audio)
  js/main.js            Interacción
  img/                  Logotipos SVG/PNG, favicon, imagen para compartir
prompts/cinematic-prompts.md   Biblioteca de prompts en Markdown
tools/build_logo.py     Genera los logotipos y PNG desde código
tools/serve.mjs         Servidor local de previsualización
```

## Logotipos generados

| Archivo | Uso |
|---|---|
| `logo.svg` / `logo-2048.png` / `logo-1024.png` | Logotipo principal con fondo violeta |
| `logo-transparent.svg` / `logo-transparent-2048.png` | Fondo transparente |
| `emblem.svg` | Emblema sin texto (navegación, marca de agua) |
| `favicon.svg`, `icon-512.png`, `apple-touch-icon.png` | Versión simplificada para tamaños pequeños |
| `og-image.jpg` | Imagen 1200 × 630 para compartir en redes |

Para regenerarlos: `pip install fonttools uharfbuzz cairosvg pillow` y después `python tools/build_logo.py`.
La rotulación usa **Great Vibes** (licencia SIL Open Font License), convertida a trazados vectoriales.

## Ver en local

```bash
node tools/serve.mjs     # http://localhost:4173
```

## Publicar en GitHub Pages

Settings → Pages → *Deploy from a branch* → `main` / `root`.

## Accesibilidad y aviso

- Respeta `prefers-reduced-motion`, se puede usar con teclado y el reproductor admite Esc y la barra espaciadora.
- El pie de página incluye un aviso: las meditaciones no sustituyen la atención médica, y conviene precaución si se padece epilepsia fotosensible.
