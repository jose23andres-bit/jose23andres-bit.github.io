"""
Genera el logotipo vectorial de VOLVER A TI y sus exportaciones PNG.

Reconstrucción vectorial fiel a la imagen de referencia oficial:
libélula central con siete chakras, loto detrás, círculo dorado,
fondo violeta y rotulación caligráfica "Volver a Ti".

El texto se convierte a trazados (Great Vibes, licencia OFL) para que
el SVG se vea igual en cualquier lugar sin depender de fuentes instaladas.

Uso:  python tools/build_logo.py
Requiere: fonttools, uharfbuzz, cairosvg, pillow
"""
from __future__ import annotations

import io
import random
from pathlib import Path

import cairosvg
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
FONT = ROOT / "tools" / "GreatVibes-Regular.ttf"
IMG.mkdir(parents=True, exist_ok=True)

GOLD = "#f5c66a"
CHAKRAS = [  # de corona (arriba) a raíz (abajo)
    ("#b15cff", "#5b1aa8"),  # Sahasrara  · violeta
    ("#6f6bff", "#2d2a9c"),  # Ajna       · índigo
    ("#25b4ff", "#0b5f9e"),  # Vishuddha  · azul
    ("#2fd46a", "#0f7a37"),  # Anahata    · verde
    ("#ffd23a", "#b58600"),  # Manipura   · amarillo
    ("#ff8a2a", "#b04a05"),  # Svadhisthana · naranja
    ("#ff4545", "#a01212"),  # Muladhara  · rojo
]
MIRROR = 'transform="translate(1000,0) scale(-1,1)"'


# --------------------------------------------------------------------------
# Rotulación: "Volver a Ti" como trazados vectoriales
# --------------------------------------------------------------------------
def text_path(text: str, target_width: float, cx: float, baseline: float) -> str:
    blob = hb.Blob.from_file_path(str(FONT))
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True, "calt": True})

    tt = TTFont(str(FONT))
    glyph_set = tt.getGlyphSet()
    order = tt.getGlyphOrder()

    # Medimos el ancho total para escalar al tamaño deseado
    total_adv = sum(p.x_advance for p in buf.glyph_positions)
    scale = target_width / total_adv
    x0 = cx - target_width / 2

    pen = SVGPathPen(glyph_set)
    x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        # y invertida (fuentes: y hacia arriba; SVG: y hacia abajo)
        t = (scale, 0, 0, -scale, x0 + (x + pos.x_offset) * scale, baseline - pos.y_offset * scale)
        glyph_set[name].draw(TransformPen(pen, t))
        x += pos.x_advance
    return pen.getCommands()


def sparkle(x: float, y: float, l: float, a: float | None = None) -> str:
    a = a if a is not None else l * 0.11
    return (
        f"M{x},{y-l} C{x+a},{y-a} {x+a},{y-a} {x+l},{y} "
        f"C{x+a},{y+a} {x+a},{y+a} {x},{y+l} "
        f"C{x-a},{y+a} {x-a},{y+a} {x-l},{y} "
        f"C{x-a},{y-a} {x-a},{y-a} {x},{y-l} Z"
    )


def hexagram(cx: float, cy: float, r: float) -> str:
    import math
    def tri(rot):
        pts = []
        for i in range(3):
            ang = math.radians(rot + i * 120)
            pts.append(f"{cx + r*math.sin(ang):.2f},{cy - r*math.cos(ang):.2f}")
        return "M" + " L".join(pts) + " Z"
    return tri(0) + " " + tri(180)


