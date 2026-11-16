/* =========================================================
   PowerVane & Wellness · Interacción
   ========================================================= */

/* ⚠️ CAMBIA AQUÍ el número de WhatsApp: prefijo de país + número, sin "+" ni espacios.
   Ejemplo España: 34612345678 */
const WHATSAPP_NUMBER = "34607745308";

/* Mensaje que se envía automáticamente según el botón pulsado */
const WA_MESSAGES = {
  general: "¡Hola! 💗 He visto la web de PowerVane & Wellness y me gustaría recibir más información.",
  especializado: "¡Hola! 💗 Me interesan los Programas especializados (69 €). ¿Me cuentas más?",
  glute: "¡Hola! 💗 Me interesa el Glute Focus Workout de 8 semanas. ¿Me das más información?",
  live: "¡Hola! 💗 Me interesa LIVE TRAINING. ¿Con qué plan puedo acceder a las clases en directo?",
  liveAviso: "¡Hola! 💗 Avísame cuando programes la próxima clase de LIVE TRAINING, por favor.",
  strong: "¡Hola! 💗 Me interesa el Strong & Feminine Workout de 8 semanas. ¿Me das más información?",
  powerstart: "¡Hola! 💗 Quiero empezar con PowerStart (220 €). ¿Cuáles son los siguientes pasos?",
  transformation: "¡Hola! 💗 Me interesa Power Transformation (300 € + nutrición). Me gustaría saber cómo empezar."
};

