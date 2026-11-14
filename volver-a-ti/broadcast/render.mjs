/*
 * VOLVER A TI · Renderizador de programas para el directo.
 *
 * Para cada programa de programs.json:
 *   1. Abre stage.html en Chromium sin pantalla y dibuja cada fotograma (1920x1080, 30 fps).
 *   2. Envía los fotogramas a ffmpeg y los codifica en H.264 con los parámetros que pide YouTube Live.
 *   3. Genera la música original con music.py y la une al vídeo.
 * El resultado son archivos MP4 idénticos en formato, que stream.sh encadena sin recodificar.
 *
 * Uso:
 *   node render.mjs                 renderiza los programas que falten
 *   node render.mjs --only bosque-432 --seconds 30   prueba rápida
 *   node render.mjs --force         vuelve a renderizar todo
 */
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.VAT_OUT || join(HERE, "segments");
const PY = process.env.VAT_PYTHON || "python3";
const cfg = JSON.parse(readFileSync(join(HERE, "programs.json"), "utf8"));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const only = opt("--only"), forceSeconds = opt("--seconds") ? +opt("--seconds") : undefined, force = args.includes("--force");
const FPS = cfg.stream.fps;
const VOICE = opt("--voice") || "";
const VW = +(opt("--w") || 1920), VH = +(opt("--h") || 1080), PHRASE = opt("--phrase") || "", CTA = opt("--cta") || "", NAME = opt("--name");

function ffmpegPath() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try { return execFileSync(PY, ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"]).toString().trim(); }
  catch { return "ffmpeg"; }
}
const FF = ffmpegPath();

const run = (cmd, a) => new Promise((ok, ko) => {
  const p = spawn(cmd, a, { stdio: ["ignore", "inherit", "inherit"] });
  p.on("exit", (c) => (c === 0 ? ok() : ko(new Error(`${cmd} terminó con código ${c}`))));
});

async function renderProgram(browser, prog) {
  const seconds = forceSeconds ?? prog.minutes * 60;
  const frames = Math.round(seconds * FPS);
  const final = join(OUT, `${NAME || prog.id}.mp4`);
  if (existsSync(final) && !force && !forceSeconds) { console.log(`✓ ${prog.id} ya existe`); return; }
  mkdirSync(OUT, { recursive: true });
  const tmpVideo = join(OUT, `.${prog.id}.video.mp4`), tmpAudio = join(OUT, `.${prog.id}.m4a`), tmpFinal = join(OUT, `.${prog.id}.mp4`);

  console.log(`▶ ${prog.id}: ${seconds} s · ${frames} fotogramas`);
  // Voz guiada (opcional): primero se sintetiza, porque la música se mezcla con ella y la imagen muestra los subtítulos
  const vdir = join(OUT, `.${NAME || prog.id}.voice`);
  let captions = [];
  if (VOICE) {
    await run(PY, [join(HERE, "voice.py"), prog.id, String(seconds), VOICE, vdir, PHRASE]);
    captions = JSON.parse(readFileSync(join(vdir, "captions.json"), "utf8"));
  }
  const audio = run(PY, [join(HERE, "music.py"), prog.id, tmpAudio, String(seconds), VOICE ? vdir : "-"]);

  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  const url = pathToFileURL(join(HERE, "stage.html"));
  url.search = new URLSearchParams({ scene: prog.scene, title: prog.title, subtitle: prog.subtitle || "", breath: prog.breath && VH <= VW ? "1" : "0", duration: String(seconds), w: String(VW), h: String(VH), phrase: PHRASE, cta: CTA }).toString();
  await page.goto(url.href, { waitUntil: "networkidle" });
  await page.evaluate(() => window.stageReady);
  await page.evaluate((c) => { window.CAPTIONS = c; }, captions);

  // Parámetros de YouTube Live: H.264 High, 1080p30, CBR ~4,5 Mbps, keyframe cada 2 s
  const vb = cfg.stream.videoBitrate;
  const enc = spawn(FF, [
    "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", process.env.VAT_PRESET || "medium", "-tune", "film", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-b:v", vb, "-maxrate", vb, "-bufsize", `${parseInt(vb) * 2}k`, "-g", String(FPS * 2), "-keyint_min", String(FPS * 2), "-sc_threshold", "0",
    "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-r", String(FPS), tmpVideo,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const encDone = new Promise((ok, ko) => enc.on("exit", (c) => (c === 0 ? ok() : ko(new Error("ffmpeg (vídeo) falló")))));

  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const data = await page.evaluate((t) => { window.renderFrame(t); return document.getElementById("stage").toDataURL("image/jpeg", 0.93); }, f / FPS);
    const buf = Buffer.from(data.slice(data.indexOf(",") + 1), "base64");
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
    if (f % (FPS * 10) === 0 && f) {
      const fps = f / ((Date.now() - t0) / 1000);
      process.stdout.write(`  ${prog.id} ${Math.round((f / frames) * 100)} % · ${fps.toFixed(1)} fps · quedan ${Math.round((frames - f) / fps / 60)} min\n`);
    }
  }
  enc.stdin.end();
  await encDone; await audio; await page.close();

  await run(FF, ["-y", "-loglevel", "error", "-i", tmpVideo, "-i", tmpAudio, "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", "-movflags", "+faststart", tmpFinal]);
  renameSync(tmpFinal, final);
  rmSync(tmpVideo, { force: true }); rmSync(tmpAudio, { force: true }); rmSync(vdir, { recursive: true, force: true });
  console.log(`✓ ${prog.id} listo en ${Math.round((Date.now() - t0) / 1000)} s → ${final}`);
}

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files", "--enable-gpu-rasterization"] });
try {
  const list = cfg.programs.filter((p) => !only || p.id === only);
  if (!list.length) throw new Error(`No existe el programa ${only}`);
  const workers = Math.max(1, +(process.env.VAT_WORKERS || 1));
  const queue = [...list];
  await Promise.all(Array.from({ length: workers }, async () => { while (queue.length) await renderProgram(browser, queue.shift()); }));
} finally {
  await browser.close();
}
