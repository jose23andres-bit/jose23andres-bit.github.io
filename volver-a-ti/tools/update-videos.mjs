// Lee el feed público del canal (sin claves ni API) y escribe assets/data/videos.json.
// Lo ejecuta GitHub Actions cada 6 horas: la web muestra los vídeos nuevos sin intervención.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfgText = readFileSync(join(ROOT, "assets/js/config.js"), "utf8");
const channelId = process.env.YT_CHANNEL_ID || (cfgText.match(/channelId:\s*"(UC[\w-]{22})"/) || [])[1];
const out = join(ROOT, "assets/data/videos.json");

if (!channelId) { console.log("Sin channelId en config.js todavía: no hay nada que actualizar."); process.exit(0); }

const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
if (!res.ok) { console.error(`El feed respondió ${res.status}`); process.exit(res.status === 404 ? 0 : 1); }
const xml = await res.text();

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const SERIES = [
  ["dormir", /dorm|sueñ|sleep|noche|insomn|delta/i],
  ["chakras", /chakra/i],
  ["guiada", /guiad|respira|escaneo/i],
  ["consciencia", /conscien|despert|espiritu|geometr|963|852/i],
  ["paz", /paz|afirmac|amor propio|gratitud|calma/i],
];
const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
  const id = (e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
  const title = decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
  const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
  const series = (SERIES.find(([, re]) => re.test(title)) || ["guiada"])[0];
  return { id, title, published, series };
}).filter((v) => v.id).slice(0, 12);

// ¿Está el canal emitiendo ahora? (la web solo muestra el reproductor del directo si es así)
let live = false;
try {
  const html = await (await fetch(`https://www.youtube.com/channel/${channelId}/live`, { headers: { "Accept-Language": "es", "User-Agent": "Mozilla/5.0" } })).text();
  live = /"isLiveNow":\s*true/.test(html) || /"isLive":\s*true/.test(html);
} catch { /* sin conexión: se mantiene en falso */ }

const next = JSON.stringify({ channelId, live, updated: new Date().toISOString().slice(0, 10), videos }, null, 2) + "\n";
const prev = existsSync(out) ? readFileSync(out, "utf8") : "";
const old = prev ? JSON.parse(prev) : {};
const same = prev && old.live === live && JSON.stringify(old.videos) === JSON.stringify(videos);
console.log(`Directo activo: ${live ? "sí" : "no"}`);
if (same) { console.log("Sin vídeos nuevos."); process.exit(0); }
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, next);
console.log(`Actualizados ${videos.length} vídeos.`);
