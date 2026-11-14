"""
VOLVER A TI · Motor de música generativa para el directo 24/7.

Genera música ambiental original (sin derechos de terceros) para cada programa:
  - colchón armónico en la escala del programa, con acordes que evolucionan
  - cuencos tibetanos y notas de arpa espaciadas
  - pulso binaural suave (usar con auriculares)
  - naturaleza: lluvia, olas, arroyo o pájaros

Uso:  python music.py <program_id> <salida.m4a> [segundos]
Lee la configuración de programs.json. Escribe AAC estéreo 44,1 kHz mediante ffmpeg.
"""
from __future__ import annotations

import json
import os
import subprocess
import zlib
import sys
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi

SR = 44100
CHUNK = SR * 20  # se sintetiza en bloques de 20 s para usar poca memoria
HERE = Path(__file__).resolve().parent

# Escalas (semitonos sobre la raíz) y progresiones por estado de ánimo
MOODS = {
    "warm":  {"scale": [0, 2, 4, 7, 9],  "chords": [[0, 7, 16, 19], [5, 12, 16, 21], [9, 16, 19, 24], [7, 14, 19, 23]], "harp": 1.0, "bowl": 1.0},
    "open":  {"scale": [0, 2, 7, 9, 14], "chords": [[0, 7, 14, 19], [-3, 4, 12, 16], [5, 12, 17, 21], [2, 9, 14, 21]], "harp": 0.8, "bowl": 1.0},
    "deep":  {"scale": [0, 3, 5, 7, 10], "chords": [[0, 7, 12, 15], [-4, 3, 8, 12], [-2, 5, 10, 14], [0, 7, 10, 15]], "harp": 0.5, "bowl": 1.4},
    "night": {"scale": [0, 2, 4, 7, 9],  "chords": [[0, 7, 12, 16], [-3, 4, 9, 12], [-7, 0, 9, 12], [-5, 2, 7, 11]], "harp": 0.35, "bowl": 0.7},
}
CHORD_SECONDS = 18.0


def find_ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def semis(root: float, s: float) -> float:
    return root * 2 ** (s / 12)


