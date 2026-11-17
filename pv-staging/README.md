# PowerVane & Wellness · web + Power App

Web estática (HTML, CSS y JavaScript sin dependencias) preparada para GitHub Pages.
No hay servidor ni base de datos: todo lo que se describe como "funciona" funciona así, en el navegador.

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Toda la web: intro, portada, programas, LIVE, Transformación, Best Body Ever, Power App, Comunidad, galería, vídeos, preguntas y contacto |
| `styles.css` | Estilos base (paleta, tipografía, secciones) |
| `design.css` | Capa de diseño v3: intro con logo, portada "Strong is beautiful", tarjetas, Power App tipo aplicación, barra inferior móvil |
| `script.js` | Intro, menú, animaciones al hacer scroll, radio, WhatsApp, formulario de contacto, YouTube |
| `app.js` | Power App: estado, Inicio, Body Evolution 360°, Nutrición, copias, envío de progreso, instalación |
| `studio.js` | Power App: Workout Studio, My Calendar, Power Challenges, My Achievements, My Coach, hábitos, perfil |
| `live.js` / `live-data.js` | LIVE Training con acceso por código de plan (enlaces cifrados AES-GCM) |
| `admin-live.html` | Panel de la entrenadora para programar clases LIVE y generar `live-data.js` |
| `sw.js` / `manifest.webmanifest` | App instalable y disponible sin conexión |
| `assets/` | Fotos y vídeos originales de Vanessa (solo etalonaje de color y luz), iconos y `og.jpg` |

## Funcionalidades

**Web**
- Intro a pantalla completa con sus fotos: se entra tocando el logo PV. Ese mismo toque arranca la radio (Ibiza Global Radio).
- Portada, accesos rápidos, programas con foto, "qué incluye", pasos de contratación y precios exactos: 69 €, 220 € y 300 € + nutrición.
- Contratación por WhatsApp (+34 607 745 308) con el mensaje de cada programa ya escrito.
- Formulario de contacto que abre WhatsApp con el mensaje. No guarda datos.
- SEO: título, descripción, Open Graph con imagen propia, datos estructurados (schema.org) con los precios reales.

**Power App** (datos solo en el dispositivo de cada clienta)
- Inicio: saludo con su nombre y foto, entrenamiento de hoy, progreso semanal, racha y accesos rápidos.
- Workout Studio: rutinas propias, plantillas base editables, biblioteca de 26 ejercicios con filtros, 2 vídeos de técnica de Vanessa, entrenamiento guiado (series, kg, descansos con aviso), historial. Al terminar, se marca el día entrenado y la mejor serie pasa a Seguimiento de fuerza.
- Body Evolution 360°: resumen (peso, % del objetivo, medidas con diferencias), registro, fotos privadas antes/después, gráficas, fuerza y línea temporal.
- My Nutrition: hábitos diarios, plan orientativo (Mifflin-St Jeor), recetas, registro de comidas, agua y lista de la compra.
- My Calendar: calendario mensual con entrenos hechos, entrenos programados y clases LIVE. Recordatorio `.ics` para el calendario del móvil, con aviso 30 minutos antes.
- Power Challenges: retos semanales y mensuales calculados con sus datos reales, puntos y niveles.
- My Achievements: 12 insignias con progreso.
- My Coach: mensajes rápidos, revisión semanal y envío de progreso a la entrenadora por WhatsApp. Perfil, copia de seguridad, cargar copia, borrar y datos de ejemplo.
- En el móvil, barra inferior tipo app. Instalada en la pantalla de inicio, se abre directamente en la app y funciona sin conexión.

## Pendiente (necesita servidor, no se ha simulado)

- **Cuentas de usuaria** (registro, inicio de sesión, recuperar contraseña) y datos sincronizados entre dispositivos.
- **Que la entrenadora vea el progreso de cada clienta** sin que se lo envíe, y mensajería dentro de la app.
- **Clasificación entre clientas** en los retos.
- **Pago online.** Ahora no existe ninguna pasarela; se contrata por WhatsApp.
- **Testimonios y galería de resultados.** No hay testimonios ni fotos de clientas autorizadas, y no se han inventado.

Arquitectura recomendada para cuando se quiera: Supabase (autenticación + Postgres con Row Level Security para que cada usuaria solo vea lo suyo + Storage privado para fotos) y Stripe Checkout para los pagos, conectando la compra con el plan de la usuaria. El estado de la app ya está en un único objeto (`window.PVApp.S`), lo que facilita sincronizarlo.

## Publicar

1. Copiar esta carpeta al repositorio de GitHub Pages (en la raíz si el repositorio es `usuario.github.io`).
2. Al cambiar CSS o JS, subir la versión `?v=AAAAMMDD` en `index.html` y el nombre `CACHE` en `sw.js` para que los móviles no se queden con la versión anterior.
3. Al cambiar de dirección o comprar un dominio, actualizar las URL de `og:image` y del bloque `application/ld+json` en `index.html`.

## LIVE Training

1. Abrir `admin-live.html`, añadir la clase (título, fecha, enlace y planes con acceso).
2. Descargar `live-data.js` y sustituir el de la web.
3. Los códigos de acceso de cada plan se entregan solo a las clientas. Nunca se publican.
