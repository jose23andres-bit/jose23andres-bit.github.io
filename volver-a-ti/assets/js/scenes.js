/*
 * VOLVER A TI · Escenas generativas (Canvas 2D)
 * Cada escena es un "clip vivo": se dibuja en tiempo real, en bucle infinito
 * y a cualquier resolución. Interfaz: create(w, h, opts) -> { resize(w,h), draw(ctx, t) }
 */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const GOLD = "245,198,106";
  const CHAKRA_RGB = ["255,69,69", "255,138,42", "255,210,58", "47,212,106", "37,180,255", "111,107,255", "177,92,255"]; // raíz → corona
  const CHAKRA_NAMES = ["Muladhara", "Svadhisthana", "Manipura", "Anahata", "Vishuddha", "Ajna", "Sahasrara"];

  const rand = (a, b) => a + Math.random() * (b - a);
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));
  const lerp = (a, b, k) => a + (b - a) * k;

  /* ---------- Utilidades de dibujo ---------- */
  function makeStars(n, w, h) {
    return Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() ** 2 * 1.6 + 0.25, p: Math.random() * TAU, s: rand(0.3, 1.6),
    }));
  }
  function drawStars(ctx, stars, t, alpha = 1) {
    ctx.fillStyle = "#fff6e0";
    for (const s of stars) {
      ctx.globalAlpha = alpha * (0.3 + 0.7 * Math.abs(Math.sin(t * s.s * 0.6 + s.p)));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function bg(ctx, w, h, inner, outer, cy = 0.45) {
    const g = ctx.createRadialGradient(w / 2, h * cy, 0, w / 2, h * cy, Math.hypot(w, h) * 0.6);
    g.addColorStop(0, inner); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function glow(ctx, x, y, r, rgb, a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  function sparkle(ctx, x, y, l, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#fffaf0";
    ctx.beginPath(); ctx.moveTo(x, y - l);
    ctx.quadraticCurveTo(x, y, x + l, y); ctx.quadraticCurveTo(x, y, x, y + l);
    ctx.quadraticCurveTo(x, y, x - l, y); ctx.quadraticCurveTo(x, y, x, y - l);
    ctx.fill(); ctx.restore();
  }
  function label(ctx, w, h, text, sub, a = 1, y = 0.86) {
    if (a <= 0) return;
    const s = Math.min(w, h);
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fbe9c2";
    ctx.font = `400 ${Math.round(s * 0.06)}px "Great Vibes", cursive`;
    ctx.shadowColor = "rgba(245,198,106,.6)"; ctx.shadowBlur = s * 0.03;
    ctx.fillText(text, w / 2, h * y);
    if (sub) {
      ctx.shadowBlur = 0; ctx.globalAlpha = a * 0.7;
      ctx.font = `300 ${Math.round(s * 0.018)}px "Jost", sans-serif`;
      ctx.fillText(sub.toUpperCase().split("").join(" "), w / 2, h * y + s * 0.055);
    }
    ctx.restore();
  }
  // Partículas doradas que ascienden
  function makeDust(n, w, h) {
    return Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: rand(0.5, 2.2), v: rand(6, 26), p: Math.random() * TAU }));
  }
  function drawDust(ctx, dust, w, h, dt, t, rgb = GOLD) {
    for (const d of dust) {
      d.y -= d.v * dt; d.x += Math.sin(t * 0.5 + d.p) * 0.15;
      if (d.y < -10) { d.y = h + 10; d.x = Math.random() * w; }
      ctx.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t + d.p));
      ctx.fillStyle = `rgb(${rgb})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* Dibuja la libélula de la marca (vectorial, escalable) */
  function dragonfly(ctx, x, y, size, flap, rot = 0, alpha = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(size / 400, size / 400); ctx.globalAlpha = alpha;
    const wing = (upper) => {
      ctx.beginPath();
      if (upper) {
        ctx.moveTo(-12, -8); ctx.bezierCurveTo(-80, -50, -200, -70, -312, -58);
        ctx.bezierCurveTo(-374, -52, -402, -22, -382, 4); ctx.bezierCurveTo(-358, 34, -268, 52, -168, 50);
        ctx.bezierCurveTo(-88, 48, -38, 32, -10, 16);
      } else {
        ctx.moveTo(-10, 28); ctx.bezierCurveTo(-60, 50, -158, 82, -248, 110);
        ctx.bezierCurveTo(-314, 130, -360, 160, -348, 184); ctx.bezierCurveTo(-334, 210, -268, 204, -198, 184);
        ctx.bezierCurveTo(-108, 158, -48, 102, -8, 48);
      }
      ctx.closePath();
    };
    const wg = ctx.createLinearGradient(0, 0, -380, 0);
    wg.addColorStop(0, "rgba(255,224,160,.9)"); wg.addColorStop(0.4, "rgba(199,125,255,.6)"); wg.addColorStop(1, "rgba(122,47,224,.75)");
    for (const side of [1, -1]) {
      ctx.save(); ctx.scale(side, 1);
      for (const up of [true, false]) {
        ctx.save(); ctx.scale(up ? 1 - flap * 0.22 : 1 - flap * 0.16, 1);
        wing(up); ctx.fillStyle = wg; ctx.fill();
        ctx.strokeStyle = "rgba(245,198,106,.95)"; ctx.lineWidth = 3; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
    // cuerpo: siete chakras de corona (arriba) a raíz (abajo)
    const ys = [-34, 6, 46, 86, 126, 165, 202];
    for (let i = 0; i < 7; i++) {
      const c = CHAKRA_RGB[6 - i];
      const r = 22 - i * 0.8;
      const g = ctx.createRadialGradient(-6, ys[i] - 8, 1, 0, ys[i], r);
      g.addColorStop(0, "#fff"); g.addColorStop(0.4, `rgb(${c})`); g.addColorStop(1, `rgba(${c},.7)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, ys[i], r, r + 1, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(245,198,106,.9)"; ctx.lineWidth = 1.6; ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,200,110,.95)";
    ctx.beginPath(); ctx.moveTo(-13, 216); ctx.lineTo(0, 330); ctx.lineTo(13, 216); ctx.fill();
    ctx.fillStyle = "#9b4de0"; ctx.strokeStyle = "rgba(245,198,106,1)"; ctx.lineWidth = 2;
    for (const [cx, cy, r] of [[-19, -74, 13], [19, -74, 13], [0, -66, 15]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  /* =================================================================
   * 1 · Respiración Cósmica — flor de la vida que respira (4 · 2 · 6)
   * ================================================================= */
  function respiracion(w, h, opts) {
    let stars, dust;
    const init = () => { stars = makeStars(opts.preview ? 70 : 220, w, h); dust = makeDust(opts.preview ? 20 : 70, w, h); };
    init();
    let last = 0;
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        const dt = Math.min(0.05, t - last); last = t;
        bg(ctx, w, h, "#3a1470", "#0e0326");
        drawStars(ctx, stars, t, 0.8);
        const s = Math.min(w, h);
        const cycle = 12, ph = t % cycle;
        let k, txt;
        if (ph < 4) { k = ease(ph / 4); txt = "Inhala"; }
        else if (ph < 6) { k = 1; txt = "Sostén"; }
        else { k = 1 - ease((ph - 6) / 6); txt = "Exhala"; }
        const cx = w / 2, cy = h * 0.46;
        glow(ctx, cx, cy, s * (0.35 + 0.15 * k), "180,110,255", 0.35);
        glow(ctx, cx, cy, s * (0.12 + 0.1 * k), GOLD, 0.55);

        const R = s * (0.07 + 0.05 * k);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.04);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = Math.max(1, s * 0.0022);
        const centers = [[0, 0]];
        for (let i = 0; i < 6; i++) centers.push([Math.cos(i * TAU / 6) * R, Math.sin(i * TAU / 6) * R]);
        for (let i = 0; i < 6; i++) centers.push([Math.cos(i * TAU / 6) * R * 2, Math.sin(i * TAU / 6) * R * 2]);
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + TAU / 12; centers.push([Math.cos(a) * R * Math.sqrt(3), Math.sin(a) * R * Math.sqrt(3)]); }
        centers.forEach(([x, y], i) => {
          ctx.strokeStyle = `rgba(${GOLD},${i < 7 ? 0.85 : 0.35 + 0.35 * k})`;
          ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
        });
        ctx.strokeStyle = `rgba(${GOLD},.6)`;
        ctx.beginPath(); ctx.arc(0, 0, R * 3, 0, TAU); ctx.stroke();
        ctx.strokeStyle = `rgba(200,150,255,.35)`;
        ctx.beginPath(); ctx.arc(0, 0, R * 3.25 + Math.sin(t) * 2, 0, TAU); ctx.stroke();
        ctx.restore();

        ctx.globalCompositeOperation = "lighter";
        drawDust(ctx, dust, w, h, dt, t);
        ctx.globalCompositeOperation = "source-over";
        if (!opts.preview) label(ctx, w, h, txt, "Respiración 4 · 2 · 6", 0.95);
      },
    };
  }

  /* =================================================================
   * 2 · Ascenso de la Luz — los siete chakras despiertan en secuencia
   * ================================================================= */
  function chakras(w, h, opts) {
    let stars, dust;
    const init = () => { stars = makeStars(opts.preview ? 60 : 200, w, h); dust = makeDust(opts.preview ? 14 : 50, w, h); };
    init();
    let last = 0;
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        const dt = Math.min(0.05, t - last); last = t;
        const per = opts.preview ? 1.4 : 6;        // segundos por chakra
        const total = per * 7 + per;                 // + pausa en la corona
        const ph = t % total;
        const active = Math.min(6, Math.floor(ph / per));
        const local = (ph % per) / per;
        const c = CHAKRA_RGB[active];

        bg(ctx, w, h, "#2a0b52", "#0b0220");
        drawStars(ctx, stars, t, 0.7);
        const s = Math.min(w, h);
        const cx = w / 2, top = h * 0.14, bot = h * 0.82;
        const yOf = (i) => lerp(bot, top, i / 6);

        glow(ctx, cx, yOf(active), s * 0.5, c, 0.22);
        ctx.globalCompositeOperation = "lighter";
        // columna de energía
        const lg = ctx.createLinearGradient(0, bot, 0, top);
        CHAKRA_RGB.forEach((rgb, i) => lg.addColorStop(i / 6, `rgba(${rgb},.55)`));
        ctx.fillStyle = lg;
        const colW = Math.max(1.5, s * 0.004);
        ctx.fillRect(cx - colW / 2, top, colW, bot - top);
        // luz que asciende
        const rise = ph >= per * 7 ? top : lerp(yOf(Math.max(0, active - 1)), yOf(active), ease(local * 2));
        glow(ctx, cx, rise, s * 0.05, "255,250,235", 0.9);

        for (let i = 0; i < 7; i++) {
          const y = yOf(i);
          const on = i < active || (i === active && local > 0.25) || ph >= per * 7;
          const isA = i === active && ph < per * 7;
          const pulse = isA ? 1 + 0.25 * Math.sin(t * 3) : 1;
          const r = s * 0.028 * pulse * (on ? 1 : 0.7);
          glow(ctx, cx, y, r * (on ? 5 : 2.2), CHAKRA_RGB[i], on ? 0.75 : 0.25);
          ctx.fillStyle = on ? "#fff" : `rgba(${CHAKRA_RGB[i]},.8)`;
          ctx.beginPath(); ctx.arc(cx, y, r * 0.45, 0, TAU); ctx.fill();
          if (isA) {
            for (let k = 0; k < 3; k++) {
              const q = (local * 1.5 + k / 3) % 1;
              ctx.strokeStyle = `rgba(${CHAKRA_RGB[i]},${(1 - q) * 0.7})`;
              ctx.lineWidth = Math.max(1, s * 0.003);
              ctx.beginPath(); ctx.arc(cx, y, r + q * s * 0.14, 0, TAU); ctx.stroke();
            }
          }
        }
        if (ph >= per * 7) glow(ctx, cx, top, s * 0.25 * ease((ph - per * 7) / per), GOLD, 0.6);
        drawDust(ctx, dust, w, h, dt, t, c);
        ctx.globalCompositeOperation = "source-over";
        if (!opts.preview) {
          const a = Math.sin(Math.PI * Math.min(1, local * 1.2));
          if (ph < per * 7) {
            ctx.save(); ctx.globalAlpha = a; ctx.textAlign = "left"; ctx.textBaseline = "middle";
            ctx.fillStyle = "#fbe9c2"; ctx.font = `400 ${Math.round(s * 0.05)}px "Great Vibes", cursive`;
            ctx.fillText(CHAKRA_NAMES[active], cx + s * 0.09, yOf(active));
            ctx.restore();
          } else label(ctx, w, h, "Alineado", "Los siete centros en armonía", Math.sin(Math.PI * ((ph - per * 7) / per)), 0.9);
        }
      },
    };
  }

  /* =================================================================
   * 3 · Luna sobre el Agua — para dormir
   * ================================================================= */
  function dormir(w, h, opts) {
    let stars, shoot = null, nextShoot = 3;
    const init = () => { stars = makeStars(opts.preview ? 90 : 320, w, h * 0.62); };
    init();
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        const s = Math.min(w, h), hz = h * 0.62;
        const sky = ctx.createLinearGradient(0, 0, 0, hz);
        sky.addColorStop(0, "#07051a"); sky.addColorStop(0.6, "#1c1150"); sky.addColorStop(1, "#3b1f6e");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
        drawStars(ctx, stars, t * 0.6, 0.9);
        const mx = w * 0.5, my = h * 0.3, mr = s * 0.075;
        glow(ctx, mx, my, mr * 6, "190,170,255", 0.25);
        glow(ctx, mx, my, mr * 2.4, "255,240,210", 0.45);
        const mg = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
        mg.addColorStop(0, "#fffaf0"); mg.addColorStop(1, "#f1dcae");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
        // montañas lejanas
        ctx.fillStyle = "#1a0d3d";
        ctx.beginPath(); ctx.moveTo(0, hz);
        for (let x = 0; x <= w; x += w / 40) ctx.lineTo(x, hz - s * (0.03 + 0.03 * Math.abs(Math.sin(x / w * 7.3)) + 0.02 * Math.sin(x / w * 19)));
        ctx.lineTo(w, hz); ctx.fill();
        // agua
        const wg = ctx.createLinearGradient(0, hz, 0, h);
        wg.addColorStop(0, "#1d1048"); wg.addColorStop(1, "#05030f");
        ctx.fillStyle = wg; ctx.fillRect(0, hz, w, h - hz);
        ctx.globalCompositeOperation = "lighter";
        // reflejo: destellos fragmentados que se ensanchan hacia el espectador
        const row = Math.max(2, s * 0.006), th = Math.max(1, s * 0.0024);
        let ri = 0;
        for (let y = hz + 3; y < h; y += row, ri++) {
          const d = (y - hz) / (h - hz);
          const width = mr * (0.5 + d * 2.4);
          const off = Math.sin(t * 0.6 + ri * 0.21) * mr * 0.25 * d;
          for (let k = -2; k <= 2; k++) {
            const seed = ri * 12.9898 + k * 78.233;
            const len = width * 0.22 * (0.35 + 0.65 * Math.abs(Math.sin(seed + t * (0.8 + (k & 1) * 0.5))));
            const cxk = mx + off + k * width * 0.2 + Math.sin(seed * 0.7 + t * 1.1) * width * 0.08;
            const a = 0.5 * (1 - d * 0.7) * (1 - Math.abs(k) * 0.25);
            ctx.fillStyle = `rgba(255,236,200,${a})`;
            ctx.fillRect(cxk - len / 2, y, len, th);
          }
        }
        // estrella fugaz ocasional
        if (!shoot && t > nextShoot) { shoot = { x: rand(w * 0.1, w * 0.7), y: rand(h * 0.05, h * 0.25), t0: t }; }
        if (shoot) {
          const q = (t - shoot.t0) / 1.4;
          if (q > 1) { shoot = null; nextShoot = t + rand(5, 11); }
          else {
            const x = shoot.x + q * s * 0.35, y = shoot.y + q * s * 0.12;
            const gr = ctx.createLinearGradient(x, y, x - s * 0.12, y - s * 0.04);
            gr.addColorStop(0, `rgba(255,250,235,${1 - q})`); gr.addColorStop(1, "rgba(255,250,235,0)");
            ctx.strokeStyle = gr; ctx.lineWidth = Math.max(1, s * 0.002);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s * 0.12, y - s * 0.04); ctx.stroke();
          }
        }
        ctx.globalCompositeOperation = "source-over";
        if (!opts.preview) {
          const ph = t % 20;
          const a = ph < 10 ? Math.sin(Math.PI * ph / 10) : 0;
          label(ctx, w, h, "Suelta el día", "Deja que el cuerpo descanse", a * 0.85, 0.82);
        }
      },
    };
  }

  /* =================================================================
   * 4 · Despertar del Loto
   * ================================================================= */
  function loto(w, h, opts) {
    let stars, dust;
    const init = () => { stars = makeStars(opts.preview ? 50 : 160, w, h); dust = makeDust(opts.preview ? 24 : 90, w, h); };
    init();
    let last = 0;
    const petal = (ctx, len, wid) => {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-wid, -len * 0.35, -wid * 0.7, -len * 0.85, 0, -len);
      ctx.bezierCurveTo(wid * 0.7, -len * 0.85, wid, -len * 0.35, 0, 0);
      ctx.closePath();
    };
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        const dt = Math.min(0.05, t - last); last = t;
        bg(ctx, w, h, "#3d1666", "#0c0322", 0.6);
        drawStars(ctx, stars, t, 0.6);
        const s = Math.min(w, h), cx = w / 2, cy = h * 0.68;
        const open = 0.55 + 0.45 * ease((Math.sin(t * TAU / 16) + 1) / 2);
        glow(ctx, cx, cy - s * 0.12, s * 0.45, "200,120,255", 0.28);
        glow(ctx, cx, cy - s * 0.08, s * 0.2 * open, GOLD, 0.6);
        // reflejo en el agua
        const water = ctx.createLinearGradient(0, cy - s * 0.04, 0, h);
        water.addColorStop(0, "rgba(10,3,30,0)"); water.addColorStop(0.18, "rgba(10,3,30,.5)"); water.addColorStop(1, "rgba(6,1,20,.85)");
        ctx.fillStyle = water; ctx.fillRect(0, cy - s * 0.04, w, h);
        const layers = [
          { n: 9, len: 0.3, wid: 0.09, spread: 1.25, col: ["120,50,190", "230,170,255"] },
          { n: 7, len: 0.27, wid: 0.085, spread: 0.95, col: ["160,80,220", "255,215,170"] },
          { n: 5, len: 0.23, wid: 0.08, spread: 0.6, col: ["200,120,240", "255,236,200"] },
        ];
        for (const L of layers) {
          for (let i = 0; i < L.n; i++) {
            const k = L.n === 1 ? 0 : i / (L.n - 1) - 0.5;
            const ang = k * L.spread * 2 * open;
            ctx.save(); ctx.translate(cx, cy + s * 0.02); ctx.rotate(ang);
            const g = ctx.createLinearGradient(0, 0, 0, -L.len * s);
            g.addColorStop(0, `rgba(${L.col[0]},.85)`); g.addColorStop(1, `rgba(${L.col[1]},.75)`);
            petal(ctx, L.len * s, L.wid * s); ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = `rgba(${GOLD},.9)`; ctx.lineWidth = Math.max(1, s * 0.0028); ctx.stroke();
            ctx.restore();
          }
        }
        ctx.save(); ctx.translate(cx, cy + s * 0.02);
        const g = ctx.createLinearGradient(0, 0, 0, -0.3 * s);
        g.addColorStop(0, "rgba(255,210,150,.9)"); g.addColorStop(1, "rgba(255,248,230,.95)");
        petal(ctx, s * 0.3 * (0.9 + 0.1 * open), s * 0.075); ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = `rgba(${GOLD},1)`; ctx.lineWidth = Math.max(1, s * 0.003); ctx.stroke();
        ctx.restore();
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, cx, cy - s * 0.04, s * 0.06, "255,250,235", 0.8 * open);
        drawDust(ctx, dust, w, h, dt, t);
        ctx.globalCompositeOperation = "source-over";
        if (!opts.preview) {
          const ph = t % 16;
          label(ctx, w, h, ph < 8 ? "Florece" : "Desde dentro", "Despertar del loto", Math.sin(Math.PI * (ph % 8) / 8) * 0.9, 0.2);
        }
      },
    };
  }

  /* =================================================================
   * 5 · Vuelo de la Libélula — aurora violeta y estela de oro
   * ================================================================= */
  function libelula(w, h, opts) {
    let stars, trail = [];
    const init = () => { stars = makeStars(opts.preview ? 60 : 220, w, h); trail = []; };
    init();
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        bg(ctx, w, h, "#24104f", "#07021a", 0.3);
        drawStars(ctx, stars, t, 0.75);
        const s = Math.min(w, h);
        // aurora: bandas ondulantes
        ctx.globalCompositeOperation = "lighter";
        // Cortinas de aurora: columnas finas con degradado vertical suave por ambos extremos
        const bands = [["120,60,220", 0.34, 0.0, 0.32], ["60,200,170", 0.38, 1.7, 0.22], ["200,90,255", 0.44, 3.1, 0.28]];
        const step = Math.max(2, Math.round(w / 320));
        for (const [rgb, yy, ph, amp] of bands) {
          const L = s * 0.3;
          const g = ctx.createLinearGradient(0, -L, 0, L * 0.18);
          g.addColorStop(0, `rgba(${rgb},0)`);
          g.addColorStop(0.75, `rgba(${rgb},${amp * 0.6})`);
          g.addColorStop(0.88, `rgba(${rgb},${amp})`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.fillStyle = g;
          for (let x = 0; x <= w; x += step) {
            const y = h * yy + Math.sin(x / w * 5 + t * 0.25 + ph) * s * 0.06 + Math.sin(x / w * 11 - t * 0.4) * s * 0.02;
            const k = 0.55 + 0.45 * Math.sin(x / w * 23 + t * 0.6 + ph); // variación de intensidad (pliegues)
            ctx.globalAlpha = k;
            ctx.setTransform(1, 0, 0, 1, x, y);
            ctx.fillRect(0, -L, step, L * 1.18);
          }
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 1;
        }
        // trayectoria en lemniscata suave
        const k = t * 0.18;
        const x = w / 2 + Math.sin(k) * w * 0.28;
        const y = h * 0.55 + Math.sin(k * 2) * h * 0.12;
        const dx = Math.cos(k) * w * 0.28, dy = 2 * Math.cos(k * 2) * h * 0.12;
        const rot = Math.atan2(dy, dx) * 0.12;
        // polvo de oro desde la cola, que se dispersa y cae lentamente
        const tailX = x - Math.sin(rot) * s * 0.2, tailY = y + Math.cos(rot) * s * 0.2;
        for (let n = 0; n < 2; n++) {
          trail.push({ x: tailX + rand(-3, 3), y: tailY, vx: rand(-0.35, 0.35) * s * 0.002, vy: rand(0.1, 0.6) * s * 0.002, a: 1, r: rand(0.6, 2.2) * Math.max(1, s / 900) });
        }
        if (trail.length > 260) trail.splice(0, trail.length - 260);
        ctx.fillStyle = `rgb(${GOLD})`;
        for (const p of trail) {
          p.a *= 0.982; p.x += p.vx; p.y += p.vy;
          ctx.globalAlpha = p.a * 0.85;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
        glow(ctx, x, y, s * 0.18, "210,150,255", 0.35);
        glow(ctx, x, y, s * 0.07, GOLD, 0.5);
        ctx.globalCompositeOperation = "source-over";
        dragonfly(ctx, x, y, s * 0.26, (Math.sin(t * 18) + 1) / 2, rot);
        if (!opts.preview) {
          const ph = t % 18;
          label(ctx, w, h, ph < 9 ? "Todo cambio" : "es un vuelo", "Vuelo de la libélula", Math.sin(Math.PI * (ph % 9) / 9) * 0.85, 0.88);
        }
      },
    };
  }

  /* =================================================================
   * 6 · Geometría Sagrada — cubo de Metatrón vivo
   * ================================================================= */
  function geometria(w, h, opts) {
    let stars;
    const init = () => { stars = makeStars(opts.preview ? 60 : 200, w, h); };
    init();
    return {
      resize(nw, nh) { w = nw; h = nh; init(); },
      draw(ctx, t) {
        bg(ctx, w, h, "#2a0b52", "#08021c");
        drawStars(ctx, stars, t, 0.6);
        const s = Math.min(w, h), cx = w / 2, cy = h / 2;
        const ci = Math.floor(t / 6) % 7, cf = (t % 6) / 6;
        const mix = (a, b, k) => a.split(",").map((v, i) => Math.round(lerp(+v, +b.split(",")[i], k))).join(",");
        const col = mix(CHAKRA_RGB[ci], CHAKRA_RGB[(ci + 1) % 7], ease(cf));
        glow(ctx, cx, cy, s * 0.5, col, 0.25);
        const R = s * 0.085 * (1 + 0.04 * Math.sin(t * 0.8));
        const pts = [[0, 0]];
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; pts.push([Math.cos(a) * R * 2, Math.sin(a) * R * 2]); }
        for (let i = 0; i < 6; i++) { const a = i * TAU / 6 - Math.PI / 2; pts.push([Math.cos(a) * R * 4, Math.sin(a) * R * 4]); }
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.05);
        ctx.globalCompositeOperation = "lighter";
        ctx.lineWidth = Math.max(0.8, s * 0.0016);
        ctx.strokeStyle = `rgba(${GOLD},.28)`;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { ctx.moveTo(...pts[i]); ctx.lineTo(...pts[j]); }
        ctx.stroke();
        ctx.lineWidth = Math.max(1, s * 0.0024);
        pts.forEach(([x, y], i) => {
          ctx.strokeStyle = i === 0 ? `rgba(${GOLD},.95)` : `rgba(${col},.8)`;
          ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
        });
        // anillos exteriores con puntos
        for (let r = 0; r < 3; r++) {
          const rr = R * (5.2 + r * 0.55), dir = r % 2 ? -1 : 1, n = 24 + r * 12;
          ctx.strokeStyle = `rgba(${GOLD},${0.5 - r * 0.12})`;
          ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke();
          ctx.fillStyle = `rgba(${GOLD},.8)`;
          for (let i = 0; i < n; i++) {
            const a = i * TAU / n + t * 0.08 * dir;
            ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, Math.max(0.8, s * 0.0022), 0, TAU); ctx.fill();
          }
        }
        ctx.restore();
        glow(ctx, cx, cy, s * 0.05, "255,250,235", 0.9);
        sparkle(ctx, cx, cy, s * 0.035, 0.9);
        ctx.globalCompositeOperation = "source-over";
        if (!opts.preview) {
          const ph = t % 24;
          label(ctx, w, h, ph < 12 ? "Todo está conectado" : "Tú eres el centro", "", Math.sin(Math.PI * (ph % 12) / 12) * 0.8, 0.9);
        }
      },
    };
  }

  window.VAT_SCENES = { respiracion, chakras, dormir, loto, libelula, geometria };
  window.VAT_DRAW = { makeStars, drawStars, makeDust, drawDust, glow, sparkle };
})();
