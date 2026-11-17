/* =========================================================
   PowerVane · Power App
   Dashboard · Body Evolution 360° · Nutrición
   Todo se guarda en el propio dispositivo (localStorage). Sin servidor.
   ========================================================= */
(() => {
  const root = document.getElementById("power-app");
  if (!root) return;

  /* ---------- Estado ---------- */
  const KEY = "powervane-app-v1";
  const empty = () => ({
    profile: {}, measures: [], trainings: [], weekTarget: 4, goals: [],
    activity: {}, activityGoals: { kcal: 2000, steps: 8000, min: 45 },
    level: [], photos: [], lifts: [],
    nutri: {}, meals: [], water: {}, shop: [], demo: false,
    routines: [], sessions: [], plan: {}, habits: {}, badgesSeen: [],
  });
  let S;
  try { S = Object.assign(empty(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { S = empty(); }
  let warned = false;
  function hasReal() { return !S.demo && (S.measures.length + S.photos.length + S.lifts.length + S.meals.length + S.trainings.length + S.level.length) > 0; }
  const save = () => {
    if (hasReal() && !S.createdAt) S.createdAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch {
      if (warned) return;
      warned = true;
      const big = JSON.stringify(S).length > 4e6;
      alert(big
        ? "No queda espacio en este dispositivo. Borra alguna foto o guarda una copia y empieza de nuevo."
        : "Tu navegador no permite guardar datos (¿modo privado?). Puedes usar la app, pero se borrará al cerrar la página.");
    }
  };

  /* ---------- Utilidades ---------- */
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = (s) => new Date(s + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const fmtMonth = (m) => new Date(m + "-15T12:00:00").toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const num = (v) => (v === "" || v == null || isNaN(+v) ? null : +v);
  const fmt = (n, d = 1) => (n == null ? "—" : (+n).toLocaleString("es-ES", { maximumFractionDigits: d }));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const sorted = (arr, k = "date") => [...arr].sort((a, b) => (a[k] < b[k] ? -1 : 1));
  const setRing = (el, p) => { const c = 2 * Math.PI * 52; el.style.strokeDasharray = c; el.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(1, p))); };
  const formData = (f) => Object.fromEntries(new FormData(f).entries());
  document.querySelectorAll('#power-app input[type="date"]').forEach((i) => (i.value = today()));
  const monthInput = document.querySelector('#photoForm [name="month"]');
  if (monthInput) monthInput.value = today().slice(0, 7);

  /* ---------- Módulos (barra superior, barra inferior tipo app y accesos desde la web) ---------- */
  let current = "dash";
  const go = (tab, { scroll = true } = {}) => {
    if (!$("tab-" + tab)) return;
    current = tab;
    root.querySelectorAll("[data-tab]").forEach((x) => {
      const on = x.dataset.tab === tab;
      x.classList.toggle("is-active", on);
      if (x.getAttribute("role") === "tab") x.setAttribute("aria-selected", on);
    });
    root.querySelectorAll(".tabpanel").forEach((p) => { const on = p.id === "tab-" + tab; p.hidden = !on; p.classList.toggle("is-active", on); });
    render();
    if (scroll) {
      const bar = root.querySelector(".app__bar");
      const anchor = bar && bar.offsetParent ? bar : $("tab-" + tab);
      const top = anchor.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).scrollPaddingTop) || 80) - 14;
      if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top, behavior: "smooth" });
    }
  };
  root.querySelectorAll("[data-tab]").forEach((t) => t.addEventListener("click", () => go(t.dataset.tab)));
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]");
    if (!g) return;
    e.preventDefault();
    go(g.dataset.go);
  });

  const ICONS = {
    scale: '<svg viewBox="0 0 24 24"><path d="M5 20h14l-2-12H7L5 20zM9 8a3 3 0 0 1 6 0"/></svg>',
    photo: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/></svg>',
  };
  const lineChart = (box, points, unit) => {
    if (points.length < 2) {
      box.innerHTML = `<p class="chart__empty">${points.length ? "Añade otro registro para ver la gráfica" : "Aún no hay registros"}</p>`;
      return;
    }
    const W = Math.max(320, Math.round(box.clientWidth) || 560), H = 220, P = { l: 44, r: 16, t: 18, b: 34 };
    const ys = points.map((p) => p.v), min = Math.min(...ys), max = Math.max(...ys);
    const span = max - min || 1, lo = min - span * 0.15, hi = max + span * 0.15;
    const x = (i) => P.l + (i * (W - P.l - P.r)) / (points.length - 1);
    const y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const area = `${path} L${x(points.length - 1)},${H - P.b} L${x(0)},${H - P.b} Z`;
    const grid = [0, 0.5, 1].map((f) => { const v = lo + f * (hi - lo); return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="chart__grid"/><text x="${P.l - 8}" y="${y(v) + 4}" text-anchor="end" class="chart__axis">${fmt(v)}</text>`; }).join("");
    const step = Math.ceil(points.length / 6);
    const labels = points.map((p, i) => (i % step === 0 || i === points.length - 1) ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle" class="chart__axis">${esc(p.l)}</text>` : "").join("");
    const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4" class="chart__dot"><title>${esc(p.l)}: ${fmt(p.v)} ${unit}</title></circle>`).join("");
    const first = points[0].v, last = points[points.length - 1].v, diff = last - first;
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart__svg" role="img" aria-label="Evolución: de ${fmt(first)} a ${fmt(last)} ${unit}">
      <defs><linearGradient id="g-${box.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E45A9B" stop-opacity=".35"/><stop offset="1" stop-color="#E45A9B" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#g-${box.id})"/><path d="${path}" class="chart__line"/>${dots}${labels}</svg>
      <p class="chart__summary">${fmt(first)} <span class="chart__arrow">›</span> <strong>${fmt(last)} ${unit}</strong> <span class="${diff <= 0 ? "down" : "up"}">(${diff > 0 ? "+" : ""}${fmt(diff)})</span></p>`;
  };

  /* =========================================================
     DASHBOARD
     ========================================================= */
  const latestWeight = () => { const m = sorted(S.measures).filter((x) => x.weight != null); return m.length ? m[m.length - 1].weight : null; };

  const streak = () => {
    const set = new Set(S.trainings);
    let d = set.has(today()) ? today() : addDays(today(), -1), n = 0;
    while (set.has(d)) { n++; d = addDays(d, -1); }
    return n;
  };

  const weekDates = () => {
    const now = new Date(today() + "T12:00:00"), dow = (now.getDay() + 6) % 7;
    const monday = addDays(today(), -dow);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  };

  const levelFrom = ({ squats, pushups, plank }) => {
    // Referencias orientativas para mujeres adultas
    const s = Math.min(squats / 45, 1), p = Math.min(pushups / 25, 1), k = Math.min(plank / 120, 1);
    const score = Math.round(((s + p + k) / 3) * 100);
    const name = score < 35 ? "Principiante" : score < 60 ? "Intermedia" : score < 85 ? "Avanzada" : "Élite";
    return { score, name };
  };

  const renderDash = () => {
    const pr = S.profile, cur = latestWeight();
    // Progreso
    let p = 0, note = "Define tu peso inicial y objetivo";
    if (pr.startWeight && pr.goalWeight && cur != null && pr.startWeight !== pr.goalWeight) {
      p = Math.max(0, Math.min(1, (pr.startWeight - cur) / (pr.startWeight - pr.goalWeight)));
      const left = Math.abs(cur - pr.goalWeight);
      note = p >= 1 ? "¡Objetivo conseguido! 💗" : `Te quedan ${fmt(left)} kg para tu objetivo`;
    } else if (pr.startWeight && pr.goalWeight) note = "Añade un registro de peso";
    $("kProgress").textContent = Math.round(p * 100) + "%";
    $("kProgressNote").textContent = note;
    setRing($("ringProgress"), p);

    // Peso
    $("kWeight").innerHTML = cur != null ? `${fmt(cur)}<small> kg</small>` : "—";
    const ms = sorted(S.measures).filter((x) => x.weight != null);
    $("kWeightDelta").textContent = ms.length > 1 ? `${ms[ms.length - 1].weight - ms[0].weight > 0 ? "+" : ""}${fmt(ms[ms.length - 1].weight - ms[0].weight)} kg desde ${fmtDate(ms[0].date)}` : ms.length ? `Registrado el ${fmtDate(ms[0].date)}` : "Añade tu primer registro";

    // Racha
    $("kStreak").textContent = streak();
    const done = S.trainings.includes(today());
    $("trainToday").textContent = done ? "¡Hoy ya entrenaste!" : "He entrenado hoy";
    $("trainToday").classList.toggle("is-done", done);

    // Nivel
    const lv = S.level.length ? sorted(S.level).at(-1) : null;
    $("kLevel").textContent = lv ? `${lv.name} · ${lv.score}/100` : "Sin evaluar";
    $("kLevelBar").style.width = (lv ? lv.score : 0) + "%";

    // Perfil
    const pf = $("profileForm");
    if (pr.startWeight) pf.startWeight.value = pr.startWeight;
    if (pr.goalWeight) pf.goalWeight.value = pr.goalWeight;

    // Semana
    const names = ["L", "M", "X", "J", "V", "S", "D"];
    const wk = weekDates();
    $("weekDays").innerHTML = wk.map((d, i) => `<button type="button" class="day ${S.trainings.includes(d) ? "is-on" : ""} ${d === today() ? "is-today" : ""}" data-day="${d}" aria-pressed="${S.trainings.includes(d)}" ${d > today() ? "disabled" : ""}><span>${names[i]}</span><small>${+d.slice(8)}</small></button>`).join("");
    const doneWeek = wk.filter((d) => S.trainings.includes(d)).length;
    $("weekDone").textContent = doneWeek;
    $("weekTarget").value = S.weekTarget;
    $("weekBar").style.width = Math.min(100, (doneWeek / S.weekTarget) * 100) + "%";
    $("goalsList").innerHTML = S.goals.length ? S.goals.map((g) => `<li class="${g.done ? "is-done" : ""}"><label><input type="checkbox" data-goal="${g.id}" ${g.done ? "checked" : ""}/> <span>${esc(g.text)}</span></label><button type="button" class="x" data-goal-del="${g.id}" aria-label="Eliminar objetivo">×</button></li>`).join("") : `<li class="muted">Añade tus objetivos de la semana</li>`;

    // Actividad
    const a = S.activity[today()] || {}, ag = S.activityGoals;
    $("vKcal").textContent = fmt(a.kcal || 0, 0); setRing($("rKcal"), (a.kcal || 0) / ag.kcal);
    $("vSteps").textContent = fmt(a.steps || 0, 0); setRing($("rSteps"), (a.steps || 0) / ag.steps);
    $("vMin").textContent = fmt(a.min || 0, 0); setRing($("rMin"), (a.min || 0) / ag.min);
    const af = $("activityForm");
    ["kcal", "steps", "min"].forEach((k) => { af[k].value = a[k] ?? ""; af[k + "Goal"].value = ag[k]; });
  };

  $("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    S.profile = { startWeight: num(d.startWeight), goalWeight: num(d.goalWeight) };
    save(); render();
  });
  $("measureForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const entry = { id: uid(), date: d.date, weight: num(d.weight), waist: num(d.waist), hip: num(d.hip), thigh: num(d.thigh), arm: num(d.arm) };
    if (["weight", "waist", "hip", "thigh", "arm"].every((k) => entry[k] == null)) return;
    S.measures = S.measures.filter((m) => m.date !== entry.date).concat(entry);
    if (!S.profile.startWeight && entry.weight) S.profile.startWeight = entry.weight;
    save(); e.target.reset(); e.target.date.value = today(); render();
  });
  $("trainToday").addEventListener("click", () => {
    if (!S.trainings.includes(today())) S.trainings.push(today());
    save(); render();
  });
  $("weekDays").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]"); if (!b) return;
    const d = b.dataset.day;
    S.trainings = S.trainings.includes(d) ? S.trainings.filter((x) => x !== d) : S.trainings.concat(d);
    save(); render();
  });
  $("weekTarget").addEventListener("change", (e) => { S.weekTarget = Math.max(1, Math.min(7, +e.target.value || 4)); save(); render(); });
  $("goalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = e.target.goal.value.trim(); if (!t) return;
    S.goals.push({ id: uid(), text: t, done: false }); save(); e.target.reset(); render();
  });
  $("goalsList").addEventListener("change", (e) => { const g = S.goals.find((x) => x.id === e.target.dataset.goal); if (g) { g.done = e.target.checked; save(); render(); } });
  $("goalsList").addEventListener("click", (e) => { const id = e.target.dataset.goalDel; if (id) { S.goals = S.goals.filter((g) => g.id !== id); save(); render(); } });
  $("activityForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    S.activity[today()] = { kcal: num(d.kcal) || 0, steps: num(d.steps) || 0, min: num(d.min) || 0 };
    S.activityGoals = { kcal: num(d.kcalGoal) || 2000, steps: num(d.stepsGoal) || 8000, min: num(d.minGoal) || 45 };
    save(); render();
  });
  $("levelForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const r = levelFrom({ squats: +d.squats, pushups: +d.pushups, plank: +d.plank });
    S.level.push({ date: today(), ...r }); save(); render();
  });

  /* =========================================================
     BODY EVOLUTION 360°
     ========================================================= */
  const resizePhoto = (file) => new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = rej; img.src = url;
  });

  const epley = (kg, reps) => kg * (1 + reps / 30);

  const renderEvo = () => {
    // Fotos mensuales
    const ph = sorted(S.photos, "month");
    $("months").innerHTML = ph.length ? ph.map((p) => `<figure class="month"><img src="${p.src}" alt="Foto de ${esc(fmtMonth(p.month))}" loading="lazy"/><figcaption>${esc(fmtMonth(p.month))}</figcaption><button type="button" class="x" data-photo-del="${p.id}" aria-label="Eliminar foto">×</button></figure>`).join("") : `<p class="muted">Sube una foto cada mes, con la misma luz y postura.</p>`;

    // Comparador
    const opts = ph.map((p) => `<option value="${p.id}">${esc(fmtMonth(p.month))}</option>`).join("");
    const a = $("cmpSelA"), b = $("cmpSelB"), va = a.value, vb = b.value;
    a.innerHTML = opts; b.innerHTML = opts;
    if (ph.length) {
      a.value = ph.some((p) => p.id === va) ? va : ph[0].id;
      b.value = ph.some((p) => p.id === vb) ? vb : ph[ph.length - 1].id;
    }
    const pa = ph.find((p) => p.id === a.value), pb = ph.find((p) => p.id === b.value);
    const ready = ph.length >= 2 && pa && pb;
    $("compare").classList.toggle("is-ready", !!ready);
    $("cmpBefore").style.backgroundImage = ready ? `url(${pa.src})` : "";
    $("cmpAfter").style.backgroundImage = ready ? `url(${pb.src})` : "";

    // Medidas
    const metric = $("chartMetric").value, units = { weight: "kg" };
    lineChart($("chartMeasures"), sorted(S.measures).filter((m) => m[metric] != null).map((m) => ({ l: fmtDate(m.date).replace(/ de \d{4}| \d{4}/, ""), v: m[metric] })), units[metric] || "cm");

    // Fuerza
    const lifts = [...new Set(S.lifts.map((l) => l.lift))];
    const sel = $("chartLift"), cur = sel.value;
    sel.innerHTML = lifts.length ? lifts.map((l) => `<option>${esc(l)}</option>`).join("") : `<option>Sin series</option>`;
    if (lifts.includes(cur)) sel.value = cur;
    const byDate = {};
    S.lifts.filter((l) => l.lift === sel.value).forEach((l) => { const rm = epley(l.kg, l.reps); byDate[l.date] = Math.max(byDate[l.date] || 0, rm); });
    lineChart($("chartLiftBox"), Object.keys(byDate).sort().map((d) => ({ l: fmtDate(d).replace(/ de \d{4}| \d{4}/, ""), v: Math.round(byDate[d] * 10) / 10 })), "kg (1RM)");

    // Línea temporal
    const ev = [];
    sorted(S.measures).forEach((m) => ev.push({ date: m.date, icon: "scale", text: [m.weight != null && `Peso ${fmt(m.weight)} kg`, m.waist != null && `cintura ${fmt(m.waist)} cm`, m.hip != null && `cadera ${fmt(m.hip)} cm`].filter(Boolean).join(" · ") || "Nuevas medidas" }));
    ph.forEach((p) => ev.push({ date: p.month + "-01", icon: "photo", text: `Foto de ${fmtMonth(p.month)}`, img: p.src }));
    S.level.forEach((l) => ev.push({ date: l.date, icon: "star", text: `Test de nivel: ${l.name} (${l.score}/100)` }));
    const best = {};
    sorted(S.lifts).forEach((l) => { const rm = epley(l.kg, l.reps); if (!best[l.lift] || rm > best[l.lift]) { if (best[l.lift]) ev.push({ date: l.date, icon: "trophy", text: `Récord en ${l.lift}: ${fmt(l.kg)} kg × ${l.reps}` }); best[l.lift] = rm; } });
    ev.sort((x, y) => (x.date < y.date ? 1 : -1));
    $("timeline").innerHTML = ev.length ? ev.slice(0, 30).map((e) => `<li><span class="timeline__dot" aria-hidden="true">${ICONS[e.icon]}</span><div><time>${esc(fmtDate(e.date))}</time><p>${esc(e.text)}</p></div>${e.img ? `<img src="${e.img}" alt="" loading="lazy"/>` : ""}</li>`).join("") : `<li class="muted">Tu historia empieza con tu primer registro 💗</li>`;
  };

  $("photoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target.photo.files[0], month = e.target.month.value;
    if (!f || !month) return;
    try {
      const src = await resizePhoto(f);
      S.photos = S.photos.filter((p) => p.month !== month).concat({ id: uid(), month, src });
      save(); e.target.photo.value = ""; render();
    } catch { alert("No se ha podido leer la foto. Prueba con otra imagen."); }
  });
  $("months").addEventListener("click", (e) => { const id = e.target.dataset.photoDel; if (id && confirm("¿Eliminar esta foto?")) { S.photos = S.photos.filter((p) => p.id !== id); save(); render(); } });
  ["cmpSelA", "cmpSelB", "chartMetric", "chartLift"].forEach((id) => $(id).addEventListener("change", render));
  const cmpRange = $("cmpRange");
  const setCmp = () => { $("compare").style.setProperty("--pos", cmpRange.value + "%"); };
  cmpRange.addEventListener("input", setCmp); setCmp();
  $("liftForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    S.lifts.push({ id: uid(), lift: d.lift, date: d.date, kg: +d.kg, reps: +d.reps });
    save(); e.target.kg.value = ""; e.target.reps.value = "";
    $("chartLift").innerHTML = `<option>${esc(d.lift)}</option>`; render();
  });

  /* =========================================================
     NUTRICIÓN INTELIGENTE
     Valores aproximados por ración con tablas de composición estándar.
     ========================================================= */
  const RECIPES = [
    { id: "bowl", name: "Bowl de yogur griego con avena y frutos rojos", meal: "Desayuno", kcal: 340, prot: 26, time: "5 min",
      tags: ["veg"], ing: ["200 g de yogur griego natural 0 %", "40 g de copos de avena", "100 g de frutos rojos", "1 cucharadita de miel"],
      steps: "Pon el yogur en un bol, añade la avena y los frutos rojos y termina con la miel." },
    { id: "tortilla", name: "Tortilla de huevo y claras con espinacas y pan integral", meal: "Desayuno", kcal: 355, prot: 33, time: "10 min",
      tags: ["veg", "lf"], ing: ["2 huevos", "100 g de claras de huevo", "60 g de espinacas", "60 g de pan integral"],
      steps: "Saltea las espinacas, añade los huevos batidos con las claras y cuaja a fuego medio. Acompaña con el pan tostado." },
    { id: "pollo", name: "Pollo al horno con boniato y brócoli", meal: "Comida", kcal: 480, prot: 42, time: "35 min",
      tags: ["gf", "lf"], ing: ["150 g de pechuga de pollo", "200 g de boniato", "150 g de brócoli", "10 g de aceite de oliva virgen extra"],
      steps: "Corta el boniato en dados y hornéalo 20 min a 200 °C con la mitad del aceite. Añade el pollo y el brócoli con el resto del aceite y hornea 15 min más." },
    { id: "salmon", name: "Salmón con quinoa y verduras salteadas", meal: "Cena", kcal: 565, prot: 36, time: "25 min",
      tags: ["gf", "lf"], ing: ["130 g de salmón", "60 g de quinoa (en crudo)", "150 g de calabacín y pimiento", "5 g de aceite de oliva virgen extra"],
      steps: "Cuece la quinoa 12 min. Saltea las verduras con el aceite y haz el salmón a la plancha 3-4 min por lado." },
    { id: "lentejas", name: "Bowl vegano de lentejas, tofu y arroz integral", meal: "Comida", kcal: 575, prot: 36, time: "20 min",
      tags: ["veg", "vegan", "gf", "lf"], ing: ["150 g de lentejas cocidas", "100 g de tofu firme", "50 g de arroz integral (en crudo)", "100 g de verduras de temporada", "5 g de aceite de oliva virgen extra"],
      steps: "Cuece el arroz. Dora el tofu en dados con el aceite, añade las verduras y las lentejas y sirve sobre el arroz." },
    { id: "batido", name: "Batido post-entreno de proteína y plátano", meal: "Merienda", kcal: 310, prot: 34, time: "3 min",
      tags: ["veg", "gf"], ing: ["30 g de proteína whey", "1 plátano (120 g)", "250 ml de leche desnatada"],
      steps: "Bate todo con hielo hasta que quede cremoso. Para la versión sin lactosa usa proteína aislada y bebida vegetal." },
  ];
  const PREF_LABEL = { omni: "Como de todo", veg: "Vegetariana", vegan: "Vegana", gf: "Sin gluten", lf: "Sin lactosa" };
  const fits = (r, pref) => pref === "omni" || r.tags.includes(pref) || (pref === "veg" && r.tags.includes("vegan"));
  const TAG_LABEL = { veg: "Vegetariana", vegan: "Vegana", gf: "Sin gluten", lf: "Sin lactosa" };

  const calcPlan = (n) => {
    const bmr = 10 * n.weight + 6.25 * n.height - 5 * n.age - 161; // Mifflin-St Jeor, mujer
    const tdee = bmr * n.activity;
    const kcal = Math.round((tdee * (1 + n.goal)) / 10) * 10;
    const prot = Math.round(n.weight * (n.goal > 0 ? 2 : 1.8));
    const fat = Math.round((kcal * 0.28) / 9);
    const carbs = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4));
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, prot, fat, carbs };
  };

  const renderNutri = () => {
    const n = S.nutri, pref = n.pref || "omni", f = $("nutriForm");
    ["age", "height", "weight", "activity", "goal", "pref"].forEach((k) => { if (n[k] != null) f[k].value = n[k]; });
    if (!n.weight && latestWeight()) f.weight.value = latestWeight();

    // Plan
    if (n.age && n.height && n.weight) {
      const p = calcPlan(n);
      const split = [["Desayuno", 0.25], ["Comida", 0.35], ["Merienda", 0.1], ["Cena", 0.3]];
      $("plan").innerHTML = `
        <div class="plan__macros">
          <div><strong>${fmt(p.kcal, 0)}</strong><span>kcal / día</span></div>
          <div><strong>${p.prot} g</strong><span>proteína</span></div>
          <div><strong>${p.carbs} g</strong><span>hidratos</span></div>
          <div><strong>${p.fat} g</strong><span>grasas</span></div>
        </div>
        <ol class="plan__day">${split.map(([meal, share]) => {
          const opts = RECIPES.filter((r) => r.meal === meal && fits(r, pref));
          const alt = RECIPES.filter((r) => fits(r, pref) && r.meal !== "Merienda");
          const r = opts[0] || (meal === "Merienda" ? null : alt[0]);
          return `<li><span class="plan__meal">${meal}</span><span class="plan__kcal">~ ${fmt(Math.round((p.kcal * share) / 10) * 10, 0)} kcal</span><span class="plan__idea">${r ? `Idea: ${esc(r.name)}` : "Fruta + un lácteo o alternativa vegetal"}</span></li>`;
        }).join("")}</ol>
        <p class="panel__note">Metabolismo basal ~ ${fmt(p.bmr, 0)} kcal · gasto diario estimado ~ ${fmt(p.tdee, 0)} kcal · preferencia: ${PREF_LABEL[pref]}.</p>`;
    } else {
      $("plan").innerHTML = `<p class="muted">Rellena tus datos para ver tus calorías, tus macros y un día de comidas de ejemplo.</p>`;
    }

    // Recetas
    const list = RECIPES.filter((r) => fits(r, pref));
    $("recipeFilterNote").textContent = `Filtradas para: ${PREF_LABEL[pref]}`;
    $("recipes").innerHTML = list.map((r) => `
      <details class="recipe">
        <summary>
          <span class="recipe__meal">${r.meal} · ${r.time}</span>
          <span class="recipe__name">${esc(r.name)}</span>
          <span class="recipe__macros">~ ${r.kcal} kcal · ${r.prot} g proteína</span>
          <span class="recipe__tags">${r.tags.map((t) => `<i>${TAG_LABEL[t]}</i>`).join("")}</span>
        </summary>
        <ul>${r.ing.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        <p>${esc(r.steps)}</p>
        <button type="button" class="btn btn--line btn--small" data-shop-recipe="${r.id}">Añadir a la lista de la compra</button>
      </details>`).join("") || `<p class="muted">No hay recetas para este filtro.</p>`;

    // Comidas de hoy
    const meals = S.meals.filter((m) => m.date === today());
    $("meals").innerHTML = meals.length ? meals.map((m) => `<li><span class="meals__type">${esc(m.type)}</span><span>${esc(m.desc)}</span><span class="meals__kcal">${m.kcal != null ? fmt(m.kcal, 0) + " kcal" : ""}</span><button type="button" class="x" data-meal-del="${m.id}" aria-label="Eliminar comida">×</button></li>`).join("") : `<li class="muted">Aún no has registrado comidas hoy</li>`;
    const total = meals.reduce((s, m) => s + (m.kcal || 0), 0);
    const target = n.age && n.height && n.weight ? calcPlan(n).kcal : null;
    $("mealTotal").textContent = meals.length ? `Total: ${fmt(total, 0)} kcal${target ? ` de ~ ${fmt(target, 0)} kcal` : ""}` : "";

    // Agua
    const w = latestWeight() || n.weight;
    const goalL = w ? Math.round(w * 0.035 * 10) / 10 : 2;
    const ml = S.water[today()] || 0;
    $("waterNow").textContent = fmt(ml / 1000, 2);
    $("waterGoal").textContent = fmt(goalL, 1);
    $("waterFill").style.height = Math.min(100, (ml / (goalL * 1000)) * 100) + "%";

    // Compra
    $("shop").innerHTML = S.shop.length ? S.shop.map((s) => `<li class="${s.done ? "is-done" : ""}"><label><input type="checkbox" data-shop="${s.id}" ${s.done ? "checked" : ""}/> <span>${esc(s.text)}</span></label><button type="button" class="x" data-shop-del="${s.id}" aria-label="Eliminar producto">×</button></li>`).join("") : `<li class="muted">Añade productos o pulsa «Añadir a la lista» en una receta</li>`;
  };

  $("nutriForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    S.nutri = { age: +d.age, height: +d.height, weight: +d.weight, activity: +d.activity, goal: +d.goal, pref: d.pref };
    save(); render();
  });
  $("nutriPref").addEventListener("change", (e) => { S.nutri.pref = e.target.value; save(); render(); });
  $("recipes").addEventListener("click", (e) => {
    const id = e.target.dataset.shopRecipe; if (!id) return;
    const r = RECIPES.find((x) => x.id === id);
    r.ing.forEach((i) => { if (!S.shop.some((s) => s.text === i)) S.shop.push({ id: uid(), text: i, done: false }); });
    save(); render();
    e.target.textContent = "¡Añadida!";
  });
  $("mealForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = formData(e.target);
    S.meals.push({ id: uid(), date: today(), type: d.type, desc: d.desc.trim(), kcal: num(d.kcal) });
    save(); e.target.reset(); render();
  });
  $("meals").addEventListener("click", (e) => { const id = e.target.dataset.mealDel; if (id) { S.meals = S.meals.filter((m) => m.id !== id); save(); render(); } });
  root.querySelectorAll("[data-water]").forEach((b) => b.addEventListener("click", () => {
    S.water[today()] = Math.max(0, (S.water[today()] || 0) + +b.dataset.water); save(); render();
  }));
  $("shopForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = e.target.item.value.trim(); if (!t) return;
    S.shop.push({ id: uid(), text: t, done: false }); save(); e.target.reset(); render();
  });
  $("shop").addEventListener("change", (e) => { const s = S.shop.find((x) => x.id === e.target.dataset.shop); if (s) { s.done = e.target.checked; save(); render(); } });
  $("shop").addEventListener("click", (e) => { const id = e.target.dataset.shopDel; if (id) { S.shop = S.shop.filter((s) => s.id !== id); save(); render(); } });
  $("shopClear").addEventListener("click", () => { if (S.shop.length && confirm("¿Vaciar la lista de la compra?")) { S.shop = []; save(); render(); } });

  /* =========================================================
     Copia, ejemplo y borrado
     ========================================================= */
  /* Guardar copia: en el móvil abre "Compartir" (Archivos, Drive, WhatsApp a ti misma…); si no, descarga el archivo */
  const doBackup = async () => {
    const name = `powervane-copia-${today()}.json`;
    const blob = new Blob([JSON.stringify(S)], { type: "application/json" });
    let done = false;
    try {
      const file = new File([blob], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share({ files: [file], title: "Copia de mi Power App" });
        done = true;
      }
    } catch (err) { if (err && err.name === "AbortError") return; }
    if (!done) {
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }
    S.lastBackup = Date.now(); S.snooze = 0; save(); renderBackup();
  };
  $("appExport").addEventListener("click", doBackup);
  $("appImport").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== "object" || !Array.isArray(data.measures)) throw new Error("formato");
      S = Object.assign(empty(), data); S.lastBackup = Date.now(); save(); render();
    } catch { alert("Ese archivo no es una copia válida de la Power App."); }
    e.target.value = "";
  });

  /* Aviso de copia: si hay datos propios y hace más de 7 días que no se guarda copia */
  const DAY = 864e5;
  const renderBackup = () => {
    const ref = S.lastBackup || S.createdAt;
    const show = hasReal() && ref && Date.now() - ref > 7 * DAY && Date.now() > (S.snooze || 0);
    $("backupBanner").hidden = !show;
    if (!show) return;
    const days = Math.floor((Date.now() - ref) / DAY);
    $("backupText").textContent = S.lastBackup
      ? `Tu última copia fue hace ${days} días. Guárdala para no perder tu progreso si cambias de móvil.`
      : "Aún no has guardado ninguna copia. Guárdala para no perder tu progreso si cambias de móvil.";
  };
  $("backupNow").addEventListener("click", doBackup);
  $("backupLater").addEventListener("click", () => { S.snooze = Date.now() + 3 * DAY; save(); renderBackup(); });

  /* Enviar mi progreso a mi entrenadora (WhatsApp con un resumen) */
  const signed = (n) => (n > 0 ? "+" : "") + fmt(n);
  const buildSummary = (name) => {
    const L = [`¡Hola! 💗 Soy ${name}. Te envío mi progreso de la Power App (${fmtDate(today())}):`, ""];
    const ms = sorted(S.measures);
    const ws = ms.filter((m) => m.weight != null);
    if (ws.length) {
      const first = ws[0].weight, last = ws[ws.length - 1].weight;
      L.push(`⚖️ Peso: ${fmt(last)} kg${ws.length > 1 ? ` (empecé en ${fmt(first)} kg · ${signed(last - first)} kg)` : ""}`);
    }
    const pr = S.profile;
    if (pr.goalWeight) {
      const cur = latestWeight();
      const p = pr.startWeight && cur != null && pr.startWeight !== pr.goalWeight ? Math.max(0, Math.min(1, (pr.startWeight - cur) / (pr.startWeight - pr.goalWeight))) : null;
      L.push(`🎯 Objetivo: ${fmt(pr.goalWeight)} kg${p != null ? ` · progreso ${Math.round(p * 100)} %` : ""}`);
    }
    const parts = [["waist", "Cintura"], ["hip", "Cadera"], ["thigh", "Muslo"], ["arm", "Brazo"]].map(([k, label]) => {
      const v = ms.filter((m) => m[k] != null);
      if (!v.length) return null;
      const a = v[0][k], b = v[v.length - 1][k];
      return `${label} ${fmt(b)} cm${v.length > 1 && a !== b ? ` (${signed(b - a)})` : ""}`;
    }).filter(Boolean);
    if (parts.length) L.push(`📏 ${parts.join(" · ")}`);
    const week = weekDates().filter((d) => S.trainings.includes(d)).length;
    if (S.trainings.length) L.push(`🔥 Racha: ${streak()} días · Esta semana: ${week} de ${S.weekTarget} entrenos`);
    if (S.level.length) { const lv = sorted(S.level)[S.level.length - 1]; L.push(`⭐ Nivel: ${lv.name} (${lv.score}/100)`); }
    const best = {};
    S.lifts.forEach((l) => { const rm = epley(l.kg, l.reps); if (!best[l.lift] || rm > best[l.lift].rm) best[l.lift] = { rm, l }; });
    Object.entries(best).forEach(([lift, { rm, l }]) => L.push(`🏋️ ${lift}: ${fmt(l.kg)} kg × ${l.reps} (1RM estimado ${fmt(rm)} kg)`));
    if (S.goals.length) L.push(`✅ Objetivos semanales: ${S.goals.filter((g) => g.done).length} de ${S.goals.length} cumplidos`);
    const kcal = S.meals.filter((m) => m.date === today()).reduce((t, m) => t + (m.kcal || 0), 0);
    if (kcal) L.push(`🍽️ Hoy he comido unas ${fmt(kcal, 0)} kcal`);
    if (S.water[today()]) L.push(`💧 Agua hoy: ${fmt(S.water[today()] / 1000, 2)} L`);
    if (S.photos.length) L.push(`📸 Fotos de evolución: ${S.photos.length} (te las paso si las quieres ver)`);
    return L.join("\n");
  };
  const sendForm = $("sendForm"), sendName = $("sendName"), sendPreview = $("sendPreview");
  const sendSubmit = sendForm.querySelector('[type="submit"]');
  const updatePreview = () => {
    if (S.demo) { sendPreview.textContent = "Estás viendo datos de ejemplo. Quita el ejemplo y añade tus propios registros para poder enviarlos."; sendSubmit.disabled = true; return; }
    if (!hasReal()) { sendPreview.textContent = "Aún no tienes registros. Apunta tu peso, tus entrenos o tus medidas y vuelve aquí para enviarlos."; sendSubmit.disabled = true; return; }
    sendSubmit.disabled = false;
    sendPreview.textContent = buildSummary(sendName.value.trim() || "…");
  };
  $("appSend").addEventListener("click", () => {
    sendForm.hidden = !sendForm.hidden;
    if (sendForm.hidden) return;
    sendName.value = S.profile.name || "";
    updatePreview();
    sendForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!sendName.value) sendName.focus({ preventScroll: true });
  });
  sendName.addEventListener("input", updatePreview);
  $("sendCancel").addEventListener("click", () => { sendForm.hidden = true; });
  sendForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = sendName.value.trim();
    if (!name || S.demo || !hasReal()) return;
    S.profile.name = name; save();
    const url = window.PVwaText ? window.PVwaText(buildSummary(name)) : null;
    if (!url) return;
    const a = Object.assign(document.createElement("a"), { href: url, target: "_blank", rel: "noopener" });
    document.body.appendChild(a); a.click(); a.remove();
    sendForm.hidden = true;
  });

  /* Guía para instalar la app en la pantalla del móvil */
  const guide = $("installGuide"), done = $("installDone"), nowBtn = $("installNow");
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const HIDE = "powervane-install-hidden";
  let installEvt = null;
  const setOS = (os) => {
    guide.querySelectorAll("[data-os]").forEach((b) => { const on = b.dataset.os === os; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
    guide.querySelectorAll("[data-steps]").forEach((l) => (l.hidden = l.dataset.steps !== os));
  };
  guide.querySelectorAll("[data-os]").forEach((b) => b.addEventListener("click", () => setOS(b.dataset.os)));
  setOS(isAndroid ? "android" : "ios");
  const showGuide = (on) => { guide.hidden = !on; done.hidden = on; };
  const body = $("installBody"), toggle = $("installToggle");
  const openSteps = (on) => { body.hidden = !on; toggle.setAttribute("aria-expanded", on); guide.classList.toggle("is-open", on); };
  toggle.addEventListener("click", () => openSteps(body.hidden));
  let hidden = false; try { hidden = localStorage.getItem(HIDE) === "1"; } catch { /* sin almacenamiento */ }
  showGuide(!(standalone || hidden));
  if (standalone) done.firstChild.textContent = "Estás usando Power App instalada ";
  $("installHide").addEventListener("click", () => { try { localStorage.setItem(HIDE, "1"); } catch { /* */ } showGuide(false); });
  $("installShow").addEventListener("click", () => { try { localStorage.removeItem(HIDE); } catch { /* */ } showGuide(true); openSteps(true); guide.scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("appInstall").addEventListener("click", (e) => { e.preventDefault(); showGuide(true); openSteps(true); guide.scrollIntoView({ behavior: "smooth", block: "start" }); });
  const appUrl = new URL("./?app=1", location.href).href;
  const send = $("installSend");
  send.href = `https://api.whatsapp.com/send?text=${encodeURIComponent("Mi Power App de PowerVane & Wellness 💗 Ábrela en el móvil y añádela a la pantalla de inicio: " + appUrl)}`;
  if (isIOS || isAndroid) send.hidden = true; // ya está en el móvil
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; if (!standalone) nowBtn.hidden = false; });
  window.addEventListener("appinstalled", () => { installEvt = null; nowBtn.hidden = true; showGuide(false); });
  nowBtn.addEventListener("click", async () => {
    if (!installEvt) return;
    installEvt.prompt();
    const { outcome } = await installEvt.userChoice;
    installEvt = null;
    if (outcome === "accepted") { nowBtn.hidden = true; showGuide(false); }
  });

  $("appReset").addEventListener("click", () => { if (confirm("¿Borrar todos tus datos de este dispositivo? No se puede deshacer.")) { S = empty(); save(); render(); } });

  /* Datos de ejemplo claramente marcados, para enseñar la app */
  const demoPhoto = (hue) => {
    const c = document.createElement("canvas"); c.width = 300; c.height = 400;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 400);
    gr.addColorStop(0, `hsl(${hue},45%,22%)`); gr.addColorStop(1, "#100D12");
    g.fillStyle = gr; g.fillRect(0, 0, 300, 400);
    g.fillStyle = "rgba(233,166,194,.85)"; g.font = "italic 26px Georgia"; g.textAlign = "center";
    g.fillText("Foto de ejemplo", 150, 200);
    return c.toDataURL("image/jpeg", 0.7);
  };
  const loadDemo = () => {
    const d = empty(), t = today();
    d.demo = true;
    d.profile = { startWeight: 68, goalWeight: 62 };
    d.measures = [0, 1, 2, 3, 4, 5].map((i) => ({ id: uid(), date: addDays(t, -70 + i * 14), weight: [68, 67.2, 66.5, 65.6, 65, 64.3][i], waist: [76, 75, 74, 72.5, 71.5, 70.5][i], hip: [100, 99.5, 99, 98, 97.5, 97][i], thigh: [58, 57.5, 57, 56.5, 56, 55.5][i], arm: [28, 28, 27.8, 27.8, 27.5, 27.5][i] }));
    d.trainings = [0, 1, 2, 4, 5, 7, 8, 9, 11, 12].map((i) => addDays(t, -i));
    d.goals = [{ id: uid(), text: "8.000 pasos al día", done: true }, { id: uid(), text: "2 L de agua al día", done: false }, { id: uid(), text: "Dormir 7 horas", done: false }];
    d.activity[t] = { kcal: 1650, steps: 6400, min: 38 };
    d.level = [{ date: addDays(t, -60), score: 41, name: "Intermedia" }, { date: addDays(t, -2), score: 63, name: "Avanzada" }];
    d.photos = [0, 1, 2].map((i) => ({ id: uid(), month: addDays(t, -60 + i * 30).slice(0, 7), src: demoPhoto(330 - i * 8) }));
    d.lifts = [0, 1, 2, 3, 4].map((i) => ({ id: uid(), lift: "Hip thrust", date: addDays(t, -56 + i * 14), kg: [40, 50, 55, 62.5, 70][i], reps: 8 }));
    d.nutri = { age: 30, height: 165, weight: 64.3, activity: 1.55, goal: -0.15, pref: "omni" };
    d.meals = [{ id: uid(), date: t, type: "Desayuno", desc: "Bowl de yogur griego con avena", kcal: 340 }, { id: uid(), date: t, type: "Comida", desc: "Pollo al horno con boniato", kcal: 480 }];
    d.water[t] = 1250;
    d.shop = [{ id: uid(), text: "Yogur griego natural 0 %", done: true }, { id: uid(), text: "Copos de avena", done: false }];
    (window.PVApp.demoExtras || []).forEach((fn) => fn(d));
    S = d; save(); render();
  };
  $("appDemo").addEventListener("click", () => {
    const hasData = S.measures.length || S.photos.length || S.lifts.length || S.meals.length;
    if (hasData && !S.demo && !confirm("Esto sustituye tus datos por datos de ejemplo. ¿Guardaste una copia?")) return;
    loadDemo();
  });
  $("demoClear").addEventListener("click", () => { S = empty(); save(); render(); });

  /* ---------- Render ---------- */
  const hooks = [];
  function render() {
    $("demoBanner").hidden = !S.demo;
    renderDash(); renderEvo(); renderNutri(); renderBackup();
    if (!$("sendForm").hidden) updatePreview();
    hooks.forEach((h) => { try { h(current); } catch (err) { console.error(err); } });
  }

  /* API compartida con los módulos de studio.js */
  window.PVApp = {
    get S() { return S; },
    save, render, go, hasReal,
    get current() { return current; },
    onRender: (fn) => { hooks.push(fn); fn(current); },
    demoExtras: [],
    u: { $, esc, pad, iso, today, addDays, fmtDate, fmt, num, uid, sorted, setRing, formData, weekDates, streak, epley, latestWeight, lineChart, resizePhoto, doBackup },
  };
  render();
})();
