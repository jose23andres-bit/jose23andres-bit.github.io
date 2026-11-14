/*
 * VOLVER A TI · Configuración del sitio
 * --------------------------------------------------------------
 * Edita este archivo para conectar la web con tu canal.
 * No hace falta tocar el HTML.
 */
window.VAT_CONFIG = {
  // URL de tu canal de YouTube (cámbiala cuando lo crees)
  channelUrl: "https://www.youtube.com/@VolverATi",

  /*
   * ID del canal (empieza por "UC", 24 caracteres). Está en YouTube Studio →
   * Configuración → Canal → Configuración avanzada.
   * Con él, la web muestra el directo 24/7 y se actualiza sola con cada vídeo nuevo.
   */
  channelId: "",

  // Redes sociales (deja "" para ocultar el enlace)
  social: {
    youtube: "https://www.youtube.com/@VolverATi",
    instagram: "",
    tiktok: "",
    spotify: "",
  },

  // Correo de contacto (deja "" para ocultarlo)
  email: "",

  /*
   * Vídeos publicados en YouTube.
   * Cuando subas un vídeo, añade aquí su ID (lo que va después de "watch?v=").
   * En cuanto haya al menos uno, aparece la sección "Últimos vídeos".
   *
   * series: "guiada" | "dormir" | "chakras" | "consciencia" | "paz"
   *
   * Ejemplo:
   * { id: "dQw4w9WgXcQ", title: "Meditación guiada para soltar la ansiedad", series: "guiada", duration: "15:00" },
   */
  videos: [],
};
