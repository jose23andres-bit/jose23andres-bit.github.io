(function () {
  'use strict';
  var PHONE = '34722705922', EMAIL = 'joseandresautomatiza@gmail.com';
  var ENDPOINT = 'https://formsubmit.co/ajax/' + EMAIL;
  var WA_TEXT = 'Hola, quiero información para reservar la Escapada Rural en Ciudad Real (by Aureon Project).';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var buzz = function () { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();
  $$('.js-wa').forEach(function (a) { a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(WA_TEXT); });

  /* ---------- Música: arranca con el primer toque (los navegadores no dejan sonar sin gesto) ---------- */
  (function () {
    var a = $('#music'), btn = $('#soundBtn'), VOL = 0.38, off = false, fadeT;
    try { off = localStorage.getItem('aureonMute') === '1'; } catch (e) {}
    a.volume = 0;
    function ui(on) { btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    function fade(to) {
      clearInterval(fadeT);
      fadeT = setInterval(function () {
        var up = to > a.volume, v = a.volume + (up ? .02 : -.04);
        if ((up && v >= to) || (!up && v <= to)) { v = to; clearInterval(fadeT); if (to === 0) a.pause(); }
        a.volume = Math.max(0, Math.min(1, v));
      }, 80);
    }
    var evs = ['pointerdown', 'touchend', 'keydown', 'click'];
    function disarm() { evs.forEach(function (ev) { document.removeEventListener(ev, onGesture, true); }); }
    function start() { if (off) return; var p = a.play(); if (p && p.then) p.then(function () { ui(true); fade(VOL); disarm(); }).catch(function () { ui(false); }); }
    function onGesture(e) { if (e.target.closest && e.target.closest('#soundBtn')) return; start(); }
    evs.forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
    btn.addEventListener('click', function () {
      if (!a.paused && a.volume > 0) { off = true; fade(0); ui(false); }
      else { off = false; a.play().then(function () { ui(true); fade(VOL); disarm(); }).catch(function () {}); }
      try { localStorage.setItem('aureonMute', off ? '1' : '0'); } catch (e) {}
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && !a.paused) a.pause();
      else if (!document.hidden && !off && btn.classList.contains('on')) a.play().catch(function () {});
    });
    ui(false); start();
  })();

  /* ---------- Intro ---------- */
  (function () {
    if (!root.classList.contains('show-intro')) return;
    var intro = $('#intro'), done = false, t = setTimeout(finish, 6200);
    function finish() {
      if (done) return; done = true; clearTimeout(t);
      try { localStorage.setItem('aureonIntro', '1'); } catch (e) {}
      intro.classList.add('leaving');
      setTimeout(function () { intro.classList.add('open'); }, 450);
      setTimeout(function () { intro.classList.add('out'); }, 900);
      setTimeout(function () { root.classList.remove('show-intro'); intro.remove(); scrollTo(0, 0); }, 1800);
    }
    intro.addEventListener('click', finish);
  })();

  /* ---------- Router de pestañas (View Transitions API) ---------- */
  var VIEWS = ['inicio', 'casa', 'fotos', 'info'], current = null, bar = $('#appbar');
  function viewFromHash() { var h = location.hash.slice(1); return VIEWS.indexOf(h) >= 0 ? h : 'inicio'; }
  function paint(v) {
    VIEWS.forEach(function (n) { $('#v-' + n).hidden = n !== v; });
    $$('[data-nav]').forEach(function (a) { if (a.dataset.nav === v && !a.classList.contains('brand')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    current = v; onScroll(); scrollTo(0, 0);
    document.title = (v === 'inicio' ? '' : ({ casa: 'La casa', fotos: 'Fotos', info: 'Info' })[v] + ' · ') + 'Escapada Rural en Ciudad Real';
  }
  function go(v, push) {
    if (v === current) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (push) history.pushState(null, '', '#' + v);
    if (document.startViewTransition && !reduce && current) document.startViewTransition(function () { paint(v); });
    else paint(v);
  }
  $$('[data-nav]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); buzz(); go(a.dataset.nav, true); }); });
  function onScroll() { bar.classList.toggle('solid', current !== 'inicio' || scrollY > 40); }
  addEventListener('scroll', onScroll, { passive: true });
  paint(viewFromHash());

  /* ---------- Hero ---------- */
  (function () {
    var s = $$('#slides img'), i = 0;
    if (reduce) return;
    setInterval(function () {
      var n = (i + 1) % s.length, im = s[n];
      if (im.dataset.src) { im.src = im.dataset.src; im.removeAttribute('data-src'); }
      s[i].classList.remove('on'); void im.offsetWidth; im.classList.add('on'); i = n;
    }, 6000);
  })();

  /* ---------- Fotos ---------- */
  var PHOTOS = [
    ['hero', 'La casa y la piscina', 'ext'], ['piscina', 'La piscina', 'agua'], ['jacuzzi', 'El jacuzzi acristalado', 'agua'],
    ['porche-vistas', 'Vistas desde el porche', 'ext'], ['salon', 'El salón', 'int'], ['jacuzzi-burbujas', 'Burbujas con vistas', 'agua'],
    ['casa-palmera', 'La finca', 'ext'], ['salon-chimenea', 'Junto a la chimenea', 'int'], ['padel', 'La pista de pádel', 'ext'],
    ['cocina', 'La cocina', 'int'], ['dormitorio-matrimonio', 'Dormitorio de matrimonio', 'dorm'], ['jacuzzi-nieve', 'También en invierno', 'agua'],
    ['barbacoa', 'La barbacoa', 'ext'], ['dormitorio', 'Doble I', 'dorm'], ['porche', 'El porche', 'ext'], ['grifo-cerveza', 'Grifo de cerveza', 'int'],
    ['dormitorio-2', 'Doble II', 'dorm'], ['piscina-casa', 'Piscina junto a la casa', 'agua'], ['jardin', 'El jardín', 'ext'],
    ['cocina-2', 'Cocina y comedor', 'int'], ['dormitorio-3', 'Doble III', 'dorm'], ['noche', 'Noches de estrellas', 'ent'],
    ['rio', 'El río', 'ent'], ['rio-2', 'Paseos junto al río', 'ent']
  ];
  var grid = $('#grid'), filter = 'all';
  PHOTOS.forEach(function (p, i) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.dataset.c = p[2];
    b.innerHTML = '<img loading="lazy" src="img/' + p[0] + '-s.webp" alt="' + p[1] + '">';
    b.onclick = function () { openLb(i); }; grid.appendChild(b);
  });
  [0, 2, 4, 8, 10, 22].forEach(function (i) {
    var p = PHOTOS[i], b = document.createElement('button'); b.type = 'button'; b.className = 'thumb';
    b.innerHTML = '<img loading="lazy" src="img/' + p[0] + '-s.webp" alt="' + p[1] + '"><span>' + p[1] + '</span>';
    b.onclick = function () { filter = 'all'; syncFilters(); openLb(i); }; $('#peek').appendChild(b);
  });
  function syncFilters() {
    $$('#filters button').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.f === filter ? 'true' : 'false'); });
    $$('#grid button').forEach(function (x) { x.hidden = filter !== 'all' && x.dataset.c !== filter; });
  }
  $$('#filters button').forEach(function (b) {
    b.onclick = function () {
      filter = b.dataset.f; buzz();
      if (document.startViewTransition && !reduce) document.startViewTransition(syncFilters); else syncFilters();
    };
  });

  var lb = $('#lb'), track = $('#lbTrack'), lbList = [];
  function openLb(i) {
    lbList = PHOTOS.map(function (p, k) { return k; }).filter(function (k) { return filter === 'all' || PHOTOS[k][2] === filter; });
    track.innerHTML = lbList.map(function (k) { return '<figure><img loading="lazy" src="img/' + PHOTOS[k][0] + '.webp" alt="' + PHOTOS[k][1] + '"><figcaption>' + PHOTOS[k][1] + '</figcaption></figure>'; }).join('');
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

  /* ---------- Historias (puntos) ---------- */
  var stories = $('#stories'), sdots = $$('#storyDots i');
  stories.addEventListener('scroll', function () {
    var w = stories.firstElementChild.getBoundingClientRect().width + 12, k = Math.round(stories.scrollLeft / w);
    sdots.forEach(function (d, j) { d.classList.toggle('on', j === Math.min(k, sdots.length - 1)); });
  }, { passive: true });

  /* ---------- Compartir ---------- */
  function toast(t) {
    var el = document.createElement('div'); el.textContent = t;
    el.style.cssText = 'position:fixed;left:50%;bottom:calc(96px + env(safe-area-inset-bottom));transform:translateX(-50%);background:#2A241E;border:1px solid rgba(201,164,92,.4);color:#F3EAD9;padding:12px 18px;border-radius:999px;font-size:.85rem;z-index:2000';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2400);
  }
  $('#shareBtn').onclick = function () {
    var url = location.origin + location.pathname, data = { title: 'Escapada Rural en Ciudad Real', text: 'Casa rural entera para 12 con piscina y jacuzzi. Fin de semana 850 € o 1.050 € con jacuzzi.', url: url };
    if (navigator.share) navigator.share(data).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Enlace copiado'); });
  };

  /* ---------- App instalable (PWA) ---------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  (function () {
    var box = $('#installBox'), btn = $('#installBtn'), deferred = null;
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) return;
    addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; box.classList.add('on'); });
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) { box.classList.add('on'); btn.hidden = true; $('#installTxt').textContent = 'En iPhone: pulsa Compartir y luego “Añadir a pantalla de inicio”.'; }
    btn.onclick = function () { if (deferred) { deferred.prompt(); deferred = null; box.classList.remove('on'); } };
  })();

  /* =================== RESERVA =================== */
  var book = $('#book'), form = $('#bookForm'), steps = $$('.step', book), body = $('#bkBody');
  var S = { step: 0, mode: 'finde', plan: 'sin', start: null, end: null, people: 0, cursor: null };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var MAXD = new Date(today); MAXD.setFullYear(MAXD.getFullYear() + 1);
  var NEXT = ['Elegir fechas', 'Continuar', 'Continuar', 'Revisar solicitud', 'Enviar por WhatsApp', 'Cerrar'];

  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function same(a, b) { return a && b && a.getTime() === b.getTime(); }
  function friOf(d) { return addDays(d, 5 - d.getDay()); }
  function nights() { return Math.round((S.end - S.start) / 864e5); }
  function long(d) { return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function short(d) { return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function priceTxt() { return S.mode === 'semana' ? 'Por privado' : (S.plan === 'con' ? '1.050 €' : '850 €'); }
  function weekdayIn(d) { var g = d.getDay(); return g >= 1 && g <= 4; }

  function openBook(preset) {
    S.step = 0;
    if (preset === 'sin' || preset === 'con') { S.mode = 'finde'; S.plan = preset; S.step = 1; }
    else if (preset === 'semana') { S.mode = 'semana'; }
    syncOptionInputs();
    if (S.step === 1 && !S.start) S.cursor = null;
    if (!book.open) { book.showModal(); history.pushState({ sheet: 1 }, ''); }
    render(false); buzz();
  }
  function closeBook() { if (history.state && history.state.sheet) history.back(); else if (book.open) book.close(); }
  $$('[data-book]').forEach(function (b) { b.addEventListener('click', function () { openBook(b.dataset.book || ''); }); });
  $('#bkClose').onclick = closeBook;
  book.addEventListener('cancel', function (e) { e.preventDefault(); closeBook(); });
  book.addEventListener('click', function (e) { if (e.target === book) closeBook(); });
  book.addEventListener('close', function () { if (S.step === 5) resetBooking(); });
  addEventListener('popstate', function () {
    if (book.open && !(history.state && history.state.sheet)) book.close();
    if (lb.open) lb.close();
    var v = viewFromHash(); if (v !== current) go(v, false);
  });

  // Deslizar hacia abajo para cerrar (móvil)
  (function () {
    var top = $('.sh-top', book), y0 = null, dy = 0;
    top.addEventListener('pointerdown', function (e) { if (innerWidth >= 900 || e.target.closest('button')) return; y0 = e.clientY; dy = 0; book.style.transition = 'none'; top.setPointerCapture(e.pointerId); });
    top.addEventListener('pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); book.style.transform = 'translateY(' + dy + 'px)'; });
    function end() { if (y0 === null) return; y0 = null; book.style.transition = 'transform .3s'; book.style.transform = ''; if (dy > 110) closeBook(); }
    top.addEventListener('pointerup', end); top.addEventListener('pointercancel', end);
  })();

  function syncOptionInputs() {
    form.querySelector('input[name="mode"][value="' + S.mode + '"]').checked = true;
    form.querySelector('input[name="plan"][value="' + S.plan + '"]').checked = true;
  }
  form.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'mode') { S.mode = t.value; S.start = S.end = null; S.cursor = null; buzz(); render(false); }
    if (t.name === 'plan') { S.plan = t.value; buzz(); render(false); bump(); }
  });
  function bump() { var p = $('#bkPrice'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }

  /* --- Calendario --- */
  function selectable(d) {
    if (d < today || d > MAXD) return false;
    if (S.mode === 'finde') return d.getDay() === 5;
    if (S.start && !S.end && d > S.start && d <= friOf(S.start)) return true;
    return weekdayIn(d);
  }
  function firstAvailable() { var d = new Date(today); while (!selectable(d) && d < MAXD) d = addDays(d, 1); return d; }
  function drawCal() {
    if (!S.cursor) { var f = S.start || firstAvailable(); S.cursor = new Date(f.getFullYear(), f.getMonth(), 1); }
    var c = S.cursor, cal = $('#cal'), html = '';
    var ml = c.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); $('#calMonth').textContent = ml.charAt(0).toUpperCase() + ml.slice(1);
    $('#calPrev').disabled = c.getFullYear() === today.getFullYear() && c.getMonth() === today.getMonth();
    $('#calNext').disabled = new Date(c.getFullYear(), c.getMonth() + 1, 1) > MAXD;
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (d) { html += '<span class="dow">' + d + '</span>'; });
    var lead = (c.getDay() + 6) % 7, days = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
    for (var k = 0; k < lead; k++) html += '<span></span>';
    for (var n = 1; n <= days; n++) {
      var d = new Date(c.getFullYear(), c.getMonth(), n), cls = [], ok = selectable(d);
      if (ok) cls.push('ok');
      if (same(d, today)) cls.push('today');
      if (S.start && same(d, S.start)) cls.push('start', 'in');
      if (S.end && same(d, S.end)) cls.push('end', 'in');
      if (S.start && S.end && d > S.start && d < S.end) cls.push('in');
      if (S.start && !S.end && same(d, S.start)) cls.push('end');
      html += '<button type="button" class="' + cls.join(' ') + '" data-d="' + d.getTime() + '"' + (ok ? '' : ' disabled') + ' aria-label="' + long(d) + '"><span>' + n + '</span></button>';
    }
    cal.innerHTML = html;
    var hint = $('#calHint'); hint.classList.remove('err');
    if (S.mode === 'finde') {
      $('#calTitle').textContent = 'Elige tu viernes';
      $('#calSub').textContent = 'Se reserva de viernes 13:00 a domingo 18:00. Toca un viernes marcado.';
      hint.textContent = S.start ? short(S.start) + ', 13:00 a ' + short(S.end) + ', 18:00 · 2 noches' : '';
    } else {
      $('#calTitle').textContent = S.start && !S.end ? 'Ahora, el día de salida' : 'Elige tus días';
      $('#calSub').textContent = 'Entrada de lunes a jueves. Salida como tarde el viernes.';
      hint.textContent = !S.start ? 'Toca el día de entrada.' : !S.end ? 'Entrada ' + short(S.start) + '. Toca el día de salida (hasta el viernes).' : short(S.start) + ' a ' + short(S.end) + ', hasta las 18:00 · ' + nights() + (nights() === 1 ? ' noche' : ' noches');
    }
  }
  $('#cal').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-d]'); if (!b || b.disabled) return;
    var d = new Date(+b.dataset.d); buzz();
    if (S.mode === 'finde') { S.start = d; S.end = addDays(d, 2); }
    else if (!S.start || S.end) { S.start = d; S.end = null; }
    else if (d > S.start && d <= friOf(S.start)) S.end = d;
    else { S.start = d; S.end = null; }
    render(false);
  });
  $('#calPrev').onclick = function () { S.cursor = new Date(S.cursor.getFullYear(), S.cursor.getMonth() - 1, 1); drawCal(); };
  $('#calNext').onclick = function () { S.cursor = new Date(S.cursor.getFullYear(), S.cursor.getMonth() + 1, 1); drawCal(); };

  /* --- Grupo --- */
  var ppl = $('#people'); for (var q = 0; q < 12; q++) ppl.appendChild(document.createElement('i'));
  function drawPeople() {
    $('#pOut').textContent = S.people;
    $$('i', ppl).forEach(function (el, j) { el.classList.toggle('on', j < S.people); });
    $('#pCap').textContent = S.people === 0 ? 'Toca + para añadir personas' : S.people === 12 ? 'Máximo alcanzado: 12 personas' : (12 - S.people) + ' plazas libres más';
    $('#pMinus').disabled = S.people <= 0; $('#pPlus').disabled = S.people >= 12;
  }
  $('#pMinus').onclick = function () { if (S.people > 0) { S.people--; buzz(); render(false); } };
  $('#pPlus').onclick = function () { if (S.people < 12) { S.people++; buzz(); render(false); } };

  /* --- Datos --- */
  var F = { nombre: $('#nombre'), telefono: $('#telefono'), email: $('#email'), mensaje: $('#mensaje'), priv: $('#privacidad') };
  function checkData(mark) {
    var ok = true;
    function set(el, bad) { if (mark) el.closest('.field').classList.toggle('bad', bad); if (bad) ok = false; }
    set(F.nombre, F.nombre.value.trim().length < 2);
    set(F.telefono, F.telefono.value.replace(/\D/g, '').length < 9);
    set(F.email, !/^\S+@\S+\.\S+$/.test(F.email.value.trim()));
    if (mark) $('#legalLbl').classList.toggle('bad', !F.priv.checked);
    if (!F.priv.checked) ok = false;
    return ok;
  }
  ['nombre', 'telefono', 'email'].forEach(function (k) { F[k].addEventListener('input', function () { F[k].closest('.field').classList.remove('bad'); }); });
  F.priv.addEventListener('change', function () { $('#legalLbl').classList.remove('bad'); });
  [F.nombre, F.telefono, F.email].forEach(function (el, i, arr) { el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); (arr[i + 1] || F.mensaje).focus(); } }); });

  function extras() { return $$('#extras input:checked').map(function (x) { return x.value; }); }
  function summary() {
    var w = S.mode === 'semana', jac = S.plan === 'con';
    var opt = w ? 'Días entre semana ' + (jac ? 'con' : 'sin') + ' jacuzzi · ' + nights() + (nights() === 1 ? ' noche' : ' noches')
                : 'Fin de semana ' + (jac ? 'con jacuzzi · 1.050 €' : 'sin jacuzzi · 850 €');
    return { w: w, opt: opt, price: w ? 'Precio por privado' : (jac ? '1.050 €' : '850 €'),
      entrada: long(S.start) + (w ? '' : ', 13:00'), salida: long(S.end) + ', hasta las 18:00' };
  }
  function drawRecap() {
    var i = summary(), ex = extras(), rows = [
      ['Opción', i.opt.split(' · ')[0], 0], ['Entrada', i.entrada, 1], ['Salida', i.salida, 1],
      ['Personas', S.people + (S.people === 1 ? ' persona' : ' personas'), 2]
    ];
    if (ex.length) rows.push(['Extras', ex.join(', '), 2]);
    rows.push(['Nombre', F.nombre.value.trim(), 3], ['Teléfono', F.telefono.value.trim(), 3]);
    $('#rcList').innerHTML = rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + ' <button type="button" class="edit" data-go="' + r[2] + '">Editar</button></dd>'; }).join('');
    $('#rcTot').textContent = i.w ? 'Por privado' : i.price;
    $('#rcTotLbl').textContent = i.w ? 'Precio' : 'Total fin de semana';
    $('#rcImg').src = S.plan === 'con' ? 'img/jacuzzi-s.webp' : 'img/piscina-s.webp';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  $('#rcList').addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { S.step = +b.dataset.go; render(true); } });

  function canNext() {
    if (S.step === 1) return !!(S.start && S.end);
    if (S.step === 2) return S.people >= 1;
    return true;
  }
  function render(back) {
    var w = S.mode === 'semana';
    $$('.price', book).forEach(function (p) { p.innerHTML = (w ? 'Consultar' : p.dataset.p) + '<small>' + (w ? 'por privado' : 'total') + '</small>'; });
    $('#modeNote').innerHTML = w ? 'Entre semana: <b>días sueltos de lunes a jueves</b>. El precio te lo damos por privado.'
                                 : 'Fin de semana completo: <b>viernes 13:00 a domingo 18:00</b>. Precio total para todo el grupo.';
    $('#bkPrice').textContent = priceTxt();
    steps.forEach(function (s, k) { var on = k === S.step; if (on && !s.classList.contains('on')) { s.classList.toggle('back', !!back); } s.classList.toggle('on', on); });
    var title = steps[S.step].dataset.title;
    $('#bkTitle').textContent = title;
    $('#bkStep').textContent = S.step < 5 ? 'Paso ' + (S.step + 1) + ' de 5' : 'Enviado';
    $('#bkBar').style.width = ((Math.min(S.step, 4) + 1) / 5 * 100) + '%';
    $('#bkBack').hidden = S.step === 0 || S.step === 5;
    var nx = $('#bkNext');
    nx.innerHTML = (S.step === 4 ? '<svg class="f" style="width:19px;height:19px"><use href="#i-wa"/></svg>' : '') + NEXT[S.step];
    nx.className = 'btn ' + (S.step === 4 ? 'btn-wa' : 'btn-gold');
    nx.disabled = !canNext();
    if (S.step === 1) drawCal();
    if (S.step === 2) drawPeople();
    if (S.step === 4) drawRecap();
  }
  function move(to) { var back = to < S.step; S.step = to; body.scrollTop = 0; render(back); buzz(); }
  $('#bkBack').onclick = function () { if (S.step > 0) move(S.step - 1); };
  $('#bkNext').onclick = function () {
    if (S.step === 5) { closeBook(); return; }
    if (!canNext()) return;
    if (S.step === 3 && !checkData(true)) { var bad = $('.field.bad', book); (bad ? bad.querySelector('input') : F.priv).focus(); return; }
    if (S.step === 4) { send(); return; }
    move(S.step + 1);
    if (S.step === 3 && innerWidth >= 900) F.nombre.focus();
  };

  function send() {
    if (form._honey.value) return;
    var i = summary(), ex = extras(), v = function (el) { return el.value.trim(); };
    var data = { 'Tipo': i.w ? 'Días entre semana' : 'Fin de semana', 'Opción': i.opt, 'Precio': i.price,
      'Entrada': i.entrada, 'Salida': i.salida, 'Personas': String(S.people),
      'Nombre': v(F.nombre), 'Teléfono': v(F.telefono), 'Email': v(F.email) };
    if (ex.length) data['Extras'] = ex.join(', ');
    if (v(F.mensaje)) data['Mensaje'] = v(F.mensaje);
    var wa = [i.w ? 'Hola, quiero reservar la Escapada Rural en Ciudad Real (by Aureon Project) unos días entre semana 🏡'
                  : 'Hola, quiero reservar un fin de semana en la Escapada Rural en Ciudad Real (by Aureon Project) 🏡', '',
      '📅 Entrada: ' + data['Entrada'], '📅 Salida: ' + data['Salida'], '👥 Personas: ' + data['Personas'],
      '✨ Opción: ' + data['Opción']];
    if (data['Extras']) wa.push('➕ Extras: ' + data['Extras']);
    wa.push('', 'Nombre: ' + data['Nombre'], 'Teléfono: ' + data['Teléfono'], 'Email: ' + data['Email']);
    if (data['Mensaje']) wa.push('Comentarios: ' + data['Mensaje']);
    wa.push('', i.w ? '¿Está disponible y qué precio tendría?' : '¿Está disponible ese fin de semana?');
    var url = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(wa.join('\n'));
    window.open(url, '_blank', 'noopener');
    var payload = Object.assign({}, data, { _subject: 'Nueva reserva Escapada Rural Ciudad Real (' + data['Tipo'] + '): ' + data['Entrada'] + ' · ' + data['Personas'] + ' pers.', _template: 'table', _replyto: data['Email'] });
    try { fetch(ENDPOINT, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {}); } catch (e) {}
    $('#doneWa').href = url;
    move(5);
  }
  function resetBooking() {
    S.step = 0; S.start = S.end = null; S.people = 0; S.cursor = null;
    $$('#extras input').forEach(function (x) { x.checked = false; });
    [F.nombre, F.telefono, F.email, F.mensaje].forEach(function (el) { el.value = ''; }); F.priv.checked = false;
  }
  render(false);
})();
