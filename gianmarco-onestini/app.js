(function () {
  'use strict';
  var PHONE = '34722705922', EMAIL = 'joseandresautomatiza@gmail.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  var WA_TEXT = 'Hola José Andrés, quiero información para contratar a Gianmarco Onestini.';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var buzz = function () { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  $('#year').textContent = new Date().getFullYear();
  $$('.js-wa').forEach(function (a) { a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(WA_TEXT); });

  /* ---------- Música: Ibiza Global Radio en directo (respaldo: pista propia). Arranca con el primer toque o al pulsar "Entrar" ---------- */
  var Music = (function () {
    var RADIO = 'https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3', LOCAL = 'musica.mp3';
    var a = $('#music'), btn = $('#soundBtn'), VOL = 0.45, off = false, fadeT, usingLocal = false, wd;
    try { off = localStorage.getItem('goMute') === '1'; } catch (e) {}
    a.volume = 0;
    function ui(on) { btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.title = on ? 'Ibiza Global Radio · silenciar' : 'Activar música'; }
    function fade(to) {
      clearInterval(fadeT);
      fadeT = setInterval(function () {
        var up = to > a.volume, v = a.volume + (up ? .03 : -.05);
        if ((up && v >= to) || (!up && v <= to)) { v = to; clearInterval(fadeT); if (to === 0) a.pause(); }
        try { a.volume = Math.max(0, Math.min(1, v)); } catch (e) {}
      }, 80);
    }
    function useLocal() { if (usingLocal) return; usingLocal = true; a.loop = true; a.src = LOCAL; if (!off) play(); }
    function load() { if (usingLocal) return; a.loop = false; a.src = RADIO + '?t=' + Date.now(); a.load(); }
    a.addEventListener('error', function () { if (!usingLocal) useLocal(); });
    a.addEventListener('playing', function () { clearTimeout(wd); });
    var evs = ['pointerdown', 'touchend', 'keydown', 'click'];
    function disarm() { evs.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); }); }
    function play() {
      if (!a.getAttribute('src')) load();
      a.volume = 0;
      var p = a.play();
      clearTimeout(wd);
      if (!usingLocal) wd = setTimeout(function () { if (a.paused || a.readyState < 3) useLocal(); }, 9000);
      if (p && p.then) p.then(function () { ui(true); fade(VOL); disarm(); }).catch(function (e) { if (e && e.name === 'NotAllowedError') ui(false); else useLocal(); });
    }
    function start() { if (!off && a.paused) play(); }
    function onGesture(e) { if (e.target.closest && e.target.closest('#soundBtn')) return; start(); }
    evs.forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
    btn.addEventListener('click', function () {
      if (!a.paused && a.volume > 0) { off = true; clearTimeout(wd); fade(0); ui(false); }
      else { off = false; if (!usingLocal) load(); play(); }
      try { localStorage.setItem('goMute', off ? '1' : '0'); } catch (e) {}
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (!a.paused) a.pause(); }
      else if (!off && btn.classList.contains('on')) { if (!usingLocal) load(); play(); }
    });
    ui(false);
    return { start: start };
  })();

  /* ---------- Intro: apertura de cine con ojo, monograma dorado, focos de escenario y botón "Entrar" ---------- */
  (function () {
    if (!root.classList.contains('show-intro')) return;
    var intro = $('#intro'), done = false;
    var cv = $('#beams'), cx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W, H, raf, P = [];
    function size() { W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr; }
    size(); addEventListener('resize', size);
    for (var i = 0; i < (innerWidth < 600 ? 45 : 80); i++) P.push({ x: Math.random(), y: Math.random(), r: .4 + Math.random() * 1.4, s: .0002 + Math.random() * .0008, ph: Math.random() * 6.28 });
    var beams = [{ x: .12, c: '214,183,122', sp: .55, ph: 0 }, { x: .88, c: '214,183,122', sp: .48, ph: 2 }, { x: .5, c: '120,150,255', sp: .38, ph: 4 }, { x: .3, c: '229,25,58', sp: .62, ph: 1 }, { x: .7, c: '120,150,255', sp: .5, ph: 3 }];
    var t0 = performance.now() + 3000, tStart = performance.now(), tc = $('#eyeTc'), eye = $('#eyeOpen');
    function go() { intro.classList.add('go'); }
    if (reduce) { go(); t0 = performance.now(); if (eye) eye.remove(); }
    else { setTimeout(go, 3000); setTimeout(function () { if (eye) eye.remove(); eye = null; }, 4200); }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function frame(now) {
      if (eye && tc) { var s = (now - tStart) / 1000; tc.textContent = '21:00:' + pad(Math.floor(s)) + ':' + pad(Math.floor((s % 1) * 25)); }
      var t = (now - t0) / 1000, e = Math.min(1, Math.max(0, (t - .5) / 2));
      cx.clearRect(0, 0, W, H);
      beams.forEach(function (b, k) {
        var ang = Math.sin(t * b.sp + b.ph) * .45, len = H * 1.25, wid = W * .09 + Math.sin(t + k) * W * .02;
        var x0 = b.x * W, y0 = H * 1.02, tx = x0 + Math.sin(ang) * -len, ty = y0 - Math.cos(ang) * len;
        var g = cx.createLinearGradient(x0, y0, tx, ty);
        var a = e * (k > 2 ? .16 : .22) * (.7 + .3 * Math.sin(t * 2.1 + k));
        g.addColorStop(0, 'rgba(' + b.c + ',' + a + ')'); g.addColorStop(1, 'rgba(' + b.c + ',0)');
        var nx = Math.cos(ang) * wid, ny = Math.sin(ang) * wid;
        cx.fillStyle = g; cx.beginPath(); cx.moveTo(x0 - 6 * dpr, y0); cx.lineTo(x0 + 6 * dpr, y0); cx.lineTo(tx + nx, ty + ny); cx.lineTo(tx - nx, ty - ny); cx.closePath(); cx.fill();
      });
      for (var j = 0; j < P.length; j++) {
        var p = P[j]; p.y -= p.s; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        var al = e * (.3 + .7 * Math.abs(Math.sin(now / 800 + p.ph))), R = p.r * 4 * dpr;
        var gr = cx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, R);
        gr.addColorStop(0, 'rgba(247,231,191,' + al + ')'); gr.addColorStop(1, 'rgba(214,183,122,0)');
        cx.fillStyle = gr; cx.beginPath(); cx.arc(p.x * W, p.y * H, R, 0, 6.283); cx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    if (!reduce) raf = requestAnimationFrame(frame);
    function enter(ev) {
      if (done) return; done = true;
      Music.start(); buzz();
      try { sessionStorage.setItem('goIntro', '1'); } catch (e) {}
      var x = ev && ev.clientX ? ev.clientX : innerWidth / 2, y = ev && ev.clientY ? ev.clientY : innerHeight * .75;
      intro.style.setProperty('--x', x + 'px'); intro.style.setProperty('--y', y + 'px');
      if (!(window.CSS && CSS.registerProperty) || reduce) intro.classList.add('nofx');
      intro.classList.add('exit');
      setTimeout(function () { root.classList.remove('show-intro'); scrollTo(0, 0); }, 500);
      setTimeout(function () { cancelAnimationFrame(raf); intro.remove(); }, 1350);
    }
    intro.addEventListener('click', enter);
    intro.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); enter(); } });
    setTimeout(function () { try { $('#enterBtn').focus({ preventScroll: true }); } catch (e) {} }, 6400);
  })();

  /* ---------- Pestañas ---------- */
  var VIEWS = ['inicio', 'trayectoria', 'fotos', 'contacto'], current = null, bar = $('#appbar');
  var NAMES = { trayectoria: 'Trayectoria', fotos: 'Fotos', contacto: 'Contacto' };
  function viewFromHash() { var h = location.hash.slice(1); return VIEWS.indexOf(h) >= 0 ? h : 'inicio'; }
  function paint(v) {
    VIEWS.forEach(function (n) { $('#v-' + n).hidden = n !== v; });
    $$('[data-nav]').forEach(function (a) { if (a.dataset.nav === v && !a.classList.contains('brand')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    current = v; onScroll(); scrollTo(0, 0);
    document.title = (NAMES[v] ? NAMES[v] + ' · ' : '') + 'Gianmarco Onestini · Eventos, DJ y colaboraciones';
  }
  function go(v, push) {
    if (v === current) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (push) history.pushState(null, '', '#' + v);
    if (document.startViewTransition && !reduce && current) document.startViewTransition(function () { paint(v); }); else paint(v);
  }
  $$('[data-nav]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); buzz(); go(a.dataset.nav, true); }); });
  function onScroll() { bar.classList.toggle('solid', current !== 'inicio' || scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true });
  paint(viewFromHash());

  (function () {
    var s = $$('#slides img'), i = 0; if (reduce) return;
    setInterval(function () {
      var n = (i + 1) % s.length, im = s[n];
      if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
      s[i].classList.remove('on'); void im.offsetWidth; im.classList.add('on'); i = n;
    }, 5500);
  })();

  /* ---------- Galería ---------- */
  var PHOTOS = [
    ['denim', 'Editorial', 'moda'], ['dj-festival', 'En cabina, ante miles de personas', 'dj'], ['gala-longoria', 'Global Gift Gala con Eva Longoria', 'eventos'],
    ['prada', 'Prada', 'moda'], ['etdd', 'Ganador de El tiempo del descuento', 'tv'], ['dj-publico', 'Festival', 'dj'],
    ['traje', 'Gala benéfica', 'eventos'], ['retrato', 'Retrato', 'moda'], ['forbes', 'Premios Forbes · Best Content Creators', 'eventos'],
    ['supervivientes', 'Final de Supervivientes', 'tv'], ['dj-mic', 'Show en directo', 'dj'], ['lv-tienda', 'Louis Vuitton', 'moda'],
    ['premio', 'Favorito de España 2021', 'eventos'], ['mar', 'Verano', 'moda'], ['embajada', 'Embajada de Italia', 'eventos'],
    ['backstage', 'Backstage', 'dj'], ['arena', 'Campaña Arena', 'moda'], ['derulo', 'Con Jason Derulo', 'eventos'],
    ['gianmarquistas', 'Los Gianmarquistas', 'dj'], ['madrid', 'Madrid', 'moda'], ['senado', 'Senado de España', 'eventos'],
    ['lamborghini', 'Lamborghini', 'moda'], ['lv-noche', 'Noche en Louis Vuitton', 'moda'], ['terraza', 'Terraza', 'moda'],
    ['institucional', 'Acto institucional', 'eventos'], ['verano', 'Lifestyle', 'moda']
  ];
  var grid = $('#grid'), filter = 'all';
  PHOTOS.forEach(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.c = p[2];
    b.innerHTML = '<img loading="lazy" src="img/' + p[0] + '-s.webp" alt="' + esc(p[1]) + '">';
    b.onclick = function () { openLb(i); }; grid.appendChild(b);
  });
  [1, 2, 4, 8, 3, 10].forEach(function (i) {
    var p = PHOTOS[i], b = document.createElement('button'); b.type = 'button'; b.className = 'thumb';
    b.innerHTML = '<img loading="lazy" src="img/' + p[0] + '-s.webp" alt="' + esc(p[1]) + '"><span>' + esc(p[1]) + '</span>';
    b.onclick = function () { filter = 'all'; syncFilters(); openLb(i); }; $('#peek').appendChild(b);
  });
  function syncFilters() {
    $$('#filters button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.f === filter ? 'true' : 'false'); });
    $$('#grid button').forEach(function (x) { x.hidden = filter !== 'all' && x.dataset.c !== filter; });
  }
  $$('#filters button').forEach(function (b) {
    b.onclick = function () { filter = b.dataset.f; buzz(); if (document.startViewTransition && !reduce) document.startViewTransition(syncFilters); else syncFilters(); };
  });
  var lb = $('#lb'), track = $('#lbTrack'), lbList = [];
  function openLb(i) {
    lbList = PHOTOS.map(function (p, k) { return k; }).filter(function (k) { return filter === 'all' || PHOTOS[k][2] === filter; });
    track.innerHTML = lbList.map(function (k) { return '<figure><img loading="lazy" src="img/' + PHOTOS[k][0] + '.webp" alt="' + esc(PHOTOS[k][1]) + '"><figcaption>' + esc(PHOTOS[k][1]) + '</figcaption></figure>'; }).join('');
    lb.showModal();
    var pos = Math.max(0, lbList.indexOf(i));
    requestAnimationFrame(function () { track.scrollLeft = pos * track.clientWidth; count(); });
  }
  function count() { $('#lbCount').textContent = (Math.round(track.scrollLeft / track.clientWidth) + 1) + ' / ' + lbList.length; }
  track.addEventListener('scroll', count, { passive: true });
  $('#lbClose').onclick = function () { lb.close(); };
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
  });

  /* ---------- Compartir y PWA ---------- */
  function toast(t) {
    var el = document.createElement('div'); el.textContent = t;
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%);background:#141C31;border:1px solid rgba(214,183,122,.4);color:#F4EFE6;padding:12px 18px;border-radius:999px;font-size:.85rem;z-index:2000';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2400);
  }
  $('#shareBtn').onclick = function () {
    var url = location.origin + location.pathname;
    var data = { title: 'Gianmarco Onestini · Eventos y colaboraciones', text: 'DJ, modelo y rostro de GH VIP. Contrataciones y colaboraciones.', url: url };
    if (navigator.share) navigator.share(data).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Enlace copiado'); });
  };
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });

  /* =================== SOLICITUD =================== */
  var TYPES = { dj: 'Sesión DJ', evento: 'Presencia en evento', marca: 'Colaboración de marca', tv: 'TV, prensa o pódcast', host: 'Presentador / host', otro: 'Otra propuesta' };
  var book = $('#book'), form = $('#bookForm'), steps = $$('.step', book), body = $('#bkBody');
  var S = { step: 0 };
  var NEXT = ['Continuar', 'Continuar', 'Continuar', 'Revisar propuesta', 'Enviar por WhatsApp', 'Cerrar'];
  var F = { fecha: $('#fecha'), flex: $('#flex'), ciudad: $('#ciudad'), pais: $('#pais'), nombre: $('#nombre'), empresa: $('#empresa'), telefono: $('#telefono'), email: $('#email'), budget: $('#budget'), mensaje: $('#mensaje'), priv: $('#privacidad') };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  F.fecha.min = iso(today);
  function radio(n) { var x = form.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ''; }
  function checks(id) { return $$('#' + id + ' input:checked').map(function (x) { return x.value; }); }
  function fechaTxt() {
    if (F.flex.checked || !F.fecha.value) return 'Flexible / por definir';
    var p = F.fecha.value.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function openBook(preset) {
    if (preset && TYPES[preset]) { form.querySelector('input[name="tipo"][value="' + preset + '"]').checked = true; S.step = 1; }
    else if (S.step === 5) S.step = 0;
    if (!book.open) { book.showModal(); history.pushState({ sheet: 1 }, ''); }
    render(false); buzz();
  }
  function closeBook() { if (history.state && history.state.sheet) history.back(); else if (book.open) book.close(); }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openBook(b.dataset.book || ''); }); });
  $('#bkClose').onclick = closeBook;
  book.addEventListener('cancel', function (e) { e.preventDefault(); closeBook(); });
  book.addEventListener('click', function (e) { if (e.target === book) closeBook(); });
  book.addEventListener('close', function () { if (S.step === 5) reset(); });
  addEventListener('popstate', function () {
    if (book.open && !(history.state && history.state.sheet)) book.close();
    if (lb.open) lb.close();
    var v = viewFromHash(); if (v !== current) go(v, false);
  });
  (function () {
    var top = $('.sh-top', book), y0 = null, dy = 0;
    top.addEventListener('pointerdown', function (e) { if (innerWidth >= 900 || e.target.closest('button')) return; y0 = e.clientY; dy = 0; book.style.transition = 'none'; top.setPointerCapture(e.pointerId); });
    top.addEventListener('pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); book.style.transform = 'translateY(' + dy + 'px)'; });
    function end() { if (y0 === null) return; y0 = null; book.style.transition = 'transform .3s'; book.style.transform = ''; if (dy > 110) closeBook(); }
    top.addEventListener('pointerup', end); top.addEventListener('pointercancel', end);
  })();
  form.addEventListener('change', function (e) {
    if (e.target.name === 'tipo') { bump(); render(false); setTimeout(function () { if (S.step === 0) move(1); }, 260); return; }
    if (e.target === F.flex) $('#fFecha').classList.remove('bad');
    render(false);
  });
  form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('bad'); });
  F.priv.addEventListener('change', function () { $('#legalLbl').classList.remove('bad'); });
  function bump() { var p = $('#bkPill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }

  function validate(step, mark) {
    var ok = true;
    function set(el, bad) { if (mark) el.closest('.field').classList.toggle('bad', bad); if (bad) ok = false; }
    if (step === 1) {
      set(F.fecha, !F.flex.checked && (!F.fecha.value || F.fecha.value < iso(today)));
      set(F.ciudad, F.ciudad.value.trim().length < 2);
    }
    if (step === 2) set(F.budget, F.budget.value.trim().length < 1);
    if (step === 3) {
      set(F.nombre, F.nombre.value.trim().length < 2);
      set(F.empresa, F.empresa.value.trim().length < 2);
      set(F.telefono, F.telefono.value.replace(/\D/g, '').length < 9);
      set(F.email, !/^\S+@\S+\.\S+$/.test(F.email.value.trim()));
      if (mark) $('#legalLbl').classList.toggle('bad', !F.priv.checked);
      if (!F.priv.checked) ok = false;
    }
    return ok;
  }
  function data() {
    var d = {
      'Tipo': TYPES[radio('tipo')] || '', 'Fecha': fechaTxt(), 'Lugar': F.ciudad.value.trim() + ' (' + F.pais.value + ')',
      'Tamaño': radio('aforo') || 'Sin indicar', 'Presupuesto': F.budget.value.trim(),
      'Nombre': F.nombre.value.trim(), 'Empresa': F.empresa.value.trim(), 'Teléfono': F.telefono.value.trim(), 'Email': F.email.value.trim()
    };
    var ex = checks('extras'); if (ex.length) d['Incluye'] = ex.join(', ');
    if (F.mensaje.value.trim()) d['Mensaje'] = F.mensaje.value.trim();
    return d;
  }
  function drawRecap() {
    var d = data(), go = { 'Fecha': 1, 'Lugar': 1, 'Tamaño': 1, 'Presupuesto': 2, 'Incluye': 2, 'Nombre': 3, 'Empresa': 3, 'Teléfono': 3, 'Email': 3, 'Mensaje': 3 };
    $('#rcType').textContent = d['Tipo'];
    $('#rcList').innerHTML = Object.keys(d).filter(function (k) { return k !== 'Tipo'; }).map(function (k) {
      return '<dt>' + k + '</dt><dd>' + esc(d[k]) + ' <button type="button" class="edit" data-go="' + go[k] + '">Editar</button></dd>';
    }).join('');
  }
  $('#rcList').addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { S.step = +b.dataset.go; render(true); } });

  function render(back) {
    var t = radio('tipo');
    $('#bkPill').textContent = t ? TYPES[t] : 'Elige el tipo';
    steps.forEach(function (s, k) { var on = k === S.step; if (on && !s.classList.contains('on')) s.classList.toggle('back', !!back); s.classList.toggle('on', on); });
    $('#bkTitle').textContent = steps[S.step].dataset.title;
    $('#bkStep').textContent = S.step < 5 ? 'Paso ' + (S.step + 1) + ' de 5' : 'Enviada';
    $('#bkBar').style.width = ((Math.min(S.step, 4) + 1) / 5 * 100) + '%';
    $('#bkBack').hidden = S.step === 0 || S.step === 5;
    var nx = $('#bkNext');
    nx.innerHTML = (S.step === 4 ? '<svg class="f" style="width:19px;height:19px"><use href="#i-wa"/></svg>' : '') + NEXT[S.step];
    nx.className = 'btn ' + (S.step === 4 ? 'btn-wa' : 'btn-gold');
    nx.disabled = S.step === 0 && !t;
    F.fecha.disabled = F.flex.checked;
    if (S.step === 4) drawRecap();
  }
  function move(to) { var back = to < S.step; S.step = to; body.scrollTop = 0; render(back); buzz(); }
  $('#bkBack').onclick = function () { if (S.step > 0) move(S.step - 1); };
  $('#bkNext').onclick = function () {
    if (S.step === 5) { closeBook(); return; }
    if (S.step === 0 && !radio('tipo')) return;
    if (!validate(S.step, true)) { var bad = $('.field.bad input, .field.bad textarea', book); (bad || F.priv).focus(); return; }
    if (S.step === 4) { send(); return; }
    move(S.step + 1);
  };
  [F.nombre, F.empresa, F.telefono, F.email].forEach(function (el, i, arr) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); (arr[i + 1] || F.mensaje).focus(); } }); });

  function send() {
    if (form._honey.value) return;
    var d = data();
    var wa = ['Hola José Andrés, quiero proponer una colaboración con Gianmarco Onestini 🎧', '',
      '✨ Tipo: ' + d['Tipo'], '📅 Fecha: ' + d['Fecha'], '📍 Lugar: ' + d['Lugar'], '👥 Tamaño: ' + d['Tamaño'], '💶 Presupuesto: ' + d['Presupuesto']];
    if (d['Incluye']) wa.push('➕ Incluye: ' + d['Incluye']);
    wa.push('', 'Nombre: ' + d['Nombre'], 'Empresa: ' + d['Empresa'], 'Teléfono: ' + d['Teléfono'], 'Email: ' + d['Email']);
    if (d['Mensaje']) wa.push('', 'Idea: ' + d['Mensaje']);
    wa.push('', '¿Está disponible?');
    var url = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(wa.join('\n'));
    window.open(url, '_blank', 'noopener');
    var payload = Object.assign({}, d, { _subject: 'Propuesta para Gianmarco Onestini: ' + d['Tipo'] + ' · ' + d['Empresa'] + ' · ' + d['Fecha'], _template: 'table', _replyto: d['Email'] });
    try { fetch(ENDPOINT, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {}); } catch (e) {}
    $('#doneWa').href = url;
    move(5);
  }
  function reset() {
    S.step = 0; form.reset(); F.fecha.disabled = false;
    $$('.field.bad', book).forEach(function (f) { f.classList.remove('bad'); });
  }
  render(false);
})();
