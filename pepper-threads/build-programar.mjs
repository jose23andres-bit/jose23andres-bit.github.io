// Genera programar.html: lista de publicaciones con botón "Copiar" y fecha/hora sugerida,
// para programarlas a mano desde la app de Threads (··· → Programar).
import { readFileSync, writeFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync(new URL('./posts.json', import.meta.url), 'utf8'));

const groups = {};
cfg.posts.forEach(p => (groups[p.sector] ||= []).push(p));
const keys = Object.keys(groups), list = [];
for (let i = 0; list.length < cfg.posts.length; i++) keys.forEach(k => groups[k][i] && list.push(groups[k][i]));

const NAMES = { dental: 'Clínica dental', estetica: 'Estética', oftalmologia: 'Oftalmología', audiologia: 'Audiología', general: 'General' };
const start = new Date(process.argv[2] || '2026-11-23'); // primer día
const fmt = d => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cards = list.map((p, i) => {
  const s = cfg.sectores[p.sector] || {};
  const link = s.link === '' ? cfg.base : cfg.base + '?s=' + p.sector;
  const text = `${p.text}\n\n${link}\n\n${cfg.firma}`;
  const d = new Date(start); d.setUTCDate(d.getUTCDate() + Math.floor(i / 2));
  const hour = i % 2 ? '14:00' : '09:00';
  return `<article class="card" id="p${i + 1}">
  <div class="top"><b>${i + 1} / ${list.length}</b><span class="tag">${NAMES[p.sector]}</span></div>
  <p class="when">📅 ${fmt(d)} · ${hour}</p>
  <pre>${esc(text)}</pre>
  <p class="topic">Tema para añadir: <b>${s.topic}</b></p>
  <button data-i="${i}">Copiar texto</button>
  <label class="done"><input type="checkbox" data-i="${i}"> Ya la he programado</label>
</article>`;
}).join('\n');

const texts = list.map(p => {
  const s = cfg.sectores[p.sector] || {};
  const link = s.link === '' ? cfg.base : cfg.base + '?s=' + p.sector;
  return `${p.text}\n\n${link}\n\n${cfg.firma}`;
});

writeFileSync(new URL('./programar.html', import.meta.url), `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Programar publicaciones de Threads · Pepper</title>
<link rel="icon" href="../pepper-clinicas/assets/favicon.svg">
<style>
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#FBF7F3;color:#141414}
header{background:#FF3333;color:#fff;padding:22px 18px}header h1{margin:0 0 6px;font-size:1.35rem}
.how{background:#fff;margin:16px;border-radius:16px;padding:16px 18px;line-height:1.5}
.how ol{margin:8px 0 0;padding-left:20px}.prog{font-weight:600;margin:0 16px}
.card{background:#fff;margin:14px 16px;border-radius:16px;padding:16px;border:2px solid transparent}
.card.ok{border-color:#25D366;opacity:.6}.top{display:flex;justify-content:space-between;align-items:center}
.tag{background:#FFEBEB;color:#FF3333;border-radius:999px;padding:3px 10px;font-size:.85rem;font-weight:600}
.when{margin:8px 0;font-weight:600;text-transform:capitalize}
pre{white-space:pre-wrap;font:inherit;background:#FBF7F3;border-radius:12px;padding:12px;margin:0 0 10px;font-size:.95rem}
.topic{margin:0 0 12px;color:#5E5E66;font-size:.9rem}
button{width:100%;background:#FF3333;color:#fff;border:0;border-radius:999px;padding:14px;font:inherit;font-weight:700;font-size:1rem}
button.copied{background:#25D366}.done{display:flex;gap:8px;align-items:center;margin-top:12px;color:#5E5E66}
.done input{width:20px;height:20px;accent-color:#25D366}
</style></head><body>
<header><h1>Publicaciones de Threads · Pepper</h1><div>${list.length} publicaciones listas · 2 al día</div></header>
<div class="how"><b>Cómo programar cada una (1 minuto):</b><ol>
<li>Pulsa <b>Copiar texto</b>.</li>
<li>Abre <b>Threads</b> y pulsa el botón de nueva publicación (<b>+</b> o el lápiz).</li>
<li>Mantén pulsado y elige <b>Pegar</b>.</li>
<li>Pulsa <b>Añadir un tema</b> y escribe el tema que se indica.</li>
<li>Pulsa los <b>tres puntos (···)</b> arriba → <b>Programar</b>, elige el día y la hora indicados y confirma.</li>
<li>Vuelve aquí y marca <b>Ya la he programado</b>.</li></ol></div>
<p class="prog" id="prog"></p>
${cards}
<script>
const T=${JSON.stringify(texts)};const K='pepperThreadsDone';
let done=[];try{done=JSON.parse(localStorage.getItem(K)||'[]')}catch(e){}
function paint(){document.querySelectorAll('.done input').forEach(c=>{const i=+c.dataset.i;c.checked=done.includes(i);c.closest('.card').classList.toggle('ok',c.checked)});
document.getElementById('prog').textContent='Programadas: '+done.length+' de '+T.length;}
document.querySelectorAll('button[data-i]').forEach(b=>b.onclick=async()=>{const t=T[+b.dataset.i];
try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}
b.textContent='¡Copiado! Pégalo en Threads';b.classList.add('copied');setTimeout(()=>{b.textContent='Copiar texto';b.classList.remove('copied')},2500)});
document.querySelectorAll('.done input').forEach(c=>c.onchange=()=>{const i=+c.dataset.i;done=c.checked?[...new Set([...done,i])]:done.filter(x=>x!==i);
try{localStorage.setItem(K,JSON.stringify(done))}catch(e){}paint()});
paint();
</script></body></html>
`);
console.log('programar.html con', list.length, 'publicaciones');
