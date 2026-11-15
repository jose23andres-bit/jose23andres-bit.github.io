"""
VOLVER A TI · Voz guiada (Piper TTS, sin conexión) + subtítulos sincronizados.

Uso: python voice.py <program_id> <segundos> <modo> <carpeta_salida> [frase_short]
  modo: guided (meditación completa) · sleep (solo introducción) · short
Escribe en la carpeta:  voice_XX.wav (una por frase) y captions.json [{t0, t1, text, wav}]

Voces (licencias de los datos: CC BY-SA 4.0 y CC BY 3.0, se citan en la descripción):
  es_AR-daniela-high (por defecto) · es_ES-sharvard-medium
"""
from __future__ import annotations

import json
import os
import random
import subprocess
import sys
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
VOICES = Path(os.environ.get("VAT_VOICES", HERE / "voices"))
VOICE = os.environ.get("VAT_VOICE", "es_AR-daniela-high")
PIPER = os.environ.get("VAT_PIPER", "piper")


def say(text: str, out: Path) -> float:
    # length-scale > 1 = habla más lenta y serena; pausas largas entre frases
    subprocess.run([PIPER, "-m", str(VOICES / f"{VOICE}.onnx"), "--length-scale", "1.28", "--sentence-silence", "0.8", "-f", str(out)],
                   input=text.encode(), check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(str(out)) as w:
        return w.getnframes() / w.getframerate()


def main() -> None:
    pid, seconds, mode, outdir = sys.argv[1], float(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
    phrase = sys.argv[5] if len(sys.argv) > 5 else ""
    outdir.mkdir(parents=True, exist_ok=True)
    S = json.loads((HERE / "scripts.json").read_text(encoding="utf-8"))
    prog = S["programs"].get(pid, {})
    rng = random.Random(f"{pid}-{os.environ.get('VAT_SEED', '')}")
    caps: list[dict] = []

    def place(text: str, t0: float, gap: float = 3.2) -> float:
        wav = outdir / f"voice_{len(caps):02d}.wav"
        d = say(text, wav)
        caps.append({"t0": round(t0, 2), "t1": round(t0 + d, 2), "text": text, "wav": wav.name})
        return t0 + d + gap

    if mode == "tips":
        tip = S["tips"][int(phrase or 0) % len(S["tips"])]
        t = place(tip["title"], 0.8, 0.7)
        for line in tip["lines"]:
            t = place(line, t, 0.7)
        place(rng.choice(S["tipsClose"]), t + 0.3, 0)
    elif mode == "short":
        t = place(phrase.replace("|", " "), 1.4, 1.2)
        t = place(rng.choice(S["shorts"]["afterPhrase"]), t, 1.5)
        close = rng.choice(S["shorts"]["close"])
        place(close, max(t, seconds - 6.5))
    else:
        t = 6.0
        intro = S["common"]["intro"] + prog.get("intro", [])
        for line in intro:
            t = place(line, t, rng.uniform(3.5, 5.5) if mode == "guided" else 5.5)
        if mode == "guided":
            outro = S["common"]["outro"]
            outro_start = seconds - 70
            middle = list(prog.get("middle", []))
            rng.shuffle(middle)
            spacing = max(45.0, (outro_start - t - 30) / max(1, len(middle)))
            nt = t + spacing * 0.6
            for line in middle:
                if nt > outro_start - 30:
                    break
                place(line, nt)
                nt += spacing * rng.uniform(0.85, 1.15)
            t = outro_start
            for line in outro:
                t = place(line, t, 3.8)
    (outdir / "captions.json").write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"voz {pid} ({mode}): {len(caps)} frases")


if __name__ == "__main__":
    main()
