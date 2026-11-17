/* =========================================================
   PowerVane · Power App · módulos
   Workout Studio · My Calendar · Power Challenges · My Achievements
   My Coach · Hábitos · Perfil · Resumen Body Evolution 360°
   Usa el mismo almacenamiento local que app.js (window.PVApp). Sin servidor.
   ========================================================= */
(() => {
  const A = window.PVApp;
  if (!A) return;
  const { $, esc, iso, today, addDays, fmtDate, fmt, uid, sorted, setRing, formData, weekDates, streak, epley, latestWeight } = A.u;
  const S = () => A.S;
  const DAY = 864e5;

  /* ---------- Avisos ---------- */
  let toastT;
  const toast = (msg) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 3200);
  };
  const wa = (text) => {
    if (!window.PVwaText) return;
    const a = Object.assign(document.createElement("a"), { href: window.PVwaText(text), target: "_blank", rel: "noopener" });
    document.body.appendChild(a); a.click(); a.remove();
  };
  const myName = () => (S().profile.name || "").trim();
  const download = (name, text, type) => {
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  };
  const ensure = () => {
    const s = S();
    s.routines = s.routines || []; s.sessions = s.sessions || []; s.plan = s.plan || {}; s.habits = s.habits || {}; s.badgesSeen = s.badgesSeen || [];
  };
  ensure();

  /* =========================================================
     Biblioteca de ejercicios
     Los dos vídeos son de la propia entrenadora.
     ========================================================= */
  const VIDEOS = {
    "Sentadilla con barra": "assets/video/glute-focus.mp4",
    "Press de hombro con mancuernas": "assets/video/strong-feminine.mp4",
  };
  const GROUPS = ["Glúteo", "Pierna", "Tren superior", "Core", "Cardio", "Full body"];
  const EX = [
    ["Hip thrust", "Glúteo", "Gimnasio", "Hip thrust"],
    ["Puente de glúteo", "Glúteo", "Casa"],
    ["Patada de glúteo en polea", "Glúteo", "Gimnasio"],
    ["Abducción de cadera", "Glúteo", "Gimnasio · Casa"],
    ["Peso muerto rumano", "Glúteo", "Gimnasio", "Peso muerto"],
    ["Sentadilla búlgara", "Glúteo", "Gimnasio · Casa"],
    ["Sentadilla con barra", "Pierna", "Gimnasio", "Sentadilla"],
    ["Sentadilla goblet", "Pierna", "Gimnasio"],
    ["Sentadilla sin peso", "Pierna", "Casa"],
    ["Zancadas", "Pierna", "Gimnasio · Casa"],
    ["Prensa de piernas", "Pierna", "Gimnasio"],
    ["Curl femoral", "Pierna", "Gimnasio"],
    ["Press de hombro con mancuernas", "Tren superior", "Gimnasio", "Press hombro"],
    ["Press banca", "Tren superior", "Gimnasio", "Press banca"],
    ["Remo con mancuerna", "Tren superior", "Gimnasio · Casa"],
    ["Jalón al pecho", "Tren superior", "Gimnasio"],
    ["Dominadas asistidas", "Tren superior", "Gimnasio", "Dominadas"],
    ["Flexiones", "Tren superior", "Casa"],
    ["Fondos en banco", "Tren superior", "Casa"],
    ["Plancha", "Core", "Casa"],
    ["Plancha lateral", "Core", "Casa"],
    ["Dead bug", "Core", "Casa"],
    ["Crunch inverso", "Core", "Casa"],
    ["Mountain climbers", "Cardio", "Casa"],
    ["Jumping jacks", "Cardio", "Casa"],
    ["Comba", "Cardio", "Casa"],
  ].map(([n, g, eq, lift]) => ({ n, g, eq, lift, video: VIDEOS[n] }));
  const exInfo = (n) => EX.find((e) => e.n === n);

  /* Plantillas base: estructura editable, no sustituyen el plan de tu entrenadora */
  const TEMPLATES = [
    { name: "Glúteo & pierna", group: "Glúteo", ex: [["Hip thrust", 4, "10", 90], ["Sentadilla con barra", 4, "8", 120], ["Peso muerto rumano", 3, "10", 90], ["Sentadilla búlgara", 3, "10 por pierna", 75], ["Abducción de cadera", 3, "15", 45]] },
    { name: "Tren superior", group: "Tren superior", ex: [["Press de hombro con mancuernas", 4, "10", 75], ["Remo con mancuerna", 3, "12", 60], ["Jalón al pecho", 3, "12", 60], ["Flexiones", 3, "10", 60], ["Plancha", 3, "40 s", 30]] },
    { name: "Full body en casa", group: "Full body", ex: [["Sentadilla sin peso", 3, "20", 45], ["Zancadas", 3, "12 por pierna", 45], ["Puente de glúteo", 3, "20", 45], ["Flexiones", 3, "10", 45], ["Mountain climbers", 3, "30 s", 30], ["Plancha", 3, "40 s", 30]] },
  ];
  const fromTemplate = (t) => ({ id: uid(), name: t.name, group: t.group, tpl: true, ex: t.ex.map(([n, sets, reps, rest]) => ({ n, sets, reps, rest, kg: null })) });

  const estMin = (r) => Math.max(5, Math.round(r.ex.reduce((t, e) => t + (+e.sets || 0) * (45 + (+e.rest || 0)), 0) / 60 / 5) * 5);
  const estKcal = (min) => { const w = latestWeight() || S().nutri.weight; return w ? Math.round(5 * w * (min / 60)) : null; }; // MET 5 · fuerza moderada
  const routineById = (id) => S().routines.find((r) => r.id === id);

  /* =========================================================
     WORKOUT STUDIO
     ========================================================= */
  let sub = "routines", libGroup = "Todos";
  document.querySelectorAll(".subtab").forEach((b) => b.addEventListener("click", () => {
    sub = b.dataset.sub;
    document.querySelectorAll(".subtab").forEach((x) => x.classList.toggle("is-active", x === b));
    document.querySelectorAll("[data-subpanel]").forEach((p) => (p.hidden = p.dataset.subpanel !== sub));
  }));

  const renderStudio = () => {
    const s = S();
    $("routines").innerHTML = s.routines.length ? s.routines.map((r) => {
      const min = estMin(r);
      return `<article class="routine">
        <div class="routine__top"><span class="routine__tag">${esc(r.group || "Rutina")}</span>${r.tpl ? `<span class="routine__tpl">Plantilla base</span>` : ""}</div>
        <h4>${esc(r.name)}</h4>
        <p class="routine__meta"><svg class="icon"><use href="#i-clock"/></svg>~${min} min · ${r.ex.length} ejercicios</p>
        <ol class="routine__ex">${r.ex.slice(0, 4).map((e) => `<li>${esc(e.n)} <span>${e.sets} × ${esc(e.reps)}</span></li>`).join("")}${r.ex.length > 4 ? `<li class="muted">+ ${r.ex.length - 4} más</li>` : ""}</ol>
        <div class="routine__btns">
          <button type="button" class="btn btn--pink btn--small" data-start="${r.id}"><svg class="icon"><use href="#i-play"/></svg>Empezar</button>
          <button type="button" class="link-btn" data-edit="${r.id}">Editar</button>
          <button type="button" class="link-btn" data-sched="${r.id}">Programar</button>
          <button type="button" class="link-btn link-btn--dim" data-del="${r.id}">Borrar</button>
        </div>
      </article>`;
    }).join("") : `<p class="empty">Aún no tienes rutinas. Crea la tuya con <strong>Nueva rutina</strong> o empieza con una plantilla base.</p>`;

    const missing = TEMPLATES.filter((t) => !s.routines.some((r) => r.tpl && r.name === t.name));
    $("templates").innerHTML = missing.length ? `<div class="tpls"><p class="ahome__label">Plantillas base</p><p class="panel__note">Estructuras de partida editables. Ajusta series, peso y descansos con las indicaciones de tu entrenadora.</p><div class="tpls__row">${missing.map((t) => `<button type="button" class="tpl" data-tpl="${esc(t.name)}"><strong>${esc(t.name)}</strong><small>${t.ex.length} ejercicios · ${esc(t.group)}</small><span>+ Añadir</span></button>`).join("")}</div></div>` : "";

    // Biblioteca
    const filters = ["Todos", ...GROUPS.filter((g) => g !== "Full body"), "En casa", "Con vídeo"];
    $("libFilter").innerHTML = filters.map((f) => `<button type="button" class="chipbtn${f === libGroup ? " is-active" : ""}" data-lib="${f}">${f}</button>`).join("");
    const list = EX.filter((e) => libGroup === "Todos" || e.g === libGroup || (libGroup === "En casa" && e.eq.includes("Casa")) || (libGroup === "Con vídeo" && e.video));
    const opts = s.routines.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
    $("library").innerHTML = list.map((e) => `<li class="exitem">
      <button type="button" class="exitem__media${e.video ? "" : " is-novideo"}" ${e.video ? `data-video="${esc(e.n)}" aria-label="Ver vídeo: ${esc(e.n)}"` : 'disabled aria-label="Sin vídeo"'}>${e.video ? `<img src="${e.video.replace(".mp4", ".jpg")}" alt="" loading="lazy"/><svg class="icon"><use href="#i-play"/></svg>` : `<svg class="icon"><use href="#i-dumbbell"/></svg>`}</button>
      <div class="exitem__body"><strong>${esc(e.n)}</strong><small>${esc(e.g)} · ${esc(e.eq)}</small>${e.video ? `<span class="exitem__vid">Vídeo con tu entrenadora</span>` : ""}</div>
      <select class="exitem__add" data-addex="${esc(e.n)}" aria-label="Añadir ${esc(e.n)} a una rutina"><option value="">Añadir a…</option>${opts}<option value="__new">Nueva rutina</option></select>
    </li>`).join("");

    // Historial
    const ses = sorted(s.sessions).reverse();
    const month = today().slice(0, 7);
    const mins = s.sessions.reduce((t, x) => t + Math.round((x.sec || 0) / 60), 0);
    $("histStats").innerHTML = `<div><strong>${s.sessions.length}</strong><span>sesiones</span></div><div><strong>${s.sessions.filter((x) => x.date.startsWith(month)).length}</strong><span>este mes</span></div><div><strong>${fmt(mins, 0)}</strong><span>minutos</span></div>`;
    $("history").innerHTML = ses.length ? ses.map((x) => `<li><div><strong>${esc(x.name)}</strong><small>${esc(fmtDate(x.date))} · ${Math.max(1, Math.round(x.sec / 60))} min · ${x.sets} series${x.vol ? ` · ${fmt(x.vol, 0)} kg de volumen` : ""}</small></div><button type="button" class="iconbtn" data-sesdel="${x.id}" aria-label="Borrar sesión">×</button></li>`).join("") : `<li class="empty">Cuando termines tu primer entrenamiento guiado aparecerá aquí.</li>`;
  };

  $("templates").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tpl]"); if (!b) return;
    const t = TEMPLATES.find((x) => x.name === b.dataset.tpl);
    S().routines.push(fromTemplate(t)); A.save(); A.render(); toast(`Plantilla «${t.name}» añadida a tus rutinas`);
  });
  $("libFilter").addEventListener("click", (e) => { const b = e.target.closest("[data-lib]"); if (b) { libGroup = b.dataset.lib; renderStudio(); } });
  $("library").addEventListener("click", (e) => { const b = e.target.closest("[data-video]"); if (b) openVideo(b.dataset.video); });
  $("library").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-addex]"); if (!sel || !sel.value) return;
    const n = sel.dataset.addex, item = { n, sets: 3, reps: "12", rest: 60, kg: null };
    if (sel.value === "__new") { openEditor(null, [item]); sel.value = ""; return; }
    const r = routineById(sel.value);
    if (r) { r.ex.push(item); A.save(); A.render(); toast(`${n} añadido a «${r.name}»`); }
  });
  $("routines").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.start) startWorkout(b.dataset.start);
    else if (b.dataset.edit) openEditor(routineById(b.dataset.edit));
    else if (b.dataset.sched) { calSel = today(); preRoutine = b.dataset.sched; A.go("cal"); }
    else if (b.dataset.del) {
      const r = routineById(b.dataset.del);
      if (r && confirm(`¿Borrar la rutina «${r.name}»?`)) {
        const s = S(); s.routines = s.routines.filter((x) => x.id !== r.id);
        Object.keys(s.plan).forEach((d) => { s.plan[d] = s.plan[d].filter((p) => p.routineId !== r.id); if (!s.plan[d].length) delete s.plan[d]; });
        A.save(); A.render();
      }
    }
  });
  $("history").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sesdel]"); if (!b || !confirm("¿Borrar esta sesión del historial?")) return;
    S().sessions = S().sessions.filter((x) => x.id !== b.dataset.sesdel); A.save(); A.render();
  });

  /* ---------- Editor de rutinas ---------- */
  const rm = $("routineModal"), rf = $("routineForm");
  let editing = null, draft = [];
  rf.group.innerHTML = GROUPS.map((g) => `<option>${g}</option>`).join("");
  $("rexPick").innerHTML = GROUPS.map((g) => `<optgroup label="${g}">${EX.filter((e) => e.g === g).map((e) => `<option>${esc(e.n)}</option>`).join("")}</optgroup>`).join("") + `<option value="__custom">Otro ejercicio…</option>`;
  const drawRex = () => {
    $("rexList").innerHTML = draft.length ? draft.map((x, i) => `<li data-i="${i}">
      <input class="rex__name" value="${esc(x.n)}" maxlength="50" aria-label="Ejercicio" required />
      <label>Series<input type="number" min="1" max="12" value="${x.sets}" data-f="sets" /></label>
      <label>Reps<input value="${esc(x.reps)}" maxlength="16" data-f="reps" /></label>
      <label>Desc. (s)<input type="number" min="0" max="600" step="5" value="${x.rest}" data-f="rest" /></label>
      <label>Kg<input type="number" min="0" max="400" step="0.5" value="${x.kg ?? ""}" data-f="kg" placeholder="—" /></label>
      <button type="button" class="iconbtn" data-rexdel="${i}" aria-label="Quitar ejercicio">×</button>
    </li>`).join("") : `<li class="empty">Añade ejercicios desde la biblioteca.</li>`;
  };
  $("rexList").addEventListener("input", (e) => {
    const li = e.target.closest("[data-i]"); if (!li) return;
    const x = draft[+li.dataset.i];
    if (e.target.classList.contains("rex__name")) x.n = e.target.value;
    else { const f = e.target.dataset.f; x[f] = f === "reps" ? e.target.value : (e.target.value === "" ? null : +e.target.value); }
  });
  $("rexList").addEventListener("click", (e) => { const b = e.target.closest("[data-rexdel]"); if (b) { draft.splice(+b.dataset.rexdel, 1); drawRex(); } });
  $("rexAdd").addEventListener("click", () => {
    const v = $("rexPick").value;
    draft.push({ n: v === "__custom" ? "" : v, sets: 3, reps: "12", rest: 60, kg: null });
    drawRex();
    if (v === "__custom") $("rexList").querySelector("li:last-child .rex__name").focus();
  });
  const openEditor = (r, preset) => {
    editing = r || null;
    draft = r ? r.ex.map((x) => ({ ...x })) : (preset || []);
    $("rmTitle").textContent = r ? "Editar rutina" : "Nueva rutina";
    rf.name.value = r ? r.name : "";
    rf.group.value = r ? r.group : (preset && exInfo(preset[0].n) ? exInfo(preset[0].n).g : "Glúteo");
    drawRex();
    rm.showModal();
  };
  $("newRoutine").addEventListener("click", () => openEditor(null));
  rm.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => rm.close()));
  rf.addEventListener("submit", (e) => {
    e.preventDefault();
    const ex = draft.filter((x) => x.n.trim()).map((x) => ({ ...x, n: x.n.trim(), sets: Math.max(1, +x.sets || 1), rest: Math.max(0, +x.rest || 0), reps: String(x.reps || "").trim() || "—" }));
    if (!ex.length) { toast("Añade al menos un ejercicio"); return; }
    const name = rf.name.value.trim() || "Mi rutina";
    if (editing) Object.assign(editing, { name, group: rf.group.value, ex });
    else S().routines.push({ id: uid(), name, group: rf.group.value, ex });
    A.save(); rm.close(); A.render(); toast("Rutina guardada");
  });

  /* ---------- Vídeos demostrativos ---------- */
  const vm = $("videoModal"), vv = $("vmVideo");
  const openVideo = (n) => { $("vmTitle").textContent = n; vv.src = VIDEOS[n]; vm.showModal(); vv.play().catch(() => {}); };
  vm.addEventListener("close", () => { vv.pause(); vv.removeAttribute("src"); vv.load(); });
  vm.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => vm.close()));

  /* ---------- Entrenamiento guiado ---------- */
  const pm = $("playerModal");
  let P = null, wake = null;
  const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const beep = () => {
    try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch { /* sin vibración */ }
    try {
      const C = new (window.AudioContext || window.webkitAudioContext)(), o = C.createOscillator(), g = C.createGain();
      o.frequency.value = 880; g.gain.setValueAtTime(0.18, C.currentTime); g.gain.exponentialRampToValueAtTime(0.001, C.currentTime + 0.5);
      o.connect(g).connect(C.destination); o.start(); o.stop(C.currentTime + 0.5);
    } catch { /* sin audio */ }
  };
  const lastKg = (n) => {
    for (const x of sorted(S().sessions).reverse()) { const l = (x.log || []).filter((y) => y.n === n && y.kg); if (l.length) return l[l.length - 1].kg; }
    return null;
  };
  const totalSets = () => P.r.ex.reduce((t, e) => t + (+e.sets || 1), 0);
  const drawPlayer = () => {
    const done = P.log.length, tot = totalSets();
    $("plBar").style.width = `${(done / tot) * 100}%`;
    if (P.finished) {
      const vol = P.log.reduce((t, l) => t + (l.kg || 0) * (parseInt(l.reps) || 0), 0);
      P.vol = vol;
      $("plStage").innerHTML = `<div class="player__done">
        <svg class="icon"><use href="#i-trophy"/></svg>
        <h4>¡Entrenamiento completado!</h4>
        <ul class="player__sum"><li><strong>${mmss(P.sec)}</strong><span>duración</span></li><li><strong>${done}</strong><span>series</span></li><li><strong>${fmt(vol, 0)}</strong><span>kg de volumen</span></li></ul>
        <button type="button" class="btn btn--pink" id="plSave">Guardar entrenamiento</button>
        <button type="button" class="link-btn link-btn--dim" id="plDiscard">Descartar</button>
      </div>`;
      $("plNext").textContent = "";
      $("plSave").addEventListener("click", saveWorkout);
      $("plDiscard").addEventListener("click", () => { if (confirm("¿Descartar este entrenamiento?")) closePlayer(true); });
      return;
    }
    const e = P.r.ex[P.i], info = exInfo(e.n), kg = e.kg ?? lastKg(e.n) ?? "";
    $("plStage").innerHTML = `<div class="player__ex">
      ${info && info.video ? `<button type="button" class="player__vid" data-pvideo="${esc(e.n)}"><img src="${info.video.replace(".mp4", ".jpg")}" alt=""/><svg class="icon"><use href="#i-play"/></svg><span>Ver técnica</span></button>` : ""}
      <p class="ahome__label">Ejercicio ${P.i + 1} de ${P.r.ex.length}${info ? ` · ${esc(info.g)}` : ""}</p>
      <h4>${esc(e.n)}</h4>
      <p class="player__set">Serie <strong>${P.set}</strong> de ${e.sets}</p>
      <div class="player__inputs">
        <label>Reps<input id="plReps" value="${esc(parseInt(e.reps) ? parseInt(e.reps) : e.reps)}" maxlength="10" /></label>
        <label>Kg<input id="plKg" type="number" min="0" max="400" step="0.5" value="${kg}" placeholder="—" /></label>
      </div>
      <p class="panel__note">Objetivo: ${e.sets} × ${esc(e.reps)} · descanso ${e.rest || 0} s</p>
      <div class="player__btns"><button type="button" class="btn btn--pink btn--large" id="plDone"><svg class="icon"><use href="#i-check"/></svg>Serie hecha</button><button type="button" class="link-btn" id="plSkip">Saltar ejercicio</button></div>
    </div>`;
    const nx = P.set < e.sets ? `Siguiente: serie ${P.set + 1} de ${esc(e.n)}` : P.r.ex[P.i + 1] ? `Siguiente ejercicio: ${esc(P.r.ex[P.i + 1].n)}` : "Última serie";
    $("plNext").innerHTML = nx;
    $("plDone").addEventListener("click", setDone);
    $("plSkip").addEventListener("click", () => { P.i++; P.set = 1; if (P.i >= P.r.ex.length) P.finished = true; drawPlayer(); });
    const v = $("plStage").querySelector("[data-pvideo]"); if (v) v.addEventListener("click", () => openVideo(v.dataset.pvideo));
  };
  const setDone = () => {
    const e = P.r.ex[P.i];
    const kgv = $("plKg").value, kg = kgv === "" ? null : +kgv;
    P.log.push({ n: e.n, reps: $("plReps").value.trim(), kg });
    if (kg != null) e.kg = kg; // recuerda el último peso en la rutina
    const last = P.set >= e.sets && P.i >= P.r.ex.length - 1;
    if (P.set < e.sets) P.set++; else { P.i++; P.set = 1; }
    if (last) { P.finished = true; drawPlayer(); return; }
    drawPlayer();
    if (e.rest > 0) startRest(+e.rest);
  };
  const startRest = (sec) => {
    P.rest = { left: sec, total: sec };
    $("plRest").hidden = false; $("plStage").classList.add("is-dim");
    const tick = () => {
      $("restLeft").textContent = P.rest.left;
      setRing($("restRing"), P.rest.left / P.rest.total);
      if (P.rest.left <= 0) { endRest(); beep(); }
    };
    tick();
    P.restT = setInterval(() => { P.rest.left--; tick(); }, 1000);
  };
  const endRest = () => { clearInterval(P.restT); P.rest = null; $("plRest").hidden = true; $("plStage").classList.remove("is-dim"); };
  $("restSkip").addEventListener("click", endRest);
  $("restPlus").addEventListener("click", () => { if (P && P.rest) { P.rest.left += 15; P.rest.total += 15; } });
  const startWorkout = async (id) => {
    const r = routineById(id); if (!r || !r.ex.length) return;
    P = { r, i: 0, set: 1, log: [], sec: 0, finished: false };
    $("plTitle").textContent = r.name; $("plTimer").textContent = "00:00";
    $("plRest").hidden = true; $("plStage").classList.remove("is-dim");
    drawPlayer();
    pm.showModal();
    P.timer = setInterval(() => { if (!P.finished) { P.sec++; $("plTimer").textContent = mmss(P.sec); } }, 1000);
    try { wake = await navigator.wakeLock.request("screen"); } catch { wake = null; }
  };
  const closePlayer = (force) => {
    if (!P) return pm.close();
    if (!force && !P.finished && P.log.length && !confirm("¿Salir del entrenamiento? Se perderán las series de esta sesión.")) return;
    clearInterval(P.timer); clearInterval(P.restT); P = null;
    if (wake) { wake.release().catch(() => {}); wake = null; }
    pm.close();
  };
  $("plClose").addEventListener("click", () => closePlayer(false));
  pm.addEventListener("cancel", (e) => { e.preventDefault(); closePlayer(false); });
  const LIFT_OF = Object.fromEntries(EX.filter((e) => e.lift).map((e) => [e.n, e.lift]));
  const saveWorkout = () => {
    const s = S(), d = today();
    s.sessions.push({ id: uid(), date: d, routineId: P.r.id, name: P.r.name, sec: P.sec, sets: P.log.length, vol: P.vol || 0, log: P.log });
    if (!s.trainings.includes(d)) s.trainings.push(d);
    // Conecta con Seguimiento de fuerza: mejor serie de cada ejercicio con peso
    const best = {};
    P.log.forEach((l) => { const lift = LIFT_OF[l.n], reps = parseInt(l.reps); if (lift && l.kg && reps) { const rm = epley(l.kg, reps); if (!best[lift] || rm > best[lift].rm) best[lift] = { rm, kg: l.kg, reps }; } });
    Object.entries(best).forEach(([lift, b]) => s.lifts.push({ id: uid(), lift, date: d, kg: b.kg, reps: Math.min(30, b.reps) }));
    (s.plan[d] || []).forEach((p) => { if (p.routineId === P.r.id) p.done = true; });
    A.save(); closePlayer(true); A.render();
    toast("¡Entrenamiento guardado! +20 puntos 💗");
  };

  /* =========================================================
     MY CALENDAR
     ========================================================= */
  let calMonth = today().slice(0, 7), calSel = today(), preRoutine = null;
  const liveSessions = () => ((window.PV_LIVE && window.PV_LIVE.sessions) || []).map((x) => ({ ...x, day: String(x.start).slice(0, 10), time: String(x.start).slice(11, 16) }));
  const ics = (title, date, time, minutes, desc) => {
    const [y, m, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
    const st = new Date(y, m - 1, d, h, mi), en = new Date(st.getTime() + minutes * 6e4);
    const z = (t) => t.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PowerVane//App//ES", "BEGIN:VEVENT", `UID:${uid()}@powervane`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(st)}`, `DTEND:${z(en)}`,
      `SUMMARY:${title.replace(/[,;\n]/g, " ")}`, `DESCRIPTION:${(desc || "").replace(/[,;\n]/g, " ")}`, "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Recordatorio PowerVane", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    download(`powervane-${date}.ics`, body, "text/calendar");
  };
  const dayItems = (d) => {
    const s = S(), out = [];
    if (s.trainings.includes(d)) out.push({ type: "done", html: `<span class="dot dot--done"></span><div><strong>Entrenado</strong><small>${s.sessions.filter((x) => x.date === d).map((x) => esc(x.name)).join(" · ") || "Entreno marcado"}</small></div>` });
    (s.plan[d] || []).forEach((p) => {
      const r = routineById(p.routineId); if (!r) return;
      out.push({ type: "plan", html: `<span class="dot dot--plan"></span><div><strong>${esc(r.name)}</strong><small>${esc(p.time)} · ~${estMin(r)} min${p.done ? " · hecho" : ""}</small></div><div class="dayitems__btns">${d === today() && !p.done ? `<button type="button" class="btn btn--pink btn--small" data-start="${r.id}">Empezar</button>` : ""}<button type="button" class="link-btn" data-ics="${d}|${p.id}">Recordatorio</button><button type="button" class="iconbtn" data-unplan="${d}|${p.id}" aria-label="Quitar">×</button></div>` });
    });
    liveSessions().filter((x) => x.day === d).forEach((x) => out.push({ type: "live", html: `<span class="dot dot--live"></span><div><strong>${esc(x.title)}</strong><small>LIVE · ${esc(x.time)} · ${x.duration || 60} min</small></div><div class="dayitems__btns"><a class="link-btn" href="#live">Ver en LIVE</a><button type="button" class="link-btn" data-icslive="${esc(x.id)}">Recordatorio</button></div>` }));
    return out;
  };
  const renderCal = () => {
    const s = S();
    const [y, m] = calMonth.split("-").map(Number), first = new Date(y, m - 1, 1);
    $("calTitle").textContent = first.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const lives = new Set(liveSessions().map((x) => x.day)), cells = [];
    for (let i = 0; i < 42; i++) {
      const dt = new Date(start); dt.setDate(start.getDate() + i);
      const d = iso(dt), plan = (s.plan[d] || []).length;
      cells.push(`<button type="button" class="cal__day${dt.getMonth() !== m - 1 ? " is-out" : ""}${d === today() ? " is-today" : ""}${d === calSel ? " is-sel" : ""}" data-day="${d}" aria-label="${dt.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}">
        <span>${dt.getDate()}</span><i>${s.trainings.includes(d) ? '<b class="dot dot--done"></b>' : ""}${plan ? '<b class="dot dot--plan"></b>' : ""}${lives.has(d) ? '<b class="dot dot--live"></b>' : ""}</i></button>`);
    }
    $("calGrid").innerHTML = cells.join("");
    $("dayTitle").textContent = calSel === today() ? "Hoy" : new Date(calSel + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
    const items = dayItems(calSel);
    $("dayItems").innerHTML = items.length ? items.map((x) => `<li>${x.html}</li>`).join("") : `<li class="empty">Nada este día.</li>`;
    const sel = $("planRoutine");
    sel.innerHTML = s.routines.length ? s.routines.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("") : `<option value="">Crea una rutina en Workout Studio</option>`;
    if (preRoutine && routineById(preRoutine)) sel.value = preRoutine;
    $("planForm").querySelector("button").disabled = !s.routines.length || calSel < today();
    const up = [];
    for (let i = 0; i < 7; i++) { const d = addDays(today(), i); dayItems(d).filter((x) => x.type !== "done").forEach((x) => up.push(`<li><time>${i === 0 ? "Hoy" : i === 1 ? "Mañana" : esc(new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }))}</time>${x.html}</li>`)); }
    $("upcoming").innerHTML = up.length ? up.join("") : `<li class="empty">Sin entrenos ni clases en los próximos 7 días. Programa uno desde el calendario.</li>`;
  };
  $("calGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-day]"); if (b) { calSel = b.dataset.day; if (calSel.slice(0, 7) !== calMonth) calMonth = calSel.slice(0, 7); renderCal(); } });
  $("calPrev").addEventListener("click", () => { const [y, m] = calMonth.split("-").map(Number); calMonth = iso(new Date(y, m - 2, 1)).slice(0, 7); renderCal(); });
  $("calNext").addEventListener("click", () => { const [y, m] = calMonth.split("-").map(Number); calMonth = iso(new Date(y, m, 1)).slice(0, 7); renderCal(); });
  $("planForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = formData(e.target); if (!f.routine) return;
    const s = S(); (s.plan[calSel] = s.plan[calSel] || []).push({ id: uid(), routineId: f.routine, time: f.time || "18:00" });
    preRoutine = null; A.save(); A.render(); toast("Entreno programado");
  });
  const onDayClick = (e) => {
    const b = e.target.closest("button,a"); if (!b) return;
    if (b.dataset.start) startWorkout(b.dataset.start);
    else if (b.dataset.unplan) { const [d, id] = b.dataset.unplan.split("|"); const s = S(); s.plan[d] = (s.plan[d] || []).filter((p) => p.id !== id); if (!s.plan[d].length) delete s.plan[d]; A.save(); A.render(); }
    else if (b.dataset.ics) { const [d, id] = b.dataset.ics.split("|"); const p = (S().plan[d] || []).find((x) => x.id === id), r = p && routineById(p.routineId); if (r) ics(`Entreno PowerVane: ${r.name}`, d, p.time, estMin(r), r.ex.map((x) => x.n).join(" · ")); }
    else if (b.dataset.icslive) { const x = liveSessions().find((l) => l.id === b.dataset.icslive); if (x) ics(`LIVE PowerVane: ${x.title}`, x.day, x.time, x.duration || 60, "Entra desde la web con tu código de acceso"); }
  };
  $("dayItems").addEventListener("click", onDayClick);
  $("upcoming").addEventListener("click", onDayClick);

  /* =========================================================
     HÁBITOS (My Nutrition)
     ========================================================= */
  const waterGoal = () => { const w = latestWeight() || S().nutri.weight; return (w ? Math.round(w * 0.035 * 10) / 10 : 2) * 1000; };
  const HABITS = [
    ["food", "Alimentación saludable", "i-apple"],
    ["water", "Hidratación", "i-drop", (d) => (S().water[d] || 0) >= waterGoal()],
    ["train", "Entrenamiento", "i-dumbbell", (d) => S().trainings.includes(d)],
    ["sleep", "Descanso 7-9 h", "i-moon"],
    ["mind", "Bienestar mental", "i-lotus"],
  ];
  const habitsOf = (d) => HABITS.filter(([k, , , auto]) => (auto ? auto(d) : (S().habits[d] || []).includes(k))).map(([k]) => k);
  const renderHabits = () => {
    const d = today(), done = habitsOf(d);
    $("habits").innerHTML = HABITS.map(([k, label, ic, auto]) => `<button type="button" class="habit${done.includes(k) ? " is-on" : ""}" data-habit="${k}" ${auto ? 'disabled title="Se marca solo"' : ""} aria-pressed="${done.includes(k)}">
      <span class="habit__ic"><svg class="icon"><use href="#${ic}"/></svg><b><svg class="icon"><use href="#i-check"/></svg></b></span><strong>${label}</strong>${auto ? "<small>automático</small>" : ""}</button>`).join("");
    $("habitsNote").textContent = `${done.length} de ${HABITS.length} hoy`;
    $("habitsWeek").innerHTML = Array.from({ length: 7 }, (_, i) => { const dd = addDays(d, i - 6), n = habitsOf(dd).length; return `<span title="${fmtDate(dd)}: ${n}/5"><i style="--h:${n / 5}"></i><small>${new Date(dd + "T12:00:00").toLocaleDateString("es-ES", { weekday: "narrow" })}</small></span>`; }).join("");
  };
  $("habits").addEventListener("click", (e) => {
    const b = e.target.closest("[data-habit]"); if (!b || b.disabled) return;
    const s = S(), d = today(), k = b.dataset.habit, h = new Set(s.habits[d] || []);
    h.has(k) ? h.delete(k) : h.add(k); s.habits[d] = [...h]; A.save(); A.render();
  });

  /* =========================================================
     POWER CHALLENGES + MY ACHIEVEMENTS
     ========================================================= */
  const maxStreak = () => {
    const days = [...new Set(S().trainings)].sort(); let best = 0, cur = 0, prev = null;
    days.forEach((d) => { cur = prev && addDays(prev, 1) === d ? cur + 1 : 1; best = Math.max(best, cur); prev = d; });
    return best;
  };
  const waterDays = () => Object.entries(S().water).filter(([, ml]) => ml >= waterGoal()).length;
  const hadPR = () => {
    const by = {};
    for (const l of sorted(S().lifts)) { const rm = epley(l.kg, l.reps); if (by[l.lift] != null && rm > by[l.lift]) return true; by[l.lift] = Math.max(by[l.lift] || 0, rm); }
    return false;
  };
  const goalProgress = () => { const p = S().profile, c = latestWeight(); return p.startWeight && p.goalWeight && c != null && p.startWeight !== p.goalWeight ? Math.max(0, Math.min(1, (p.startWeight - c) / (p.startWeight - p.goalWeight))) : 0; };
  const planCount = () => Object.values(S().plan).reduce((t, a) => t + a.length, 0);
  const BADGES = [
    ["first", "Primer paso", "Tu primer registro en la app", "i-heart", () => (A.hasReal() ? 1 : 0), 1],
    ["streak7", "Racha de 7 días", "Entrena 7 días seguidos", "i-flame", maxStreak, 7],
    ["t10", "10 entrenos", "Marca 10 días entrenados", "i-dumbbell", () => new Set(S().trainings).size, 10],
    ["t50", "Imparable", "50 días entrenados", "i-medal", () => new Set(S().trainings).size, 50],
    ["s1", "Primera sesión guiada", "Completa un entreno en Workout Studio", "i-play", () => S().sessions.length, 1],
    ["s10", "Studio lover", "10 sesiones en Workout Studio", "i-trophy", () => S().sessions.length, 10],
    ["pr", "Récord personal", "Supera tu fuerza máxima estimada", "i-chart", () => (hadPR() ? 1 : 0), 1],
    ["photo2", "Evolución visual", "Sube 2 fotos de progreso", "i-camera", () => S().photos.length, 2],
    ["goal", "Objetivo conseguido", "Llega a tu peso objetivo", "i-target", () => (goalProgress() >= 1 ? 1 : 0), 1],
    ["water7", "Hidratada", "7 días cumpliendo tu agua", "i-drop", waterDays, 7],
    ["meals20", "Chef saludable", "Registra 20 comidas", "i-apple", () => S().meals.length, 20],
    ["plan5", "Planificadora", "Programa 5 entrenos en tu agenda", "i-cal", planCount, 5],
  ];
  const TIERS = [[0, "Power Starter"], [300, "Power Rising"], [800, "Power Strong"], [1600, "Power Queen"], [3000, "Power Legend"]];
  const points = () => {
    const s = S();
    const habitDays = Object.keys(s.habits).filter((d) => habitsOf(d).length >= 4).length;
    const unlocked = BADGES.filter((b) => b[4]() >= b[5]).length;
    return new Set(s.trainings).size * 10 + s.sessions.length * 20 + s.measures.length * 5 + s.photos.length * 15 + s.meals.length * 2 + s.level.length * 10 + habitDays * 5 + waterDays() * 3 + unlocked * 25;
  };
  const svg = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
  const challenge = (title, sub, cur, goal, pts, ic) => {
    const p = Math.min(1, cur / goal), ok = cur >= goal;
    return `<li class="challenge${ok ? " is-done" : ""}"><span class="challenge__ic">${svg(ok ? "i-check" : ic)}</span><div class="challenge__main"><div class="challenge__top"><strong>${title}</strong><span class="chip-pts">${ok ? `${svg("i-check")}Conseguido` : `${svg("i-flame")}+${pts}`}</span></div><small>${sub}</small><div class="challenge__prog"><div class="bar"><span style="width:${p * 100}%"></span></div><small class="challenge__n"><b>${fmt(Math.min(cur, goal), 0)}</b>/${goal}</small></div></div></li>`;
  };
  const renderGoals = () => {
    const s = S(), wk = weekDates(), month = today().slice(0, 7);
    const tWeek = wk.filter((d) => s.trainings.includes(d)).length;
    const wWeek = wk.filter((d) => (s.water[d] || 0) >= waterGoal()).length;
    const mWeek = wk.filter((d) => s.meals.some((m) => m.date === d)).length;
    const hWeek = wk.filter((d) => habitsOf(d).length >= 4).length;
    $("chWeek").innerHTML = challenge("Objetivo semanal de entrenos", "Cumple los entrenos que te has marcado", tWeek, s.weekTarget || 4, 50, "i-dumbbell")
      + challenge("Semana hidratada", "Llega a tu objetivo de agua 5 días", wWeek, 5, 30, "i-drop")
      + challenge("Diario de comidas", "Registra lo que comes 5 días", mWeek, 5, 30, "i-apple")
      + challenge("Hábitos Power", "Completa al menos 4 hábitos, 4 días", hWeek, 4, 40, "i-lotus");
    const tMonth = new Set(s.trainings.filter((d) => d.startsWith(month))).size;
    $("chMonth").innerHTML = challenge("12 entrenos este mes", "La constancia construye tu mejor versión", tMonth, 12, 100, "i-cal")
      + challenge("Foto del mes", "Sube tu foto de evolución de este mes", s.photos.some((p) => p.month === month) ? 1 : 0, 1, 50, "i-camera")
      + challenge("Medidas al día", "Registra tus medidas 2 veces este mes", s.measures.filter((m) => m.date.startsWith(month)).length, 2, 50, "i-ruler")
      + challenge("8 sesiones guiadas", "Entrena con Workout Studio 8 veces este mes", s.sessions.filter((x) => x.date.startsWith(month)).length, 8, 100, "i-play");

    const pts = points();
    const ti = TIERS.reduce((a, t, i) => (pts >= t[0] ? i : a), 0), next = TIERS[ti + 1];
    const tierP = next ? (pts - TIERS[ti][0]) / (next[0] - TIERS[ti][0]) : 1;
    $("pointsCard").innerHTML = `<div class="points__medal" style="--p:${tierP.toFixed(3)}"><span class="points__hex">${svg("i-medal")}</span><small>Nivel ${ti + 1}</small></div>
      <div class="points__body"><p class="ahome__label">Tu nivel</p><h3>${TIERS[ti][1]}</h3><p><strong>${fmt(pts, 0)}</strong> puntos${next ? ` · te faltan ${fmt(next[0] - pts, 0)} para ${next[1]}` : " · nivel máximo"}</p>
      <div class="bar"><span style="width:${tierP * 100}%"></span></div></div>
      <ul class="points__stats"><li>${svg("i-flame")}<strong>${streak()}</strong><span>racha</span></li><li>${svg("i-trophy")}<strong>${maxStreak()}</strong><span>mejor racha</span></li><li>${svg("i-dumbbell")}<strong>${new Set(s.trainings).size}</strong><span>entrenos</span></li></ul>`;

    const un = BADGES.filter((b) => b[4]() >= b[5]);
    $("badgeCount").textContent = `${un.length} de ${BADGES.length}`;
    $("badges").innerHTML = BADGES.map(([id, name, desc, ic, f, goal]) => {
      const v = f(), ok = v >= goal;
      const pr = Math.min(1, v / goal);
      return `<li class="badge${ok ? " is-on" : ""}" title="${desc}"><span class="badge__ic" style="--p:${pr.toFixed(3)}"><span class="badge__hex">${svg(ic)}</span>${ok ? `<i class="badge__ok">${svg("i-check")}</i>` : ""}</span><strong>${name}</strong><small>${desc}</small><small class="badge__p">${ok ? "Desbloqueada" : `${fmt(Math.min(v, goal), 0)} / ${goal}`}</small></li>`;
    }).join("");
    // Aviso de insignia nueva (con datos de ejemplo no se avisa)
    const fresh = un.filter((b) => !s.badgesSeen.includes(b[0]));
    if (fresh.length) {
      s.badgesSeen.push(...fresh.map((b) => b[0]));
      A.save();
      if (!s.demo && renderedOnce) toast(`Nueva insignia: ${fresh[0][1]} 🏅`);
    }
  };

  /* =========================================================
     INICIO (dashboard tipo app)
     ========================================================= */
  const renderHome = () => {
    const s = S(), p = s.profile, name = myName();
    $("helloName").textContent = name || "bienvenida";
    const av = $("avatarImg");
    if (p.avatar) { av.src = p.avatar; av.hidden = false; $("avatarIcon").style.display = "none"; } else { av.hidden = true; $("avatarIcon").style.display = ""; }
    const ws = sorted(s.measures).filter((m) => m.weight != null);
    const chips = [];
    if (p.goalText) chips.push(`<li><svg class="icon"><use href="#i-target"/></svg>${esc(p.goalText)}</li>`);
    if (ws.length > 1) { const d = ws[ws.length - 1].weight - ws[0].weight; chips.push(`<li><svg class="icon"><use href="#i-chart"/></svg>${d > 0 ? "+" : ""}${fmt(d)} kg</li>`); }
    chips.push(`<li><svg class="icon"><use href="#i-flame"/></svg>${streak()} días de racha</li>`);
    $("helloChips").innerHTML = chips.join("");

    const d = today(), trained = s.trainings.includes(d);
    const planned = (s.plan[d] || []).map((x) => ({ ...x, r: routineById(x.routineId) })).find((x) => x.r && !x.done);
    const btn = $("todayStart"), lab = btn.querySelector("span");
    if (planned) {
      const min = estMin(planned.r), kc = estKcal(min);
      $("todayName").textContent = planned.r.name;
      $("todayMeta").innerHTML = `<li><svg class="icon"><use href="#i-clock"/></svg>${esc(planned.time)} · ~${min} min</li>${kc ? `<li><svg class="icon"><use href="#i-flame"/></svg>~${kc} kcal</li>` : ""}<li>${planned.r.ex.length} ejercicios</li>`;
      lab.textContent = "Empezar entrenamiento"; btn.dataset.action = "start:" + planned.r.id;
    } else if (trained) {
      $("todayName").textContent = "¡Hoy ya has entrenado!";
      $("todayMeta").innerHTML = `<li>Descansa, hidrátate y registra tus hábitos</li>`;
      lab.textContent = "Ver mis hábitos"; btn.dataset.action = "go:nutri";
    } else if (s.routines.length) {
      $("todayName").textContent = "Sin entreno programado";
      $("todayMeta").innerHTML = `<li>Elige una de tus ${s.routines.length} rutinas o prográmala en tu agenda</li>`;
      lab.textContent = "Elegir rutina"; btn.dataset.action = "go:train";
    } else {
      $("todayName").textContent = "Crea tu primera rutina";
      $("todayMeta").innerHTML = `<li>Empieza con una plantilla base en Workout Studio</li>`;
      lab.textContent = "Ir a Workout Studio"; btn.dataset.action = "go:train";
    }

    const wk = weekDates(), target = s.weekTarget || 4;
    const tW = wk.filter((x) => s.trainings.includes(x)).length;
    const hW = wk.reduce((t, x) => t + habitsOf(x).length, 0);
    const water = s.water[d] || 0, act = s.activity[d] || {}, goals = s.activityGoals || {};
    const parts = [Math.min(1, tW / target), Math.min(1, hW / 35), Math.min(1, water / waterGoal())];
    const pct = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
    $("weekPct").textContent = pct + "%"; setRing($("weekRing"), pct / 100);
    const bar = (ic, label, v, g, txt) => `<li><svg class="icon"><use href="#${ic}"/></svg><div><p><strong>${txt}</strong> ${label}</p><div class="bar"><span style="width:${Math.min(100, (v / (g || 1)) * 100)}%"></span></div></div></li>`;
    $("weekBars").innerHTML = bar("i-dumbbell", "entrenos", tW, target, `${tW} / ${target}`)
      + bar("i-heart", "hábitos esta semana", hW, 35, `${hW} / 35`)
      + bar("i-drop", "de agua hoy", water, waterGoal(), `${fmt(water / 1000, 2)} / ${fmt(waterGoal() / 1000, 1)} L`)
      + bar("i-steps", "pasos hoy", act.steps || 0, goals.steps || 8000, fmt(act.steps || 0, 0));
  };
  $("todayStart").addEventListener("click", (e) => {
    const [k, v] = (e.currentTarget.dataset.action || "go:train").split(":");
    if (k === "start") startWorkout(v); else A.go(v);
  });
  $("avatarInput").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const big = await A.u.resizePhoto(f);
      const img = new Image(); img.src = big; await img.decode();
      const c = document.createElement("canvas"), z = 240, m = Math.min(img.width, img.height);
      c.width = c.height = z;
      c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, z, z);
      S().profile.avatar = c.toDataURL("image/jpeg", 0.82); A.save(); A.render(); toast("Foto de perfil guardada");
    } catch { toast("No se ha podido leer la foto"); }
    e.target.value = "";
  });

  /* =========================================================
     BODY EVOLUTION 360° · resumen
     ========================================================= */
  const renderEvoSum = () => {
    const s = S(), ms = sorted(s.measures), ws = ms.filter((m) => m.weight != null), cur = latestWeight(), p = s.profile;
    const g = goalProgress();
    const diff = ws.length > 1 ? ws[ws.length - 1].weight - ws[0].weight : null;
    const weeks = ws.length > 1 ? Math.max(1, Math.round((new Date(ws[ws.length - 1].date) - new Date(ws[0].date)) / (7 * DAY))) : 0;
    const rows = [["waist", "Cintura"], ["hip", "Cadera"], ["thigh", "Muslo"], ["arm", "Brazo"]].map(([k, l]) => {
      const v = ms.filter((m) => m[k] != null); if (!v.length) return "";
      const a = v[0][k], b = v[v.length - 1][k], dd = b - a;
      return `<tr><th>${l}</th><td>${fmt(b)} cm</td><td class="${dd < 0 ? "down" : dd > 0 ? "up" : ""}">${v.length > 1 && dd ? `${dd > 0 ? "+" : ""}${fmt(dd)} cm` : "—"}</td></tr>`;
    }).join("");
    $("evoSummary").innerHTML = `
      <article class="evosum__card"><p class="ahome__label">Peso actual</p><p class="evosum__big">${cur != null ? `${fmt(cur)}<small> kg</small>` : "—"}</p><p class="evosum__d">${diff != null ? `${diff > 0 ? "+" : diff < 0 ? "-" : ""}${fmt(Math.abs(diff))} kg en ${weeks} ${weeks === 1 ? "semana" : "semanas"}` : "Añade tu primer registro abajo"}</p></article>
      <article class="evosum__card evosum__ring"><div class="ring-big"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" id="evoRing" cx="60" cy="60" r="52"/></svg><span><strong>${Math.round(g * 100)}%</strong>objetivo</span></div><p>${p.goalWeight ? `Objetivo: <strong>${fmt(p.goalWeight)} kg</strong>` : "Define tu objetivo abajo"}${p.goalText ? `<br><small>${esc(p.goalText)}</small>` : ""}</p></article>
      <article class="evosum__card evosum__table"><p class="ahome__label">Medidas corporales</p>${rows ? `<table>${rows}</table>` : `<p class="evosum__d">Aún no hay medidas</p>`}</article>`;
    setRing($("evoRing"), g);
  };

  /* =========================================================
     MY COACH
     ========================================================= */
  const QM = {
    tecnica: "Tengo una duda técnica con un ejercicio:",
    rutina: "Me gustaría ajustar mi rutina:",
    nutri: "Tengo una duda de alimentación:",
    live: "Tengo una pregunta sobre LIVE Training:",
  };
  const hello = () => `¡Hola Vanessa! 💗${myName() ? ` Soy ${myName()}.` : ""}`;
  $("quickMsgs").addEventListener("click", (e) => { const b = e.target.closest("[data-qm]"); if (b) wa(`${hello()} ${QM[b.dataset.qm]} `); });
  $("checkinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = formData(e.target), s = S(), wk = weekDates();
    const tW = wk.filter((d) => s.trainings.includes(d)).length, ses = s.sessions.filter((x) => wk.includes(x.date)).length;
    wa([`${hello()} Te envío mi revisión semanal:`, "", `🔋 Energía: ${f.energy}/5`, `😴 Sueño: ${f.sleep} h`, `🏋️ Entrenando me he sentido: ${f.feel}`, `📅 Entrenos esta semana: ${tW} de ${s.weekTarget || 4}${ses ? ` (${ses} guiados en la app)` : ""}`, f.note ? `💬 ${f.note}` : ""].filter(Boolean).join("\n"));
    e.target.reset();
  });
  $("meForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = formData(e.target), p = S().profile;
    p.name = f.name.trim(); p.goalText = f.goalText.trim(); A.save(); A.render(); toast("Perfil guardado");
  });
  const renderCoach = () => {
    const p = S().profile;
    if (document.activeElement !== $("meName")) $("meName").value = p.name || "";
    if (document.activeElement !== $("meGoal")) $("meGoal").value = p.goalText || "";
  };

  /* ---------- Datos de ejemplo para estos módulos ---------- */
  A.demoExtras.push((d) => {
    const t = today();
    d.profile.name = "Laura"; d.profile.goalText = "Definición y tono";
    d.routines = [fromTemplate(TEMPLATES[0]), fromTemplate(TEMPLATES[1])];
    d.routines[0].ex[0].kg = 70;
    d.sessions = [9, 5, 2].map((n, i) => ({ id: uid(), date: addDays(t, -n), routineId: d.routines[i % 2].id, name: d.routines[i % 2].name, sec: 2700 + i * 300, sets: 18, vol: 4200 + i * 300, log: [] }));
    d.plan = { [t]: [{ id: uid(), routineId: d.routines[0].id, time: "18:30" }], [addDays(t, 2)]: [{ id: uid(), routineId: d.routines[1].id, time: "09:00" }] };
    d.habits = {}; [0, 1, 2, 3].forEach((i) => (d.habits[addDays(t, -i)] = ["food", "sleep", "mind"].slice(0, 3 - (i % 2))));
    d.badgesSeen = [];
  });

  /* ---------- Render conectado con app.js ---------- */
  let renderedOnce = false;
  A.onRender(() => {
    ensure();
    renderHome(); renderStudio(); renderCal(); renderHabits(); renderGoals(); renderEvoSum(); renderCoach();
    renderedOnce = true;
  });
})();
