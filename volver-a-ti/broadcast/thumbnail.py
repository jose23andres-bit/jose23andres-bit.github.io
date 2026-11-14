"""
VOLVER A TI · Miniatura 1280x720 para YouTube.

Uso: python thumbnail.py <fotograma.png> <salida.jpg> "<línea grande>" "<frase caligráfica>" "<etiqueta>"
Ejemplo: python thumbnail.py frame.png thumb.jpg "MÚSICA 432 Hz" "Respira el bosque" "CALMA LA MENTE"
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).resolve().parent
TOOLS = HERE.parent / "tools"
IMG = HERE.parent / "assets" / "img"
W, H = 1280, 720
GOLD = (245, 198, 106)


def font(name: str, size: int, weight: str | None = None) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(str(TOOLS / name), size)
    if weight:
        try:
            f.set_variation_by_name(weight)
        except Exception:
            pass
    return f


def glow_text(base: Image.Image, xy, text, fnt, fill, glow=(245, 198, 106), radius=14, anchor="la", stroke=0):
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text(xy, text, font=fnt, fill=glow + (255,), anchor=anchor, stroke_width=stroke + 4, stroke_fill=glow + (255,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius))
    base.alpha_composite(Image.eval(layer, lambda v: v) if False else layer)
    d = ImageDraw.Draw(base)
    d.text(xy, text, font=fnt, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=(30, 8, 50, 255))


def main():
    src, dst, big, script, tag = sys.argv[1:6]
    bg = Image.open(src).convert("RGBA").resize((W, H), Image.LANCZOS)
    # Oscurecer el lado izquierdo para que el texto se lea en el móvil
    shade = Image.new("RGBA", (W, H))
    sd = ImageDraw.Draw(shade)
    for x in range(W):
        a = int(max(0, 200 * (1 - x / (W * 0.72))))
        sd.line([(x, 0), (x, H)], fill=(10, 2, 30, a))
    img = Image.alpha_composite(bg, shade)
    # Tapar la marca de agua del fotograma (esquina superior izquierda)
    cover = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(cover).ellipse([-60, -60, 220, 210], fill=(14, 3, 36, 255))
    img.alpha_composite(cover.filter(ImageFilter.GaussianBlur(28)))

    # Logotipo (original si existe) a la derecha
    logo_path = IMG / "logo-original.png"
    logo = Image.open(logo_path if logo_path.exists() else IMG / "logo-transparent-2048.png").convert("RGBA")
    logo = logo.resize((430, 430), Image.LANCZOS)
    if logo_path.exists():
        mask = Image.new("L", logo.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, *logo.size], fill=255)
        logo.putalpha(mask)
    halo = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(halo).ellipse([800, 120, 1260, 580], fill=(245, 198, 106, 90))
    img.alpha_composite(halo.filter(ImageFilter.GaussianBlur(60)))
    img.alpha_composite(logo, (815, 140))

    glow_text(img, (64, 70), tag, font("CormorantGaramond.ttf", 34, "SemiBold"), (245, 198, 106, 255), radius=6)
    lines = big.split("|")
    y = 130
    for ln in lines:
        glow_text(img, (60, y), ln.strip(), font("CormorantGaramond.ttf", 118, "Bold"), (255, 248, 232, 255), radius=16, stroke=2)
        y += 118
    glow_text(img, (66, y + 40), script, font("GreatVibes-Regular.ttf", 92), GOLD + (255,), radius=12)
    d = ImageDraw.Draw(img)
    d.rectangle([64, H - 70, 64 + 120, H - 67], fill=GOLD + (255,))
    d.text((200, H - 68), "VOLVER A TI", font=font("CormorantGaramond.ttf", 30, "SemiBold"), fill=(251, 243, 228, 230), anchor="lm")
    img.convert("RGB").save(dst, quality=92)
    print("miniatura", dst)


if __name__ == "__main__":
    main()
