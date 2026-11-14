/*
 * VOLVER A TI · Subida automática a YouTube (YouTube Data API v3).
 *
 * Uso: node upload.mjs <video.mp4> <miniatura.jpg> <program_id> [--dry]
 * Variables (secretos de GitHub): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
 *   YT_PRIVACY: public | unlisted | private (por defecto public)
 *
 * Nota: mientras el proyecto de Google Cloud no supere la auditoría de YouTube,
 * la API deja los vídeos en privado aunque se pida "public".
 */
import { readFileSync, statSync, createReadStream } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const [video, thumb, pid] = process.argv.slice(2);
const dry = process.argv.includes("--dry");
const check = process.argv.includes("--check");
const cfg = JSON.parse(readFileSync(join(HERE, "programs.json"), "utf8"));
const p = check ? cfg.programs[0] : cfg.programs.find((x) => x.id === pid);
if (!p) throw new Error(`Programa desconocido: ${pid}`);

export function metadata(p, minutes) {
  const m = p.meta || {};
  const title = (m.title || `${p.subtitle} · ${p.title} · Música para Meditar y Relajarse`).slice(0, 100);
  const description = [
    m.intro || `${p.title}. ${p.subtitle}. ${minutes} minutos de música original, paisaje en calma y frecuencias suaves para volver a tu centro.`,
    "",
    "Úsalo para:",
    "✨ Meditar y calmar la mente",
    "✨ Soltar el estrés y la ansiedad",
    "✨ Dormir mejor y descansar profundamente",
    "✨ Estudiar, leer o trabajar con calma",
    "",
    "🎧 Usa auriculares: la música incluye un pulso binaural suave.",
    "",
    "🌐 Web oficial: https://jose23andres-bit.github.io/volver-a-ti/",
    "🔔 Suscríbete a Volver a Ti para recibir nuevas meditaciones cada día.",
    "",
    "Música original de Volver a Ti.",
    "Este contenido acompaña tu bienestar, pero no sustituye la atención médica ni psicológica profesional.",
    "",
    `#VolverATi #Meditación #MúsicaRelajante ${(m.hashtags || "#PazInterior").trim()}`,
  ].join("\n");
  const tags = ["volver a ti", "meditacion", "musica relajante", "musica para meditar", "paz interior", "relajacion", ...(m.tags || [])];
  return { title, description, tags };
}

async function token() {
  const clean = (v) => (v || "").replace(/\s+/g, "");
  const id = clean(process.env.YT_CLIENT_ID), secret = clean(process.env.YT_CLIENT_SECRET), refresh = clean(process.env.YT_REFRESH_TOKEN);
  if (!id || !secret || !refresh) throw new Error("Faltan YT_CLIENT_ID, YT_CLIENT_SECRET o YT_REFRESH_TOKEN");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`No se obtuvo el token: ${JSON.stringify(j)}`);
  return j.access_token;
}

const minutes = Math.round((p.uploadMinutes || 10));
const meta = metadata(p, minutes);
console.log(`Título: ${meta.title}`);
if (dry) { console.log(meta.description); process.exit(0); }

const at = await token();
if (check) {
  const me = await (await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${at}` } })).json();
  console.log(`✓ Claves correctas · canal: ${me.items?.[0]?.snippet?.title}`);
  process.exit(0);
}
const body = {
  snippet: { ...meta, categoryId: "22", defaultLanguage: "es", defaultAudioLanguage: "es" },
  status: { privacyStatus: process.env.YT_PRIVACY || "public", selfDeclaredMadeForKids: false, containsSyntheticMedia: true },
};
const size = statSync(video).size;
const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
  method: "POST",
  headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(size) },
  body: JSON.stringify(body),
});
if (!init.ok) throw new Error(`Inicio de subida rechazado (${init.status}): ${await init.text()}`);
const up = await fetch(init.headers.get("location"), {
  method: "PUT",
  headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
  body: createReadStream(video),
  duplex: "half",
});
const res = await up.json();
if (!res.id) throw new Error(`Subida fallida: ${JSON.stringify(res)}`);
console.log(`✓ Subido: https://youtu.be/${res.id} (${res.status?.privacyStatus})`);

if (thumb) {
  const t = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${res.id}`, {
    method: "POST", headers: { Authorization: `Bearer ${at}`, "Content-Type": "image/jpeg" }, body: readFileSync(thumb),
  });
  console.log(t.ok ? "✓ Miniatura aplicada" : `⚠ Miniatura no aplicada (${t.status}). Se necesita verificar el teléfono del canal.`);
}