window.PVwaText = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
window.PVwa = (key) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WA_MESSAGES[key] || WA_MESSAGES.general)}`;
document.querySelectorAll("[data-wa]").forEach((link) => {
  const message = WA_MESSAGES[link.dataset.wa] || WA_MESSAGES.general;
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  link.target = "_blank";
  link.rel = "noopener";
});

/* Cabecera con fondo al hacer scroll */
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* Menú móvil */
const toggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

const setMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  nav.classList.toggle("is-open", open);
  header.classList.toggle("menu-open", open);
};

toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Titular de portada letra a letra */
document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text].map((c, i) => `<span class="char" aria-hidden="true" style="--i:${i}">${c}</span>`).join("");
});

/* Intro: se retira cuando la portada está lista (máx. 2,2 s) */
const intro = document.getElementById("intro");
const heroImg = document.querySelector(".hero__media img");
let introClosed = false;
const closeIntro = () => {
  if (introClosed) return;
  introClosed = true;
  intro && intro.classList.add("is-done");
  setTimeout(() => document.body.classList.add("is-ready"), 150);
};
const minIntro = new Promise((r) => setTimeout(r, reducedMotion ? 0 : 1500));
const heroLoaded = new Promise((resolve) => {
  if (!heroImg || heroImg.complete) return resolve();
  heroImg.addEventListener("load", resolve, { once: true });
  heroImg.addEventListener("error", resolve, { once: true });
});
Promise.all([minIntro, heroLoaded]).then(closeIntro);
setTimeout(closeIntro, 2200);

/* Manifiesto: las palabras se encienden al hacer scroll */
const manifesto = document.getElementById("manifesto");
let manifestoWords = [];
if (manifesto) {
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = part;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        wrap(n);
      }
    });
  };
  wrap(manifesto);
  manifestoWords = [...manifesto.querySelectorAll(".w")];
}

/* Barra de progreso, manifiesto y parallax suave de la portada (un solo bucle por frame) */
const progress = document.getElementById("progress");
const heroMedia = document.querySelector(".hero__media");
const isDesktop = window.matchMedia("(min-width: 881px)").matches;
let ticking = false;
const onFrame = () => {
  ticking = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  if (manifestoWords.length) {
    const r = manifesto.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
    const lit = Math.round(p * manifestoWords.length);
    manifestoWords.forEach((w, i) => w.classList.toggle("on", reducedMotion || i < lit));
  }

  if (heroMedia && isDesktop && !reducedMotion && y < window.innerHeight * 1.2) {
    heroMedia.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
  }
};
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
onFrame();

/* Tarjetas: brillo que sigue al cursor */
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

/* Titulares: las palabras suben una a una desde una máscara (estilo editorial) */
document.querySelectorAll(".split").forEach((title) => {
  let i = 0;
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "wd";
          w.innerHTML = `<span style="--i:${i++}">${part.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`;
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== "BR") wrap(n);
    });
  };
  wrap(title);
});

/* Grupos (tarjetas, listas, galería, vídeos): entran en cascada */
document.querySelectorAll("[data-stagger]").forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty("--d", `${i * 110}ms`));
});

/* Fotos: parallax suave al hacer scroll (solo escritorio) */
const parallaxEls = isDesktop && !reducedMotion ? [...document.querySelectorAll(".gallery__item, .cta__bg")] : [];
const parallax = () => {
  const vh = window.innerHeight;
  parallaxEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
    el.style.setProperty("--py", `${(-p * 4).toFixed(2)}%`);
  });
};
if (parallaxEls.length) {
  let pt = false;
  window.addEventListener("scroll", () => { if (!pt) { pt = true; requestAnimationFrame(() => { pt = false; parallax(); }); } }, { passive: true });
  parallax();
}

/* Animación de aparición al hacer scroll */
const revealEls = document.querySelectorAll(".reveal, .wipe");
/* Los .wipe parten recortados (clip-path) y el navegador los ve con 0 % visible:
   se vigila su contenedor, que no está recortado */
const watchTarget = (el) => {
  const w = el.closest(".wipe");
  return w ? w.parentElement : el;
};
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target._pvWipes || [entry.target]).forEach((el) => el.classList.add("is-visible"));
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => {
    const t = el.classList.contains("wipe") ? el.parentElement : el;
    if (t !== el) (t._pvWipes = t._pvWipes || []).push(el);
    io.observe(t);
  });
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* Música de fondo: Ibiza Global Radio en directo, sin controles visibles.
   Los navegadores bloquean el sonido automático hasta que la visitante
   interactúa con la página, así que si el intento inicial falla,
   la radio arranca sola con el primer toque, clic o tecla. */
const RADIO_URL = "https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3";
const radio = new Audio();
radio.preload = "none";
radio.volume = 0.35;
let radioOn = false;
let ytPlaying = false;

const startRadio = () => {
  if (radioOn) return;
  if (!radio.src) radio.src = RADIO_URL;
  radio.play().then(() => {
    radioOn = true;
    ["pointerdown", "touchend", "click", "keydown"].forEach((ev) => document.removeEventListener(ev, startRadio, true));
  }).catch(() => {});
};

startRadio();
["pointerdown", "touchend", "click", "keydown"].forEach((ev) => document.addEventListener(ev, startRadio, true));

/* Pausa al salir de la pestaña y retoma al volver (en directo, sin retraso acumulado) */
document.addEventListener("visibilitychange", () => {
  if (!radioOn || ytPlaying) return;
  if (document.hidden) {
    radio.pause();
  } else {
    radio.src = RADIO_URL;
    radio.play().catch(() => {});
  }
});

/* =========================================================
   Escenas que se activan solas al verse: luces y vídeos
   ========================================================= */
const onView = (selector, cb, options = { threshold: 0.25 }) => {
  const els = document.querySelectorAll(selector);
  if (!("IntersectionObserver" in window)) { els.forEach((el) => cb(el, true)); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => cb(e.target._pvEl || e.target, e.isIntersecting, io)), options);
  els.forEach((el) => {
    const t = watchTarget(el);
    if (t !== el) t._pvEl = el;
    io.observe(t);
  });
};

/* Luces: las líneas LED se encienden suavemente y pasa un haz de luz */
onView("[data-lit]", (el, inView, io) => {
  if (!inView) return;
  el.classList.add("is-lit");
  io && io.unobserve(el);
}, { threshold: 0.2 });

/* Portada: un único destello glitch suave al entrar (nada más en toda la web) */
const heroBrand = document.querySelector(".hero__brand");
if (heroBrand && !reducedMotion) {
  setTimeout(() => {
    heroBrand.classList.add("is-glitching");
    setTimeout(() => heroBrand.classList.remove("is-glitching"), 450);
  }, 3000);
}

/* Vídeos: se reproducen solos (en silencio) solo mientras se ven */
onView("video.bgvideo", (v, inView) => {
  if (inView) {
    if (v.preload === "none") { v.preload = "auto"; v.load(); }
    v.play().catch(() => {});
  } else {
    v.pause();
  }
}, { threshold: 0.15 });

/* YouTube: se carga el reproductor solo al pulsar (web rápida) y se pausa la radio */
document.querySelectorAll("[data-yt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.yt;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = btn.getAttribute("aria-label");
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    const box = document.createElement("div");
    box.className = btn.className + " is-playing";
    box.appendChild(iframe);
    btn.replaceWith(box);
    ytPlaying = true;
    setTimeout(() => { radio.pause(); radioOn = true; }, 50); /* silencia la radio mientras ve el vídeo */
  });
});

/* App instalable y disponible sin conexión */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

/* Año actual en el pie */
document.getElementById("year").textContent = new Date().getFullYear();