class Events:
    """Eventos percusivos/melódicos programados de antemano (cuencos, arpa, pájaros)."""

    def __init__(self, total: float, mood: dict, root: float, nature: str, rng: np.random.Generator, inst: dict | None = None):
        inst = inst or {"harp": True, "piano": False, "flute": False}
        self.items: list[tuple[float, str, float, float]] = []  # (inicio, tipo, frecuencia, pan)
        t = rng.uniform(3, 8)
        while t < total:
            self.items.append((t, "bowl", semis(root, rng.choice([0, 7, 12]) - 12), rng.uniform(-0.6, 0.6)))
            t += rng.uniform(22, 38) / mood["bowl"]
        t = rng.uniform(6, 12)
        while t < total and mood["harp"] > 0 and inst["harp"]:
            # pequeñas frases de 1 a 3 notas de la escala pentatónica
            for k in range(int(rng.integers(1, 4))):
                deg = int(rng.choice(mood["scale"])) + 12 * int(rng.integers(1, 3))
                self.items.append((t + k * rng.uniform(0.5, 0.9), "harp", semis(root, deg), rng.uniform(-0.5, 0.5)))
            t += rng.uniform(5, 11) / mood["harp"]
        if inst["piano"]:
            # piano: notas sueltas y acordes rotos, muy espaciados
            t = rng.uniform(4, 9)
            while t < total:
                for k in range(int(rng.integers(1, 4))):
                    deg = int(rng.choice(mood["scale"])) + 12 * int(rng.integers(0, 2))
                    self.items.append((t + k * rng.uniform(0.35, 0.8), "piano", semis(root, deg), rng.uniform(-0.4, 0.4)))
                t += rng.uniform(4, 9)
        if inst["flute"]:
            # flauta nativa: frases largas y lentas
            t = rng.uniform(15, 30)
            while t < total:
                deg = int(rng.choice(mood["scale"])) + 12
                for k in range(int(rng.integers(2, 4))):
                    self.items.append((t + k * 2.6, "flute", semis(root, deg), rng.uniform(-0.3, 0.3)))
                    deg = int(rng.choice(mood["scale"])) + 12
                t += rng.uniform(25, 50)
        if nature == "birds":
            t = rng.uniform(2, 6)
            while t < total:
                base = rng.uniform(2400, 4200)
                for k in range(int(rng.integers(2, 6))):
                    self.items.append((t + k * rng.uniform(0.09, 0.18), "bird", base * rng.uniform(0.9, 1.15), rng.uniform(-0.9, 0.9)))
                t += rng.uniform(4, 13)
        self.items.sort()

    def render(self, out: np.ndarray, t0: float) -> None:
        n = out.shape[1]
        t1 = t0 + n / SR
        for start, kind, f, pan in self.items:
            dur = {"bowl": 14.0, "harp": 4.5, "bird": 0.16, "piano": 6.0, "flute": 3.2}[kind]
            if start + dur < t0 or start > t1:
                continue
            i0 = max(0, int((start - t0) * SR))
            i1 = min(n, int((start + dur - t0) * SR))
            if i1 <= i0:
                continue
            tt = (np.arange(i0, i1) / SR + t0 - start).astype(np.float32)
            if kind == "bowl":
                sig = np.zeros_like(tt)
                for ratio, amp, dec in [(1, 1, 0.35), (2.76, 0.45, 0.6), (5.4, 0.22, 1.1), (8.93, 0.1, 1.8)]:
                    sig += amp * np.sin(2 * np.pi * f * ratio * tt + 0.3 * np.sin(2 * np.pi * 4.2 * tt)) * np.exp(-dec * tt)
                sig *= np.minimum(1, tt / 0.01) * 0.10
            elif kind == "harp":
                sig = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt) + 0.1 * np.sin(6 * np.pi * f * tt))
                sig *= np.exp(-1.3 * tt) * np.minimum(1, tt / 0.005) * 0.055
            elif kind == "piano":
                sig = np.zeros_like(tt)
                for h, amp in [(1, 1), (2, 0.5), (3, 0.22), (4, 0.12), (5, 0.05)]:
                    sig += amp * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * tt) * np.exp(-(0.9 + 0.5 * h) * tt)
                sig *= np.minimum(1, tt / 0.004) * 0.05
            elif kind == "flute":
                vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * tt) * np.minimum(1, tt / 0.8)
                ph = 2 * np.pi * np.cumsum(f * vib) / SR
                env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 1.5
                breath = np.random.default_rng(int(f)).standard_normal(len(tt)).astype(np.float32) * 0.08
                sig = (np.sin(ph) + 0.25 * np.sin(2 * ph) + breath) * env * 0.045
            else:  # pájaro: barrido rápido de frecuencia
                sweep = f * (1 + 0.35 * np.sin(np.pi * tt / dur))
                phase = 2 * np.pi * np.cumsum(sweep) / SR
                sig = np.sin(phase) * np.sin(np.pi * tt / dur) ** 2 * 0.018
            l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
            out[0, i0:i1] += sig * l
            out[1, i0:i1] += sig * r


class Noise:
    """Ruidos de naturaleza filtrados con estado continuo entre bloques."""

    def __init__(self, kind: str, rng: np.random.Generator):
        self.kind, self.rng = kind, rng
        bands = {"rain": ("bandpass", [400, 7000]), "waves": ("lowpass", 900), "stream": ("bandpass", [600, 3500])}
        self.sos = None
        if kind in bands:
            btype, fc = bands[kind]
            self.sos = butter(2, fc, btype=btype, fs=SR, output="sos")
            self.zi = [sosfilt_zi(self.sos) * 0, sosfilt_zi(self.sos) * 0]

    def render(self, out: np.ndarray, t: np.ndarray) -> None:
        if self.sos is None:
            return
        n = out.shape[1]
        for ch in range(2):
            w = self.rng.standard_normal(n).astype(np.float32)
            y, self.zi[ch] = sosfilt(self.sos, w, zi=self.zi[ch])
            if self.kind == "waves":
                # olas: oleaje lento de ~9 s con rompiente
                ph = 2 * np.pi * t / 9.3 + ch * 0.6
                env = (0.25 + 0.75 * (0.5 + 0.5 * np.sin(ph)) ** 3)
                y = y * env * 0.20
            elif self.kind == "rain":
                env = 0.85 + 0.15 * np.sin(2 * np.pi * t / 23 + ch)
                y = y * env * 0.045
                # gotas sueltas
                k = self.rng.random(n) < 0.0009
                y = y + np.convolve(k.astype(np.float32) * self.rng.uniform(0.02, 0.08, n).astype(np.float32), np.exp(-np.arange(200) / 25).astype(np.float32), mode="same")
            else:  # arroyo
                env = 0.7 + 0.3 * np.sin(2 * np.pi * t / 3.1 + ch) * np.sin(2 * np.pi * t / 7.7)
                y = y * env * 0.06
            out[ch] += y.astype(np.float32)