# --------------------------------------------------------------------------
# Piezas del emblema
# --------------------------------------------------------------------------
def defs(glow: bool) -> str:
    chakra_grads = "".join(
        f'<radialGradient id="ck{i}" cx="40%" cy="35%" r="70%">'
        f'<stop offset="0" stop-color="#ffffff"/>'
        f'<stop offset="0.35" stop-color="{c1}"/>'
        f'<stop offset="1" stop-color="{c2}"/></radialGradient>'
        for i, (c1, c2) in enumerate(CHAKRAS)
    )
    filters = (
        """
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="5" result="b1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b2"/>
      <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>"""
        if glow
        else ""
    )
    return f"""
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="70%">
      <stop offset="0" stop-color="#43177c"/>
      <stop offset="0.55" stop-color="#26094f"/>
      <stop offset="1" stop-color="#11042a"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff4cc"/>
      <stop offset="0.45" stop-color="#f6c45c"/>
      <stop offset="0.78" stop-color="#d48a26"/>
      <stop offset="1" stop-color="#fbe1a0"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff0b8"/>
      <stop offset="0.5" stop-color="#f2b54a"/>
      <stop offset="1" stop-color="#ffe6a3"/>
    </linearGradient>
    <linearGradient id="lotus" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe2a8" stop-opacity="0.55"/>
      <stop offset="0.5" stop-color="#c58cf0" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#6b2bb0" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="wingU" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#ffe0a0" stop-opacity="0.95"/>
      <stop offset="0.35" stop-color="#c77dff" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#7a2fe0" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="tail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb347"/>
      <stop offset="1" stop-color="#fff1c2"/>
    </linearGradient>
    <radialGradient id="head" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#f3d8ff"/>
      <stop offset="0.5" stop-color="#9b4de0"/>
      <stop offset="1" stop-color="#3a0f6e"/>
    </radialGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffd98a" stop-opacity="0.55"/>
      <stop offset="0.4" stop-color="#d48cff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="flare" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.25" stop-color="#ffe7a8" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffb84d" stop-opacity="0"/>
    </radialGradient>
    {chakra_grads}{filters}
  </defs>"""


def lotus() -> str:
    petals = [
        "M500,690 C420,672 228,562 172,298 C300,330 425,445 500,690 Z",  # exterior
        "M500,690 C430,600 296,430 298,176 C412,250 482,420 500,690 Z",  # medio
        "M500,690 C452,676 372,626 352,540 C428,560 474,612 500,690 Z",  # inferior
    ]
    side = "".join(f'<path d="{p}"/>' for p in petals)
    return f"""
  <g id="lotus" fill="url(#lotus)" stroke="{GOLD}" stroke-width="2.6" stroke-linejoin="round">
    {side}
    <g {MIRROR}>{side}</g>
    <path d="M500,690 C408,560 394,282 500,104 C606,282 592,560 500,690 Z"/>
    <path d="M500,640 C470,540 468,330 500,170 C532,330 530,540 500,640 Z" fill="none" stroke-opacity="0.45" stroke-width="1.4"/>
  </g>"""


def wings() -> str:
    upper = "M488,362 C420,318 300,298 188,310 C126,316 98,346 118,374 C142,404 232,422 332,420 C412,418 462,402 490,386 Z"
    lower = "M490,398 C440,420 342,452 252,480 C186,500 140,530 152,554 C166,580 232,574 302,554 C392,528 452,472 492,418 Z"
    veins = [
        "M488,372 C400,352 280,340 136,352",
        "M488,380 C404,388 302,402 196,410",
        "M470,364 C390,330 300,318 220,314",
        "M490,408 C420,440 320,480 168,540",
        "M490,414 C430,470 360,520 250,560",
        "M486,404 C420,420 330,450 230,482",
    ]
    cross = []
    for i, x in enumerate(range(170, 470, 34)):
        cross.append(f"M{x},{318 + (i % 2) * 6} Q{x+6},{360} {x-4},{410 - (i % 3) * 4}")
    for i, x in enumerate(range(200, 470, 38)):
        cross.append(f"M{x},{470 + (470 - x) * -0.18:.0f} Q{x+10},{500} {x+4},{548 - (x - 200) * 0.12:.0f}")
    vein_paths = "".join(f'<path d="{v}"/>' for v in veins + cross)
    one = f"""
    <path d="{upper}" fill="url(#wingU)"/>
    <path d="{lower}" fill="url(#wingU)"/>
    <g fill="none" stroke="#ffe3a3" stroke-opacity="0.5" stroke-width="1.2">{vein_paths}</g>
    <path d="{upper}" fill="none" stroke="{GOLD}" stroke-width="3"/>
    <path d="{lower}" fill="none" stroke="{GOLD}" stroke-width="3"/>"""
    return f"""
  <g id="wings" stroke-linejoin="round">
    <g>{one}</g>
    <g {MIRROR}>{one}</g>
  </g>"""


