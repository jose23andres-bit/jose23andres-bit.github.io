/* =========================================================
   PowerVane · LIVE TRAINING
   Clases en directo y sesiones exclusivas solo para clientas con plan activo.

   Seguridad (web estática, sin servidor):
   - Cada plan tiene un código de acceso que la entrenadora da a sus clientas.
   - Los enlaces de las clases van CIFRADOS (AES-GCM 256). Sin un código válido
     no se pueden leer, ni siquiera mirando el código fuente de la web.
   - La clave se deriva del código con PBKDF2-SHA256.
   ========================================================= */
(() => {
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const norm = (code) => String(code || "").trim().toUpperCase().replace(/\s+/g, "");

  const PLAN_NAMES = { esp: "Programas especializados", start: "PowerStart", trans: "Power Transformation" };

  async function planKey(code, saltB64, iter) {
    const base = await crypto.subtle.importKey("raw", enc.encode(norm(code)), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(saltB64), iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function aesDecrypt(key, box) {
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct)));
  }
  async function aesEncrypt(key, bytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
    return { iv: b64(iv), ct: b64(ct) };
  }
  /* Comprueba un código contra los tres planes. Devuelve { plan, key } o null */
  async function unlock(code, data) {
    for (const [plan, p] of Object.entries(data.plans)) {
      try {
        const key = await planKey(code, p.salt, data.iter);
        const txt = dec.decode(await aesDecrypt(key, p.check));
        if (txt === "powervane-ok:" + plan) return { plan, key };
      } catch { /* código no válido para este plan */ }
    }
    return null;
  }
  async function openLink(session, plan, key) {
    const wrapped = session.keys && session.keys[plan];
    if (!wrapped) return null;
    const raw = await aesDecrypt(key, wrapped);
    const k = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
    return dec.decode(await aesDecrypt(k, session));
  }

  /* Expuesto para el panel de la entrenadora (admin-live.html) */
  window.PVLiveCrypto = { b64, unb64, norm, planKey, aesEncrypt, aesDecrypt, unlock, openLink, PLAN_NAMES };

  /* ---------------- Interfaz pública ---------------- */
  const root = document.getElementById("live");
  const DATA = window.PV_LIVE;
  if (!root || !DATA) return;

  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STORE = "powervane-live-access";
  let access = null; // { plan, key }

  const sessions = [...(DATA.sessions || [])].sort((a, b) => (a.start < b.start ? -1 : 1));
  const now = () => Date.now();
  const startMs = (s) => new Date(s.start).getTime();
  const endMs = (s) => startMs(s) + (s.duration || 60) * 60000;
  const fmtWhen = (s) => new Date(s.start).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const kindLabel = (k) => (k === "exclusive" ? "Sesión exclusiva" : "Clase en directo");

  const countdown = (ms) => {
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    return d > 0 ? `en ${d} d ${h} h` : h > 0 ? `en ${h} h ${m} min` : `en ${Math.max(1, m)} min`;
  };

  const icsFor = (s) => {
    const z = (t) => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PowerVane//Live//ES", "BEGIN:VEVENT", `UID:${s.id}@powervane`, `DTSTAMP:${z(now())}`, `DTSTART:${z(startMs(s))}`, `DTEND:${z(endMs(s))}`, `SUMMARY:${kindLabel(s.kind)} · ${s.title} · PowerVane`, "DESCRIPTION:El enlace aparece en la web 15 minutos antes de empezar.", "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Tu clase PowerVane empieza en 15 minutos", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    return URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  };

  async function render() {
    const upcoming = sessions.filter((s) => endMs(s) > now());
    const list = $("liveList");
    $("liveStatus").innerHTML = access
      ? `<span class="live__badge live__badge--ok">Acceso activo · ${esc(PLAN_NAMES[access.plan])}</span> <button type="button" class="link-btn link-btn--dim" id="liveLogout">Salir</button>`
      : `<span class="live__badge">Acceso solo para clientas</span>`;
    $("liveForm").hidden = !!access;
    const lo = $("liveLogout");
    if (lo) lo.addEventListener("click", () => { localStorage.removeItem(STORE); access = null; render(); });

    if (!upcoming.length) {
      list.innerHTML = `<li class="live__empty">
        <span class="live__empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></span>
        <p class="live__empty-text"><strong>Nuevas clases muy pronto</strong><span>Te aviso en cuanto se programe la próxima.</span></p>
        <a href="#" class="btn btn--line btn--small" data-wa-live>Avísame</a>
      </li>`;
      const b = list.querySelector("[data-wa-live]");
      if (b && window.PVwa) { b.href = window.PVwa("liveAviso"); b.target = "_blank"; b.rel = "noopener"; }
      return;
    }
    const items = await Promise.all(upcoming.map(async (s, n) => {
      const allowed = access && s.plans.includes(access.plan);
      const isNow = now() >= startMs(s) - 15 * 60000;
      let action;
      if (!access) action = `<span class="live__lock" aria-hidden="true"></span><span class="live__hint">Introduce tu código para desbloquear</span>`;
      else if (!allowed) action = `<span class="live__lock" aria-hidden="true"></span><span class="live__hint">Incluida en ${s.plans.map((p) => PLAN_NAMES[p]).map(esc).join(" · ")}</span>`;
      else if (isNow) {
        let link = null;
        try { link = await openLink(s, access.plan, access.key); } catch { /* sin enlace */ }
        action = link && /^https:\/\//.test(link)
          ? `<a class="btn btn--pink btn--small" href="${esc(link)}" target="_blank" rel="noopener">Entrar ahora</a>`
          : `<span class="live__hint">Enlace no disponible, escríbeme por WhatsApp</span>`;
      } else action = `<a class="btn btn--line btn--small" href="${icsFor(s)}" download="powervane-${esc(s.id)}.ics">Añadir al calendario</a><span class="live__hint">El enlace aparece 15 min antes</span>`;
      const live = now() >= startMs(s) && now() < endMs(s);
      const d = new Date(s.start);
      return `<li class="live__item ${allowed ? "is-open" : "is-locked"} ${live ? "is-live" : ""}" style="--n:${n}">
        <div class="live__date" aria-hidden="true"><b>${d.getDate()}</b><small>${esc(d.toLocaleString("es-ES", { month: "short" }).replace(".", ""))}</small></div>
        <div class="live__when"><span class="live__kind">${kindLabel(s.kind)}</span><time datetime="${esc(s.start)}">${esc(fmtWhen(s))}</time><span class="live__count${live ? " is-live" : ""}">${live ? "En directo ahora" : esc(countdown(startMs(s) - now()))} · ${s.duration || 60} min</span></div>
        <div class="live__info"><h3>${esc(s.title)}</h3>${s.desc ? `<p>${esc(s.desc)}</p>` : ""}</div>
        <div class="live__action">${action}</div>
      </li>`;
    }));
    list.innerHTML = items.join("");
  }

  $("liveForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = e.target.code.value, msg = $("liveMsg"), btn = e.target.querySelector("button");
    btn.disabled = true; msg.textContent = "Comprobando…";
    const res = await unlock(code, DATA);
    btn.disabled = false;
    if (!res) { msg.textContent = "Código no válido. Revisa que esté bien escrito o escríbeme por WhatsApp."; return; }
    access = res; msg.textContent = "";
    try { localStorage.setItem(STORE, JSON.stringify({ code: PVLiveCrypto.norm(code) })); } catch { /* sin guardado */ }
    e.target.reset(); render();
  });

  (async () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.code) access = await unlock(saved.code, DATA);
    } catch { access = null; }
    render();
    setInterval(render, 60000);
  })();
})();
