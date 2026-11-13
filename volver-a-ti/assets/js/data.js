/* VOLVER A TI · Contenido del sitio */
(function () {
  "use strict";

  /* ---------- Clips vivos (escenas generativas en canvas) ---------- */
  const CLIPS = [
    {
      id: "respiracion",
      kicker: "Meditación guiada",
      title: "Respiración Cósmica",
      text: "Una flor de la vida dorada se expande al inhalar y se recoge al exhalar. Sigue su ritmo 4 · 2 · 6 y deja que tu sistema nervioso se calme.",
      tags: ["Respiración 4·2·6", "Theta 6 Hz"],
      audio: { base: 216, beat: 6, pad: true, noise: 0.0 },
    },
    {
      id: "chakras",
      kicker: "Los siete chakras",
      title: "Ascenso de la Luz",
      text: "Una corriente de luz sube desde la raíz hasta la corona y despierta cada centro energético con su color. Un recorrido completo de alineación.",
      tags: ["7 centros", "7,83 Hz"],
      audio: { base: 256, beat: 7.83, pad: true, noise: 0.0 },
    },
    {
      id: "dormir",
      kicker: "Dormir profundamente",
      title: "Luna sobre el Agua",
      text: "Una luna llena sobre un lago en calma, estrellas fugaces y el suave murmullo del agua. Para soltar el día y entrar en el sueño.",
      tags: ["Sueño", "Delta 2 Hz"],
      audio: { base: 108, beat: 2, pad: true, noise: 0.22 },
    },
    {
      id: "loto",
      kicker: "Paz interior",
      title: "Despertar del Loto",
      text: "Un loto de luz se abre pétalo a pétalo mientras el polvo dorado asciende. Una visualización para florecer desde dentro.",
      tags: ["Visualización", "Alfa 8 Hz"],
      audio: { base: 264, beat: 8, pad: true, noise: 0.0 },
    },
    {
      id: "libelula",
      kicker: "Transformación",
      title: "Vuelo de la Libélula",
      text: "La libélula de Volver a Ti cruza una aurora violeta dejando una estela de oro. Una meditación sobre el cambio y la ligereza.",
      tags: ["Transformación", "Alfa 10 Hz"],
      audio: { base: 288, beat: 10, pad: true, noise: 0.0 },
    },
    {
      id: "geometria",
      kicker: "Espiritualidad y consciencia",
      title: "Geometría Sagrada",
      text: "El cubo de Metatrón gira lentamente y cambia de color a través de los siete chakras. Un mandala vivo para la contemplación profunda.",
      tags: ["Contemplación", "Theta 7 Hz"],
      audio: { base: 216, beat: 7, pad: true, noise: 0.0 },
    },
  ];

  /* ---------- Los siete chakras (de la corona a la raíz) ---------- */
  const CHAKRAS = [
    { id: "corona", name: "Corona", sanskrit: "Sahasrara", color: "#b15cff", place: "Coronilla", element: "Consciencia", mantra: "OM · silencio", hz: 963,
      theme: "Conexión espiritual, unidad y propósito.", affirmation: "Soy uno con todo lo que existe.",
      practice: "Siéntate en silencio cinco minutos e imagina una luz violeta que entra por la coronilla y llena todo tu cuerpo." },
    { id: "tercer-ojo", name: "Tercer ojo", sanskrit: "Ajna", color: "#6f6bff", place: "Entrecejo", element: "Luz", mantra: "OM", hz: 852,
      theme: "Intuición, claridad mental e imaginación.", affirmation: "Confío en lo que mi intuición me muestra.",
      practice: "Con los ojos cerrados, lleva la atención al entrecejo y canta OM en voz baja durante siete respiraciones." },
    { id: "garganta", name: "Garganta", sanskrit: "Vishuddha", color: "#25b4ff", place: "Garganta", element: "Éter", mantra: "HAM", hz: 741,
      theme: "Expresión, verdad y comunicación honesta.", affirmation: "Expreso mi verdad con calma y amor.",
      practice: "Escribe sin filtro durante diez minutos todo lo que no te has atrevido a decir. Después, léelo en voz alta." },
    { id: "corazon", name: "Corazón", sanskrit: "Anahata", color: "#2fd46a", place: "Centro del pecho", element: "Aire", mantra: "YAM", hz: 639,
      theme: "Amor, compasión, perdón y conexión.", affirmation: "Doy y recibo amor con libertad.",
      practice: "Coloca ambas manos sobre el pecho y respira imaginando una luz verde que se expande con cada inhalación." },
    { id: "plexo", name: "Plexo solar", sanskrit: "Manipura", color: "#ffd23a", place: "Sobre el ombligo", element: "Fuego", mantra: "RAM", hz: 528,
      theme: "Voluntad, autoestima y poder personal.", affirmation: "Confío en mi fuerza y en mis decisiones.",
      practice: "Practica la respiración de fuego suave: exhalaciones cortas por la nariz durante 30 segundos, tres rondas." },
    { id: "sacro", name: "Sacro", sanskrit: "Svadhisthana", color: "#ff8a2a", place: "Bajo el ombligo", element: "Agua", mantra: "VAM", hz: 417,
      theme: "Creatividad, emociones y placer de vivir.", affirmation: "Me permito sentir, crear y disfrutar.",
      practice: "Mueve las caderas en círculos lentos con música suave. Deja que el cuerpo guíe el movimiento." },
    { id: "raiz", name: "Raíz", sanskrit: "Muladhara", color: "#ff4545", place: "Base de la columna", element: "Tierra", mantra: "LAM", hz: 396,
      theme: "Seguridad, estabilidad y arraigo.", affirmation: "Estoy a salvo. Pertenezco a este lugar.",
      practice: "Camina descalzo sobre tierra o hierba durante diez minutos, sintiendo cada paso." },
  ];

  /* ---------- Series del canal ---------- */
  const SERIES = [
    { id: "guiada", title: "Meditación guiada", script: "Respira", hue: ["#3b1470", "#7b3fd0"], accent: "#f5c66a",
      text: "Prácticas de 10 a 30 minutos para calmar la ansiedad, soltar el estrés y volver al presente.",
      examples: ["Meditación para soltar la ansiedad", "Escaneo corporal de 15 minutos", "Respirar para volver al presente"] },
    { id: "dormir", title: "Dormir profundamente", script: "Descansa", hue: ["#0d0a2e", "#2b2470"], accent: "#cfd8ff",
      text: "Viajes nocturnos, sonidos de la naturaleza y frecuencias delta para un sueño reparador.",
      examples: ["Duerme en 10 minutos", "Lluvia y luna · 8 horas", "Meditación para el insomnio"] },
    { id: "chakras", title: "Los siete chakras", script: "Equilibra", hue: ["#2a0b52", "#b15cff"], accent: "#ffd23a",
      text: "Un viaje por cada centro energético: su significado, sus bloqueos y cómo armonizarlos.",
      examples: ["Alineación completa de chakras", "Abre tu chakra corazón", "Chakra raíz: seguridad y arraigo"] },
    { id: "consciencia", title: "Espiritualidad y consciencia", script: "Despierta", hue: ["#170838", "#4b2a9c"], accent: "#f5c66a",
      text: "Reflexiones, enseñanzas y contemplaciones sobre el ser, el ego y el despertar interior.",
      examples: ["Quién eres más allá de tus pensamientos", "El poder del ahora", "Geometría sagrada para meditar"] },
    { id: "paz", title: "Paz interior y crecimiento", script: "Florece", hue: ["#0f2b2a", "#1f7a63"], accent: "#f5c66a",
      text: "Afirmaciones, amor propio y hábitos conscientes para crecer desde la calma.",
      examples: ["Afirmaciones de amor propio", "Soltar lo que ya no te pertenece", "Ritual de gratitud matutino"] },
  ];

  /* ---------- Prompts cinematográficos ---------- */
  const STYLE_SUFFIX =
    "Volver a Ti visual identity: deep violet and royal purple palette (#14052E, #2A0B52, #6B2BB0) with luminous warm gold light (#F5C66A) and warm white highlights, subtle accents in the seven chakra colors. Soft volumetric light rays, gentle bloom, floating golden dust particles, faint sacred geometry, slow graceful motion, serene and premium, cinematic 24fps, anamorphic lens, shallow depth of field, very subtle film grain. No text, no logos, no watermarks, no distorted faces or hands.";

  const PROMPT_CATS = [
    { id: "all", label: "Todos" },
    { id: "guiada", label: "Meditación guiada" },
    { id: "dormir", label: "Dormir" },
    { id: "chakras", label: "Chakras" },
    { id: "consciencia", label: "Consciencia" },
    { id: "paz", label: "Paz interior" },
    { id: "marca", label: "Intro · Outro · Shorts" },
  ];

  const PROMPTS = [
    { cat: "marca", title: "Intro de marca · El despertar de la libélula", format: "16:9", length: "8 s", use: "Intro del canal",
      prompt: "Extreme close-up opening in total darkness: a single golden spark ignites at the center of the frame and draws a perfect thin circle of light. Inside it, a translucent lotus flower blooms in slow motion, petals edged in liquid gold. A crystalline dragonfly unfolds its four iridescent violet wings from the lotus; seven glowing orbs light up one by one along its body from red at the bottom to violet at the top. The camera slowly pushes in as a soft burst of golden light fills the frame. Locked composition, perfectly symmetrical, ethereal, magical, majestic." },
    { cat: "marca", title: "Outro · Disolución en polvo de oro", format: "16:9", length: "5 s", use: "Pantalla final",
      prompt: "A glowing golden dragonfly hovers in the center of a deep violet cosmic void, then gently dissolves into thousands of tiny golden particles that drift upward like embers and slowly form a soft luminous circle. Static camera, symmetrical, calm, the left and right thirds of the frame remain dark and empty to leave room for end-screen elements." },
    { cat: "marca", title: "Short vertical · Respira conmigo", format: "9:16", length: "10 s loop", use: "YouTube Shorts",
      prompt: "Vertical frame. A luminous golden mandala made of sacred geometry slowly expands for four seconds and contracts for six seconds, like a breathing guide, floating over a deep violet nebula with drifting stardust. Perfect seamless loop, centered, hypnotic, minimal, generous empty space at the top and bottom for captions." },
    { cat: "guiada", title: "Amanecer sobre un lago de montaña", format: "16:9", length: "10 s loop", use: "Fondo de meditación",
      prompt: "Golden-hour sunrise over a perfectly still alpine lake wrapped in soft mist, distant violet mountains, the first rays of sunlight piercing the fog as volumetric god rays. A single dragonfly glides low over the mirror-like water leaving gentle ripples. Slow aerial drift forward at water level, 35mm anamorphic, dreamy, peaceful." },
    { cat: "guiada", title: "Respiración en el bosque sagrado", format: "16:9", length: "10 s", use: "B-roll",
      prompt: "Ancient misty forest at dawn, shafts of warm golden light falling through tall trees, glowing particles of pollen floating in the air like tiny stars. The camera slowly cranes upward from moss-covered ground to the canopy. Ultra-detailed, tranquil, sacred atmosphere, soft lens bloom." },
    { cat: "dormir", title: "Luna llena sobre el océano nocturno", format: "16:9", length: "15 s loop", use: "Fondo para dormir",
      prompt: "A huge full moon rising over a calm night ocean, a shimmering silver-gold path of moonlight on gentle waves, deep indigo and violet sky full of stars, an occasional slow shooting star. Completely static camera, extremely slow motion, seamless loop, deeply relaxing, low contrast, very dark and soothing, no sudden movement." },
    { cat: "dormir", title: "Lluvia suave en el templo de cristal", format: "16:9", length: "10 s loop", use: "Fondo para dormir",
      prompt: "Inside a small glass meditation temple at night, soft rain running down the windows, candlelight glowing warm gold, a lotus floating in a stone basin of water. Outside, a violet forest blurred by the rain. Static camera, intimate, cozy, ultra-calm, seamless loop." },
    { cat: "chakras", title: "Alineación de los siete chakras", format: "16:9", length: "10 s", use: "Vídeo de chakras",
      prompt: "A translucent silhouette of a person meditating in lotus position, made of soft starlight, seen from the front against a deep violet cosmos. Seven glowing energy spheres ignite in sequence along the spine: red at the base, then orange, yellow, green, blue, indigo and violet at the crown, each releasing a gentle ring of light. A golden column of energy rises and opens into a radiant lotus above the head. Slow push-in, symmetrical, spiritual, awe-inspiring." },
    { cat: "chakras", title: "Chakra corazón · Esmeralda viva", format: "16:9", length: "8 s", use: "B-roll",
      prompt: "Macro shot of a glowing emerald-green lotus opening in slow motion over dark water, golden filaments of light spiraling from its center, tiny luminous particles floating around. The water reflects soft violet and gold. Gentle orbit camera move, warm, loving, healing atmosphere." },
    { cat: "consciencia", title: "Viaje al interior de la geometría sagrada", format: "16:9", length: "10 s", use: "Transición / B-roll",
      prompt: "Infinite fly-through tunnel made of glowing golden sacred geometry, flower of life and Metatron's cube patterns rotating slowly around the camera, deep violet cosmic void in the background with nebula clouds. Smooth continuous forward motion, perfectly centered, hypnotic, transcendental, high detail light lines." },
    { cat: "consciencia", title: "Nebulosa con forma de loto", format: "16:9", length: "12 s loop", use: "Fondo de meditación",
      prompt: "A colossal cosmic nebula shaped like a blooming lotus flower, violet, magenta and gold gas clouds, a bright golden star pulsing gently at its heart, countless stars twinkling. Ultra-slow zoom in, seamless loop, majestic, contemplative, Hubble-like realism with a spiritual glow." },
    { cat: "paz", title: "Libélula sobre el estanque de lotos", format: "16:9", length: "10 s", use: "B-roll",
      prompt: "Golden-hour close-up of a crystalline dragonfly with iridescent violet wings landing on the tip of a pink lotus bud in a calm pond, wings catching the sunlight like stained glass, soft bokeh of floating pollen and lily pads. Slow motion 120fps look, macro lens, delicate, peaceful, exquisite detail." },
    { cat: "paz", title: "Campo de luz al atardecer", format: "9:16", length: "8 s", use: "YouTube Shorts",
      prompt: "Vertical frame. A person seen from behind standing with open arms in a meadow of tall golden grass at sunset, warm wind moving the grass, a violet and gold sky, hundreds of glowing particles rising around them like fireflies. Slow push-in, liberating, hopeful, cinematic." },
  ];

  window.VAT_DATA = { CLIPS, CHAKRAS, SERIES, PROMPTS, PROMPT_CATS, STYLE_SUFFIX };
})();
