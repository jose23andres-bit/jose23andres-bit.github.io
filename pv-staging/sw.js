/* PowerVane · service worker
   Hace que la Power App se pueda instalar y abrir sin conexión.
   - Páginas, CSS y JS: primero la red (siempre la última versión) y, sin conexión, la copia guardada.
   - Imágenes, iconos y fuentes: copia guardada al instante y se actualiza por detrás.
   - Vídeos, radio y YouTube no pasan por aquí. */
const CACHE = "powervane-v20261126";
const CORE = [
  "./",
  "styles.css",
  "script.js",
  "app.js",
  "live.js",
  "live-data.js",
  "manifest.webmanifest",
  "assets/img/logo.svg",
  "assets/img/hero.jpg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("powervane-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;
  if (sameOrigin && !url.pathname.startsWith(new URL("./", self.location).pathname)) return;
  if (/\.(mp4|webm|mp3)$/i.test(url.pathname)) return;

  const isAsset = /\.(jpe?g|png|webp|svg|gif|woff2?|ttf)$/i.test(url.pathname) || FONT_HOSTS.includes(url.hostname);

  if (isAsset) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && sameOrigin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => {
        const c = await caches.open(CACHE);
        return (await c.match(req)) || (await c.match(req, { ignoreSearch: true })) ||
          (req.mode === "navigate" ? c.match("./") : Response.error());
      })
  );
});
