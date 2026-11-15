/* =========================================================
   PowerVane & Wellness · Interacción
   ========================================================= */

/* ⚠️ CAMBIA AQUÍ el número de WhatsApp: prefijo de país + número, sin "+" ni espacios.
   Ejemplo España: 34612345678 */
const WHATSAPP_NUMBER = "34600000000";

/* Mensaje que se envía automáticamente según el botón pulsado */
const WA_MESSAGES = {
  general: "¡Hola! 💗 He visto la web de PowerVane & Wellness y me gustaría recibir más información.",
  especializado: "¡Hola! 💗 Me interesan los Programas especializados de 8 semanas (Glute Focus / Strong&Feminine, 79 €). ¿Me cuentas más?",
  powerstart: "¡Hola! 💗 Quiero empezar con PowerStart (220 €). ¿Cuáles son los siguientes pasos?",
  transformation: "¡Hola! 💗 Me interesa Power Transformation (300 € + nutrición). Me gustaría saber cómo empezar."
};

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

/* Animación de aparición al hacer scroll */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* Año actual en el pie */
document.getElementById("year").textContent = new Date().getFullYear();