def load_voice(vdir: Path | None):
    """Frases de voz remuestreadas a 44,1 kHz con una reverberación suave."""
    if not vdir or not (vdir / "captions.json").exists():
        return []
    import wave
    from scipy.signal import fftconvolve, resample_poly
    ir_n = int(SR * 1.4)
    ir = (np.random.default_rng(3).standard_normal(ir_n) * np.exp(-np.arange(ir_n) / (SR * 0.35))).astype(np.float32)
    ir /= np.abs(ir).sum() / 6
    segs = []
    for c in json.loads((vdir / "captions.json").read_text(encoding="utf-8")):
        with wave.open(str(vdir / c["wav"])) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
            x = resample_poly(x, SR, w.getframerate()).astype(np.float32)
        wet = fftconvolve(x, ir)[: len(x) + ir_n // 2].astype(np.float32)
        dry = np.pad(x, (0, len(wet) - len(x)))
        segs.append((c["t0"], 0.9 * dry + 0.22 * wet))
    return segs


def synth(program: dict, seconds: float, sink, vdir: Path | None = None) -> None:
    m = program["music"]
    variant = os.environ.get("VAT_SEED", "")
    rng = np.random.default_rng(zlib.crc32((program["id"] + variant).encode()))
    # Variación: cada vídeo cambia ánimo cercano, progresión, tempo armónico, brillo e instrumentos
    base_mood = m.get("mood", "warm")
    near = {"warm": ["warm", "open"], "open": ["open", "warm"], "deep": ["deep", "open"], "night": ["night", "warm"]}[base_mood]
    mood = dict(MOODS[str(rng.choice(near)) if variant else base_mood])
    ch = list(mood["chords"]); k = int(rng.integers(0, len(ch))) if variant else 0
    mood["chords"] = ch[k:] + ch[:k]
    if variant and rng.random() < 0.5:
        mood["chords"] = [mood["chords"][i] for i in rng.permutation(len(ch))]
    global CHORD_SECONDS
    CHORD_SECONDS = float(rng.uniform(14, 24)) if variant else 18.0
    inst = {"harp": bool(rng.random() < 0.6), "piano": bool(rng.random() < 0.55), "flute": bool(rng.random() < 0.4)} if variant else {"harp": True, "piano": False, "flute": False}
    if not any(inst.values()):
        inst["piano"] = True
    root, beat, nature = float(m["root"]), float(m["beat"]), m.get("nature", "none")
    events = Events(seconds, mood, root, nature, rng, inst)
    noise = Noise(nature, rng)
    voice = load_voice(vdir)
    print(f"variación: ánimo={[k for k,v in MOODS.items() if v['scale']==mood['scale']][:1]} acordes={CHORD_SECONDS:.0f}s instrumentos={[k for k,v in inst.items() if v]} voz={len(voice)} frases", file=sys.stderr)
    lp = butter(2, float(rng.uniform(1900, 3200)) if variant else 2600, btype="lowpass", fs=SR, output="sos")
    lpz = [sosfilt_zi(lp) * 0, sosfilt_zi(lp) * 0]
    total = int(seconds * SR)
    chords = mood["chords"]
    chord_arr = np.array(chords, dtype=np.float64)

    for start in range(0, total, CHUNK):
        n = min(CHUNK, total - start)
        t = ((start + np.arange(n)) / SR).astype(np.float64)
        out = np.zeros((2, n), dtype=np.float32)

        # Colchón: cada acorde dura CHORD_SECONDS con fundido cruzado coseno
        pos = t / CHORD_SECONDS
        idx = np.floor(pos).astype(int)
        frac = pos - idx
        xf = 0.5 - 0.5 * np.cos(np.pi * np.clip((frac - 0.7) / 0.3, 0, 1))  # transición en el último 30 %
        for which, weight in ((idx, 1 - xf), (idx + 1, xf)):
            for v in range(4):
                f = root * 2 ** (chord_arr[which % len(chords), v] / 12)
                detune = 1 + (v - 1.5) * 0.0012
                breath = 0.75 + 0.25 * np.sin(2 * np.pi * t / (11 + v * 2.3) + v)
                sig = np.sin(2 * np.pi * f * detune * t + 0.4 * np.sin(2 * np.pi * 0.11 * t + v)) * weight * breath
                sig += 0.18 * np.sin(4 * np.pi * f * detune * t) * weight * breath
                pan = (v - 1.5) / 2.2
                out[0] += (sig * np.sqrt((1 - pan) / 2) * 0.05).astype(np.float32)
                out[1] += (sig * np.sqrt((1 + pan) / 2) * 0.05).astype(np.float32)
        # Bajo profundo (raíz una octava abajo)
        sub = np.sin(2 * np.pi * root / 2 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 17))
        out += (sub * 0.05).astype(np.float32)
        for ch in range(2):
            out[ch], lpz[ch] = sosfilt(lp, out[ch], zi=lpz[ch])
        # Pulso binaural: raíz en el oído izquierdo y raíz + pulso en el derecho
        out[0] += (np.sin(2 * np.pi * root * t) * 0.028).astype(np.float32)
        out[1] += (np.sin(2 * np.pi * (root + beat) * t) * 0.028).astype(np.float32)

        events.render(out, start / SR)
        noise.render(out, t)

        # Voz: baja la música mientras se habla (ducking) y añade la voz centrada
        if voice:
            duck = np.zeros(n, dtype=np.float32)
            for t0v, seg in voice:
                a, b = t0v - 0.6, t0v + len(seg) / SR + 0.8
                duck = np.maximum(duck, np.clip(np.minimum((t - a) / 0.6, (b - t) / 0.8), 0, 1).astype(np.float32))
            out *= 1 - 0.45 * duck
            t0c = start / SR
            for t0v, seg in voice:
                i0 = int((t0v - t0c) * SR)
                if i0 >= n or i0 + len(seg) <= 0:
                    continue
                s0, d0 = max(0, -i0), max(0, i0)
                m_ = min(len(seg) - s0, n - d0)
                out[:, d0:d0 + m_] += seg[s0:s0 + m_] * 0.55

        # Fundidos de entrada y salida (coinciden con el vídeo)
        fade = np.minimum(np.clip(t / 2.5, 0, 1), np.clip((seconds - t) / 2.5, 0, 1)).astype(np.float32)
        out *= fade
        np.clip(out, -0.98, 0.98, out=out)
        sink.write(np.ascontiguousarray(out.T).astype("<f4").tobytes())


def main() -> None:
    pid, dest = sys.argv[1], sys.argv[2]
    cfg = json.loads((HERE / "programs.json").read_text(encoding="utf-8"))
    program = next(p for p in cfg["programs"] if p["id"] == pid)
    seconds = float(sys.argv[3]) if len(sys.argv) > 3 else program["minutes"] * 60
    bitrate = cfg["stream"]["audioBitrate"]
    ff = subprocess.Popen(
        [find_ffmpeg(), "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
         "-af", "loudnorm=I=-18:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "aac", "-b:a", bitrate, dest],
        stdin=subprocess.PIPE,
    )
    vdir = Path(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != "-" else None
    synth(program, seconds, ff.stdin, vdir)
    ff.stdin.close()
    if ff.wait() != 0:
        sys.exit("ffmpeg falló al codificar el audio")
    print(f"audio {pid}: {seconds:.0f} s → {dest}")


if __name__ == "__main__":
    main()