def body() -> str:
    ys = [336, 376, 416, 456, 496, 535, 572]
    rs = [22, 21.5, 21, 21, 20, 18.5, 16.5]
    segs = []
    for i, (y, r) in enumerate(zip(ys, rs)):
        segs.append(
            f'<ellipse cx="500" cy="{y}" rx="{r}" ry="{r+1}" fill="url(#ck{i})" stroke="{GOLD}" stroke-width="1.6"/>'
            f'<path d="{hexagram(500, y, r*0.45)}" fill="none" stroke="#fffaf0" stroke-opacity="0.9" stroke-width="1.3"/>'
            f'<circle cx="500" cy="{y}" r="{r*0.62:.1f}" fill="none" stroke="#fffaf0" stroke-opacity="0.55" stroke-width="1"/>'
        )
    return f"""
  <g id="body">
    <path d="M487,586 C491,630 496,670 500,702 C504,670 509,630 513,586 Z" fill="url(#tail)" stroke="{GOLD}" stroke-width="1.5"/>
    {''.join(segs)}
    <circle cx="481" cy="297" r="13" fill="url(#head)" stroke="{GOLD}" stroke-width="2.2"/>
    <circle cx="519" cy="297" r="13" fill="url(#head)" stroke="{GOLD}" stroke-width="2.2"/>
    <circle cx="500" cy="304" r="15" fill="url(#head)" stroke="{GOLD}" stroke-width="2"/>
  </g>"""


def ornaments(seed: int = 7) -> str:
    rnd = random.Random(seed)
    dots = "".join(
        f'<circle cx="500" cy="{y}" r="{2.6 - i*0.12:.2f}" fill="#ffe7a8" fill-opacity="{0.95 - i*0.07:.2f}"/>'
        for i, y in enumerate(range(80, 270, 19))
    )
    dust = []
    import math
    for _ in range(70):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(60, 420)
        x, y = 500 + d * math.cos(a), 500 + d * math.sin(a)
        dust.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rnd.uniform(0.6, 2.0):.2f}" fill="#ffeccc" fill-opacity="{rnd.uniform(0.25, 0.85):.2f}"/>')
    small = "".join(
        f'<path d="{sparkle(x, y, l)}" fill="#fff3d0"/>'
        for x, y, l in [(250, 230, 9), (760, 205, 8), (835, 470, 7), (170, 520, 7), (690, 600, 6), (330, 610, 6)]
    )
    return f"""
  <g id="ornaments">
    <g>{''.join(dust)}</g>
    {dots}
    {small}
  </g>"""


def flares() -> str:
    def flare(x, y, s):
        return (
            f'<circle cx="{x}" cy="{y}" r="{s*1.6}" fill="url(#flare)"/>'
            f'<path d="{sparkle(x, y, s*2.4, s*0.16)}" fill="#fffaf0"/>'
            f'<path d="{sparkle(x, y, s*1.1, s*0.12)}" fill="#ffffff" transform="rotate(45 {x} {y})"/>'
        )
    return flare(500, 56, 26) + flare(500, 944, 16) + flare(508, 826, 14)


def ring() -> str:
    return f"""
  <circle cx="500" cy="500" r="444" fill="none" stroke="url(#ring)" stroke-width="5.5"/>
  <circle cx="500" cy="500" r="444" fill="none" stroke="#fff6dc" stroke-opacity="0.6" stroke-width="1.2"/>"""


def lettering() -> str:
    d = text_path("Volver a Ti", target_width=740, cx=500, baseline=792)
    swash = "M196,842 C330,806 520,846 690,820 C770,808 830,790 872,770 C826,800 764,824 690,834 C520,860 340,826 196,842 Z"
    return f"""
  <g id="wordmark">
    <path d="{swash}" fill="url(#gold)"/>
    <path d="{d}" fill="url(#gold)" stroke="#fff3cf" stroke-opacity="0.35" stroke-width="0.8"/>
  </g>"""


# --------------------------------------------------------------------------
# Composición
# --------------------------------------------------------------------------
def emblem_group(glow: bool) -> str:
    f = ' filter="url(#glow)"' if glow else ""
    sf = ' filter="url(#softglow)"' if glow else ""
    return f"""
  <circle cx="500" cy="420" r="330" fill="url(#halo)"/>
  {ornaments()}
  <g{sf}>{ring()}</g>
  <g{sf}>{lotus()}</g>
  <g{f}>{wings()}</g>
  <g{sf}>{body()}</g>"""


def svg(content: str, glow: bool, view="0 0 1000 1000", w=1000, h=1000) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{w}" height="{h}" role="img" aria-label="Volver a Ti">'
        f"<title>Volver a Ti</title>{defs(glow)}{content}</svg>"
    )


def build_logo(bg: bool, glow: bool, text: bool = True) -> str:
    parts = []
    if bg:
        parts.append('<rect width="1000" height="1000" fill="url(#bg)"/>')
    parts.append(emblem_group(glow))
    if text:
        sf = ' filter="url(#softglow)"' if glow else ""
        parts.append(f"<g{sf}>{lettering()}</g>")
    parts.append(flares())
    return svg("".join(parts), glow)


