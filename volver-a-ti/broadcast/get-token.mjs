/*
 * Autorización única del canal (se ejecuta UNA vez en tu ordenador).
 *   YT_CLIENT_ID=... YT_CLIENT_SECRET=... node get-token.mjs
 * Abre el enlace que muestra, entra con la cuenta del canal Volver a Ti y acepta.
 * Imprime el YT_REFRESH_TOKEN que hay que guardar como secreto en GitHub.
 * (Credencial OAuth de tipo "Aplicación de escritorio" en Google Cloud.)
 */
import { createServer } from "node:http";

const { YT_CLIENT_ID: id, YT_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error("Define YT_CLIENT_ID y YT_CLIENT_SECRET"); process.exit(1); }
const redirect = "http://127.0.0.1:8765";
const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube";
const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: id, redirect_uri: redirect, response_type: "code", scope, access_type: "offline", prompt: "consent" })}`;
console.log("\nAbre este enlace en el navegador:\n\n" + url + "\n");

createServer(async (req, res) => {
  const code = new URL(req.url, redirect).searchParams.get("code");
  if (!code) { res.end("Esperando autorización…"); return; }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const j = await r.json();
  res.end(j.refresh_token ? "Listo. Vuelve a la terminal." : "Error: " + JSON.stringify(j));
  console.log(j.refresh_token ? `\nYT_REFRESH_TOKEN=${j.refresh_token}\n` : j);
  process.exit(0);
}).listen(8765);
