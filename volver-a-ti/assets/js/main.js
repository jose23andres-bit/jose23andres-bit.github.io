/* VOLVER A TI · Interacción del sitio */
(function () {
  "use strict";

  const CFG = window.VAT_CONFIG || {};
  const { CLIPS, CHAKRAS, SERIES, PROMPTS, PROMPT_CATS, STYLE_SUFFIX } = window.VAT_DATA;
  const SCENES = window.VAT_SCENES;
  const D = window.VAT_DRAW;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Enlaces del canal y redes ---------- */
  $$('[data-link="channel"]').forEach((a) => (a.href = CFG.channelUrl || "#"));
  $("#year").textContent = new Date().getFullYear();
  const ICONS = {
    youtube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.8 15V9l5.2 3-5.2 3Z"/>',
    instagram: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 2.2c-2.7 0-3 0-4 .1-3.6.2-5.5 2-5.7 5.7-.1 1-.1 1.3-.1 4s0 3 .1 4c.2 3.6 2 5.5 5.7 5.7 1 .1 1.3.1 4 .1s3 0 4-.1c3.6-.2 5.5-2 5.7-5.7.1-1 .1-1.3.1-4s0-3-.1-4c-.2-3.6-2-5.5-5.7-5.7-1-.1-1.3-.1-4-.1Z"/>',
    tiktok: '<path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2-2.8V9a6.3 6.3 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.4 1.4V6.7a4.6 4.6 0 0 1-4.4-4.7Z"/>',
    spotify: '<path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Zm4.8 15.1a.7.7 0 0 1-1 .2c-2.7-1.6-6-2-10-1.1a.7.7 0 1 1-.3-1.4c4.3-1 8-.6 11 1.3.3.2.4.6.3 1Zm1.3-2.9a.9.9 0 0 1-1.2.3c-3-1.9-7.7-2.4-11.3-1.3a.9.9 0 1 1-.5-1.7c4.1-1.2 9.3-.6 12.7 1.5.4.3.5.8.3 1.2Zm.1-3c-3.7-2.2-9.7-2.4-13.2-1.3a1 1 0 1 1-.6-2c4-1.2 10.7-1 14.8 1.5a1 1 0 0 1-1 1.8Z"/>',
  };
  const social = $("#social");
  Object.entries(CFG.social || {}).forEach(([k, url]) => {
    if (!url || !ICONS[k]) return;
    social.insertAdjacentHTML("beforeend", `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${k}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">${ICONS[k]}</svg></a>`);
  });
  if (CFG.email) social.insertAdjacentHTML("beforeend", `<a href="mailto:${esc(CFG.email)}" class="footer__mail">${esc(CFG.email)}</a>`);

  /* ---------- Navegación ---------- */
  const nav = $("#nav"), toggle = $("#navToggle");
  addEventListener("scroll", () => nav.classList.toggle("is-scrolled", scrollY > 30), { passive: true });
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", false); }));

  /* ---------- Logotipo: usa el PNG original si existe ---------- */
  const probe = new Image();
  probe.onload = () => { $("#heroLogo").src = probe.src; $("#heroLogo").classList.add("is-original"); };
  probe.src = "assets/img/logo-original.png";

  /* ---------- Aparición suave al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  const observeReveals = () => $$(".reveal:not(.is-in)").forEach((el) => io.observe(el));

  /* ---------- Cielo del hero ---------- */
  (function heroSky() {
    const cv = $("#heroSky"), ctx = cv.getContext("2d");
    let w, h, stars, dust, mx = 0, my = 0, last = 0, visible = true;
    const fit = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = D.makeStars(Math.round((w * h) / 4500), w, h);
      dust = D.makeDust(Math.round(w / 22), w, h);
    };
    fit(); addEventListener("resize", fit);
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cv);
    const frame = (ms) => {
      const t = ms / 1000, dt = Math.min(0.05, t - last); last = t;
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        ctx.save(); ctx.translate(mx * -14, my * -10);
        D.drawStars(ctx, stars, t, 0.9);
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
        D.drawDust(ctx, dust, w, h, dt, t);
        ctx.globalCompositeOperation = "source-over";
      }
      if (!reduced) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  })();

  /* ---------- Clips: tarjetas con vista previa viva ---------- */
  const grid = $("#clipsGrid");
  grid.innerHTML = CLIPS.map((c, i) => `
    <article class="clip reveal" style="--d:${i * 80}ms">
      <button class="clip__media" data-clip="${c.id}" aria-label="Reproducir ${esc(c.title)}">
        <canvas data-preview="${c.id}"></canvas>
        <span class="clip__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/></svg></span>
        <span class="clip__live">En vivo · bucle infinito</span>
      </button>
      <div class="clip__body">
        <p class="clip__kicker">${esc(c.kicker)}</p>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.text)}</p>
        <ul class="tags">${c.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
    </article>`).join("");

  const previews = $$("canvas[data-preview]").map((cv) => {
    const ctx = cv.getContext("2d");
    const p = { cv, ctx, id: cv.dataset.preview, visible: false, scene: null, off: Math.random() * 20 };
    const fit = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
      if (p.scene) p.scene.resize(cv.width, cv.height);
      else p.scene = SCENES[p.id](cv.width, cv.height, { preview: true });
    };
    p.fit = fit; fit();
    return p;
  });
  addEventListener("resize", () => previews.forEach((p) => p.fit()));
  const pio = new IntersectionObserver((es) => es.forEach((e) => {
    const p = previews.find((x) => x.cv === e.target); if (p) p.visible = e.isIntersecting;
  }));
  previews.forEach((p) => pio.observe(p.cv));
  let playerOpen = false;
  const previewLoop = (ms) => {
    if (!playerOpen) previews.forEach((p) => { if (p.visible || reduced) p.scene.draw(p.ctx, ms / 1000 + p.off); });
    if (!reduced) requestAnimationFrame(previewLoop);
  };
  document.fonts && document.fonts.ready.then(() => requestAnimationFrame(previewLoop));
  if (!document.fonts) requestAnimationFrame(previewLoop);

  /* ---------- Reproductor a pantalla completa ---------- */
  const player = $("#player"), pcv = $("#playerCanvas"), pctx = pcv.getContext("2d");
  const ambient = new window.VATAmbient();
  const st = { clip: null, scene: null, playing: false, sound: false, t: 0, lastMs: 0, elapsed: 0, duration: 300, raf: 0, ended: false, lastFocus: null };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function fitPlayer() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    pcv.width = innerWidth * dpr; pcv.height = innerHeight * dpr;
    if (st.scene) st.scene.resize(pcv.width, pcv.height);
  }
  function setPlaying(on) {
    st.playing = on;
    player.classList.toggle("is-paused", !on);
    $("#playerPlay").setAttribute("aria-label", on ? "Pausar" : "Reproducir");
    if (st.sound) on ? ambient.resume() : ambient.suspend();
  }
  function setSound(on) {
    st.sound = on;
    player.classList.toggle("is-muted", !on);
    $("#playerSound").setAttribute("aria-pressed", on);
    $("#playerSound").setAttribute("aria-label", on ? "Silenciar" : "Activar sonido");
    if (on) { ambient.start(st.clip.audio); if (!st.playing) ambient.suspend(); }
    else ambient.stop();
  }
  function updateClock() {
    const d = st.duration;
    $("#playerClock").textContent = d ? fmt(Math.max(0, d - st.elapsed)) : fmt(st.elapsed);
    $("#playerProgress").style.width = d ? `${Math.min(100, (st.elapsed / d) * 100)}%` : "0%";
  }
  function tick(ms) {
    const dt = st.lastMs ? Math.min(0.1, (ms - st.lastMs) / 1000) : 0;
    st.lastMs = ms;
    if (st.playing) {
      st.t += dt; st.elapsed += dt;
      st.scene.draw(pctx, st.t);
      updateClock();
      if (st.duration && st.elapsed >= st.duration && !st.ended) finish();
    }
    st.raf = requestAnimationFrame(tick);
  }
  function finish() {
    st.ended = true;
    ambient.fadeOut(6);
    $("#playerEnd").hidden = false;
    player.classList.add("is-ended");
    setTimeout(() => { if (st.ended) setPlaying(false); }, 6000);
  }
  function openPlayer(id, withSound = true) {
    const clip = CLIPS.find((c) => c.id === id);
    if (!clip) return;
    st.lastFocus = document.activeElement;
    st.clip = clip; st.t = 0; st.elapsed = 0; st.ended = false; st.lastMs = 0;
    st.duration = +$("#playerDuration").value;
    $("#playerKicker").textContent = clip.kicker;
    $("#playerTitle").textContent = clip.title;
    $("#playerEnd").hidden = true; player.classList.remove("is-ended");
    player.hidden = false; document.body.classList.add("no-scroll");
    playerOpen = true;
    st.scene = SCENES[id](1, 1, { preview: false });
    fitPlayer();
    setPlaying(true);
    setSound(withSound);
    updateClock();
    cancelAnimationFrame(st.raf); st.raf = requestAnimationFrame(tick);
    requestAnimationFrame(() => player.classList.add("is-open"));
    $("#playerClose").focus();
  }
  function closePlayer() {
    ambient.stop();
    st.sound = false; st.ended = false;
    cancelAnimationFrame(st.raf);
    player.classList.remove("is-open");
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setTimeout(() => { player.hidden = true; }, 500);
    document.body.classList.remove("no-scroll");
    playerOpen = false;
    st.lastFocus && st.lastFocus.focus();
  }
  grid.addEventListener("click", (e) => { const b = e.target.closest("[data-clip]"); if (b) openPlayer(b.dataset.clip); });
  $("#playerClose").addEventListener("click", closePlayer);
  $("#playerPlay").addEventListener("click", () => {
    if (st.ended) { st.elapsed = 0; st.ended = false; $("#playerEnd").hidden = true; player.classList.remove("is-ended"); if (st.sound) setSound(true); }
    setPlaying(!st.playing);
  });
  $("#playerSound").addEventListener("click", () => setSound(!st.sound));
  $("#playerDuration").addEventListener("change", (e) => { st.duration = +e.target.value; st.elapsed = 0; st.ended = false; $("#playerEnd").hidden = true; player.classList.remove("is-ended"); updateClock(); });
  $("#playerFull").addEventListener("click", () => {
    if (!document.fullscreenElement) player.requestFullscreen && player.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  });
  addEventListener("resize", () => { if (playerOpen) fitPlayer(); });
  addEventListener("keydown", (e) => {
    if (!playerOpen) return;
    if (e.key === "Escape" && !document.fullscreenElement) closePlayer();
    if (e.key === " " && e.target.tagName !== "SELECT" && e.target.tagName !== "BUTTON") { e.preventDefault(); setPlaying(!st.playing); }
    if (e.key === "Tab") { // mantener el foco dentro del diálogo
      const f = $$("button, select", player).filter((x) => !x.closest("[hidden]"));
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  // Ocultar controles cuando no hay movimiento
  let idle;
  player.addEventListener("pointermove", () => {
    player.classList.remove("is-idle"); clearTimeout(idle);
    idle = setTimeout(() => st.playing && player.classList.add("is-idle"), 3000);
  });

  /* ---------- Chakras ---------- */
  const axis = $("#chakraAxis"), card = $("#chakraCard");
  axis.innerHTML = CHAKRAS.map((c, i) => `
    <li><button class="chakra-dot" style="--c:${c.color}" data-i="${i}" aria-label="${c.name} · ${c.sanskrit}">
      <span class="chakra-dot__orb"></span><span class="chakra-dot__name">${c.name}</span>
    </button></li>`).join("");
  function showChakra(i) {
    const c = CHAKRAS[i];
    $$(".chakra-dot", axis).forEach((b, j) => b.classList.toggle("is-active", i === j));
    card.style.setProperty("--c", c.color);
    card.innerHTML = `
      <p class="chakra-card__num">${7 - i} · ${esc(c.sanskrit)}</p>
      <h3>${esc(c.name)}</h3>
      <p class="chakra-card__theme">${esc(c.theme)}</p>
      <dl class="chakra-card__facts">
        <div><dt>Ubicación</dt><dd>${esc(c.place)}</dd></div>
        <div><dt>Elemento</dt><dd>${esc(c.element)}</dd></div>
        <div><dt>Mantra</dt><dd>${esc(c.mantra)}</dd></div>
        <div><dt>Frecuencia</dt><dd>${c.hz} Hz</dd></div>
      </dl>
      <blockquote class="chakra-card__aff">«${esc(c.affirmation)}»</blockquote>
      <p class="chakra-card__practice"><strong>Práctica:</strong> ${esc(c.practice)}</p>
      <button class="btn btn--small btn--ghost" data-tone="${c.hz}">Escuchar ${c.hz} Hz</button>`;
    card.classList.remove("is-swap"); void card.offsetWidth; card.classList.add("is-swap");
  }
  axis.addEventListener("click", (e) => { const b = e.target.closest(".chakra-dot"); if (b) showChakra(+b.dataset.i); });
  showChakra(3);
  // Tono breve de la frecuencia asociada
  let toneCtx;
  card.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tone]"); if (!b) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    toneCtx = toneCtx || new AC();
    const o = toneCtx.createOscillator(), g = toneCtx.createGain(), t = toneCtx.currentTime;
    o.frequency.value = +b.dataset.tone; o.type = "sine";
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.8); g.gain.linearRampToValueAtTime(0, t + 5);
    o.connect(g).connect(toneCtx.destination); o.start(t); o.stop(t + 5.2);
  });

  /* ---------- Series del canal ---------- */
  $("#seriesGrid").innerHTML = SERIES.map((s, i) => `
    <article class="serie reveal" style="--d:${i * 70}ms;--a:${s.hue[0]};--b:${s.hue[1]};--acc:${s.accent}">
      <div class="serie__thumb">
        <img src="assets/img/emblem.svg" alt="" aria-hidden="true" />
        <span class="serie__script">${esc(s.script)}</span>
        <span class="serie__title">${esc(s.title)}</span>
        <span class="serie__badge">Volver a Ti</span>
      </div>
      <div class="serie__body">
        <p>${esc(s.text)}</p>
        <ul>${s.examples.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
    </article>`).join("");

  // Directo 24/7: YouTube muestra automáticamente la emisión activa del canal
  if (/^UC[\w-]{22}$/.test(CFG.channelId || "")) {
    $("#live").hidden = false;
    $("#liveFrame").src = `https://www.youtube.com/embed/live_stream?channel=${CFG.channelId}&mute=1&autoplay=1`;
  }

  // Últimos vídeos: los que añade GitHub Actions (assets/data/videos.json) + los de config.js
  fetch("assets/data/videos.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : { videos: [] }))
    .catch(() => ({ videos: [] }))
    .then((d) => {
      const seen = new Set();
      renderLatest([...(d.videos || []), ...(CFG.videos || [])].filter((v) => /^[\w-]{11}$/.test(v.id) && !seen.has(v.id) && seen.add(v.id)));
    });
  function renderLatest(vids) {
  if (vids.length) {
    $("#latest").hidden = false;
    $("#latestGrid").innerHTML = vids.map((v) => `
      <article class="yt reveal">
        <button class="yt__frame" data-yt="${v.id}" aria-label="Reproducir ${esc(v.title)}">
          <img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy" />
          <span class="clip__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor"/></svg></span>
          ${v.duration ? `<span class="yt__dur">${esc(v.duration)}</span>` : ""}
        </button>
        <h4>${esc(v.title)}</h4>
      </article>`).join("");
    $("#latestGrid").addEventListener("click", (e) => {
      const b = e.target.closest("[data-yt]"); if (!b) return;
      b.outerHTML = `<div class="yt__frame"><iframe src="https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0" title="YouTube" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
    });
    observeReveals();
  }
  }

  /* ---------- Estudio: prompts cinematográficos ---------- */
  const filters = $("#studioFilters"), sgrid = $("#studioGrid");
  filters.innerHTML = PROMPT_CATS.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-cat="${c.id}">${esc(c.label)}</button>`).join("");
  const catLabel = (id) => (PROMPT_CATS.find((c) => c.id === id) || {}).label || id;
  function renderPrompts(cat) {
    const list = PROMPTS.filter((p) => cat === "all" || p.cat === cat);
    sgrid.innerHTML = list.map((p) => {
      const i = PROMPTS.indexOf(p);
      return `
      <article class="prompt">
        <header>
          <span class="prompt__cat">${esc(catLabel(p.cat))}</span>
          <ul class="tags tags--small"><li>${esc(p.format)}</li><li>${esc(p.length)}</li><li>${esc(p.use)}</li></ul>
        </header>
        <h3>${esc(p.title)}</h3>
        <p class="prompt__text" id="prompt-${i}">${esc(p.prompt)}</p>
        <div class="prompt__actions">
          <button class="btn btn--small btn--gold" data-copy="${i}" data-full="1">Copiar con estilo de marca</button>
          <button class="btn btn--small btn--ghost" data-copy="${i}">Copiar prompt</button>
        </div>
      </article>`;
    }).join("");
  }
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    $$("[data-cat]", filters).forEach((x) => x.setAttribute("aria-selected", x === b));
    renderPrompts(b.dataset.cat);
  });
  renderPrompts("all");
  $("#styleSuffix").textContent = STYLE_SUFFIX;

  const toast = $("#toast");
  const say = (msg) => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("is-on"), 2200); };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    say("Copiado al portapapeles");
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy]");
    if (b) { const p = PROMPTS[+b.dataset.copy]; copy(b.dataset.full ? `${p.prompt}\n\n${STYLE_SUFFIX}\nAspect ratio ${p.format}, duration ${p.length}.` : p.prompt); }
    const s = e.target.closest("[data-copy-target]");
    if (s) copy($("#" + s.dataset.copyTarget).textContent);
  });

  observeReveals();
})();