def build_emblem(glow: bool) -> str:
    """Emblema sin texto (navegación, favicon, marca de agua)."""
    return svg(emblem_group(glow) + flares().split("<circle cx=\"500\" cy=\"944\"")[0], glow, view="60 40 880 720", w=880, h=720)


def build_favicon() -> str:
    """Versión simplificada para 16-48 px: círculo, alas y chakras, sin detalles finos."""
    ys = [336, 376, 416, 456, 496, 535, 572]
    dots = "".join(f'<circle cx="500" cy="{y}" r="22" fill="{c1}"/>' for y, (c1, _) in zip(ys, CHAKRAS))
    up = "M488,362 C420,318 300,298 188,310 C126,316 98,346 118,374 C142,404 232,422 332,420 C412,418 462,402 490,386 Z"
    lo = "M490,398 C440,420 342,452 252,480 C186,500 140,530 152,554 C166,580 232,574 302,554 C392,528 452,472 492,418 Z"
    w = f'<path d="{up}"/><path d="{lo}"/>'
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 40 920 920">'
        '<defs><radialGradient id="b" cx="50%" cy="45%" r="65%"><stop offset="0" stop-color="#43177c"/><stop offset="1" stop-color="#14052e"/></radialGradient></defs>'
        '<circle cx="500" cy="500" r="455" fill="url(#b)" stroke="#f5c66a" stroke-width="22"/>'
        '<path d="M500,690 C408,560 394,282 500,104 C606,282 592,560 500,690 Z" fill="#f5c66a" fill-opacity="0.28" stroke="#f5c66a" stroke-width="10"/>'
        f'<g fill="#b77dff" stroke="#f5c66a" stroke-width="12" stroke-linejoin="round">{w}<g {MIRROR}>{w}</g></g>'
        f'{dots}<path d="M486,586 L500,708 L514,586 Z" fill="#f5c66a"/>'
        '<circle cx="500" cy="300" r="22" fill="#9b4de0" stroke="#f5c66a" stroke-width="6"/>'
        "</svg>"
    )


# --------------------------------------------------------------------------
# Exportación PNG (el resplandor se compone con Pillow: cairo no soporta feGaussianBlur)
# --------------------------------------------------------------------------
def render(svg_text: str, w: int, h: int | None = None) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg_text.encode(), output_width=w, output_height=h)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def add_glow(img: Image.Image, strength: float = 1.0) -> Image.Image:
    s = img.width / 1000
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    for radius, alpha in [(40 * s, 0.55), (14 * s, 0.7), (4 * s, 0.6)]:
        g = img.filter(ImageFilter.GaussianBlur(radius))
        a = g.getchannel("A").point(lambda v: int(min(255, v * alpha * strength * 1.6)))
        g.putalpha(a)
        out = Image.alpha_composite(out, g)
    return Image.alpha_composite(out, img)


def export_pngs(transparent_svg: str) -> None:
    bg_svg = svg('<rect width="1000" height="1000" fill="url(#bg)"/>', False)
    for size, name in [(2048, "logo-2048.png"), (1024, "logo-1024.png")]:
        art = add_glow(render(transparent_svg, size))
        base = render(bg_svg, size)
        Image.alpha_composite(base, art).convert("RGB").save(IMG / name, optimize=True)
    add_glow(render(transparent_svg, 2048)).save(IMG / "logo-transparent-2048.png", optimize=True)

    # Open Graph 1200x630 para compartir la web
    og = render(svg('<rect width="1000" height="1000" fill="url(#bg)"/>', False), 1200, 1200).crop((0, 285, 1200, 915))
    logo = add_glow(render(transparent_svg, 600))
    og.alpha_composite(logo, (300, 15))
    og.convert("RGB").save(IMG / "og-image.jpg", quality=90)

    fav = render(build_favicon(), 512)
    fav.save(IMG / "icon-512.png", optimize=True)
    fav.resize((180, 180), Image.LANCZOS).save(IMG / "apple-touch-icon.png", optimize=True)
    fav.resize((32, 32), Image.LANCZOS).save(IMG / "favicon-32.png", optimize=True)


def main() -> None:
    (IMG / "logo.svg").write_text(build_logo(bg=True, glow=True), encoding="utf-8")
    (IMG / "logo-transparent.svg").write_text(build_logo(bg=False, glow=True), encoding="utf-8")
    (IMG / "emblem.svg").write_text(build_emblem(glow=True), encoding="utf-8")
    (IMG / "favicon.svg").write_text(build_favicon(), encoding="utf-8")
    export_pngs(build_logo(bg=False, glow=False))
    print("Logotipos generados en", IMG)


if __name__ == "__main__":
    main()
