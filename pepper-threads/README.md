# Pepper · Publicaciones automáticas en Threads

Publica 2 veces al día en Threads (09:00 y 14:00 en horario de invierno de España; 10:00 y 15:00 en verano) una publicación de `posts.json`, alternando sectores: dental, estética, oftalmología, audiología y general. Cada publicación lleva el enlace a la landing de su sector y un tema de Threads.

No publica nada hasta que exista el secreto `THREADS_TOKEN`.

## Activarlo (una sola vez)

1. **Threads:** pon tu perfil en **público**.
2. **Meta for Developers:** entra en https://developers.facebook.com/apps y pulsa **Crear app**. Elige el caso de uso **Acceder a la API de Threads**.
3. En el caso de uso, añade los permisos `threads_basic` y `threads_content_publish`.
4. En **Roles de la app** → **Probadores de Threads**, añade tu usuario de Threads. Acepta la invitación desde Threads → Configuración → Cuenta → Permisos de sitios web.
5. En el panel de la app, abre **Explorador de la API de Threads** (o "Generar token de acceso"), genera una clave con esos permisos y cámbiala por una **clave de larga duración** (60 días).
6. En GitHub, ve a este repositorio → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - Nombre `THREADS_TOKEN`, valor: la clave de larga duración.
7. Prueba: **Actions** → **Pepper · Threads** → **Run workflow**, con `dry` = `true` para ver qué publicaría y con `false` para publicar de verdad.

### Opcional: renovación totalmente automática

Los domingos el sistema renueva la clave para que no caduque. Si Meta devuelve una clave distinta, la guarda sola en GitHub si existe el secreto `GH_PAT`: un token de GitHub (fine-grained) con acceso solo a este repositorio y permiso **Secrets: Read and write**. Si no lo añades, GitHub mostrará un aviso cuando haya que actualizar `THREADS_TOKEN` a mano.

## Cambiar publicaciones

- Edita `posts.json`. Cada texto, con la firma incluida, debe tener como máximo 500 caracteres.
- `base` es la dirección de la landing. Si la pasas a Netlify, cambia solo esa línea.
- Para comprobarlo: `node publish.mjs --list`.
