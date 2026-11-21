// Publica en Threads la publicación que toca según la hora (API oficial de Threads).
// Uso:
//   node publish.mjs            -> publica la publicación de este turno
//   node publish.mjs --dry      -> muestra lo que publicaría, sin publicar
//   node publish.mjs --check    -> comprueba que la clave funciona
//   node publish.mjs --refresh  -> renueva la clave (60 días más) y la escribe en $GITHUB_OUTPUT
//   node publish.mjs --list     -> valida y lista todas las publicaciones en orden
// Variables: THREADS_TOKEN (obligatoria salvo --dry/--list), THREADS_USER_ID (opcional, por defecto "me"),
//            PEPPER_INDEX (opcional, fuerza una publicación concreta).
import { readFileSync, appendFileSync } from 'node:fs';

const API = 'https://graph.threads.com/v1.0';
const TOKEN = process.env.THREADS_TOKEN || '';
const USER = process.env.THREADS_USER_ID || 'me';
const args = new Set(process.argv.slice(2));
const cfg = JSON.parse(readFileSync(new URL('./posts.json', import.meta.url), 'utf8'));

// Orden alterno por sectores: dental, estética, oftalmología, audiología, general, dental...
function ordered() {
  const groups = {};
  cfg.posts.forEach(p => (groups[p.sector] ||= []).push(p));
  const keys = Object.keys(groups), out = [];
  for (let i = 0; out.length < cfg.posts.length; i++) keys.forEach(k => groups[k][i] && out.push(groups[k][i]));
  return out;
}

function build(p) {
  const s = cfg.sectores[p.sector] || {};
  const link = s.link === '' ? cfg.base : cfg.base + '?s=' + p.sector;
  const text = p.text + '\n\n' + cfg.firma;
  if (text.length > 500) throw new Error(`Texto de más de 500 caracteres (${text.length}): ${p.text.slice(0, 40)}…`);
  if (s.topic && (s.topic.length > 50 || /[.&@!?,;:\s]/.test(s.topic))) throw new Error('Tema no válido: ' + s.topic);
  return { text, link, topic: s.topic };
}

// Un turno cada 12 h (2 publicaciones al día) contando desde el 1-1-2026.
function currentIndex(list) {
  if (process.env.PEPPER_INDEX) return Number(process.env.PEPPER_INDEX) % list.length;
  const slot = Math.round((Date.now() - Date.UTC(2026, 0, 1)) / 432e5);
  return slot % list.length;
}

async function api(method, path, params) {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const url = method === 'GET' ? `${API}${path}?${body}` : `${API}${path}`;
  const r = await fetch(url, method === 'GET' ? {} : { method, body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`Threads API ${path}: ${JSON.stringify(j.error || j)}`);
  return j;
}

const list = ordered();
list.forEach(build); // valida todo antes de nada

if (args.has('--list')) {
  list.forEach((p, i) => { const b = build(p); console.log(`#${i} [${p.sector}] ${b.text.length} car. ${b.link}`); });
  process.exit(0);
}

const i = currentIndex(list), post = build(list[i]);
if (args.has('--dry')) { console.log(`Publicación #${i} (${list[i].sector})\nTema: ${post.topic}\nEnlace: ${post.link}\n\n${post.text}`); process.exit(0); }
if (!TOKEN) { console.error('Falta THREADS_TOKEN.'); process.exit(1); }

if (args.has('--check')) {
  const me = await api('GET', '/me', { fields: 'id,username' });
  console.log(`Clave válida para @${me.username} (id ${me.id}).`);
} else if (args.has('--refresh')) {
  const r = await fetch(`https://graph.threads.com/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(TOKEN)}`);
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error('No se pudo renovar la clave: ' + JSON.stringify(j));
  console.log(`Clave renovada. Válida ${Math.round(j.expires_in / 86400)} días más.`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${j.access_token !== TOKEN ? 1 : 0}\n`);
  if (process.env.NEW_TOKEN_FILE) appendFileSync(process.env.NEW_TOKEN_FILE, j.access_token);
} else {
  const { id } = await api('POST', `/${USER}/threads`, { media_type: 'TEXT', text: post.text, link_attachment: post.link, topic_tag: post.topic });
  await new Promise(r => setTimeout(r, 5000)); // pausa recomendada antes de publicar
  const pub = await api('POST', `/${USER}/threads_publish`, { creation_id: id });
  console.log(`Publicada #${i} (${list[i].sector}) → id ${pub.id}`);
}
