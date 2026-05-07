"""Generate FlowMate icon — FM Orb (transparent background, gradient ring)."""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, os, sys

# ── Brand colors ──────────────────────────────────────────────────────────────
BLUE   = (0x4F, 0x8E, 0xF7)
VIOLET = (0x7C, 0x5F, 0xF7)
PINK   = (0xF7, 0x5F, 0xBB)
WHITE  = (0xE8, 0xEC, 0xF5)
DARK   = (0x0D, 0x0F, 0x18)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def make_icon(size: int = 1024) -> Image.Image:
    """Render at `size` px; caller scales down for crisp results."""
    C = size // 2                     # center
    ring_r   = int(size * 0.415)      # radius to ring centre-line
    ring_w   = int(size * 0.038)      # ring stroke width
    dot_r    = int(size * 0.028)      # node dot radius
    font_sz  = int(size * 0.335)      # FM font size

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # ── 1. Outer atmospheric glow ─────────────────────────────────────────────
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for i in range(60, 0, -2):
        a = int(55 * (i / 60) ** 2.2)
        r = ring_r + ring_w // 2 + i
        gd.ellipse([C - r, C - r, C + r, C + r], outline=(*BLUE, a), width=2)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.045))
    canvas = Image.alpha_composite(canvas, glow)

    # ── 2. Dark orb body ──────────────────────────────────────────────────────
    body_r = ring_r + ring_w // 2 + 2
    body = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(body)
    bd.ellipse([C - body_r, C - body_r, C + body_r, C + body_r],
               fill=(*DARK, 255))
    # Radial inner-highlight: brighter at top-left
    hl = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hl)
    for i in range(int(body_r * 0.75), 0, -1):
        t = i / (body_r * 0.75)
        a = int(18 * t ** 1.8)
        hd.ellipse([C - i - int(body_r * 0.15), C - i - int(body_r * 0.22),
                    C + i - int(body_r * 0.15), C + i - int(body_r * 0.22)],
                   outline=(255, 255, 255, a), width=1)
    hl = hl.filter(ImageFilter.GaussianBlur(size * 0.015))
    body = Image.alpha_composite(body, hl)
    canvas = Image.alpha_composite(canvas, body)

    # ── 3. Gradient ring ──────────────────────────────────────────────────────
    # Build full-canvas left→right blue→violet gradient
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grd = ImageDraw.Draw(grad)
    for x in range(size):
        t = x / (size - 1)
        c = lerp(BLUE, VIOLET, t)
        grd.line([(x, 0), (x, size)], fill=(*c, 255))

    # Ring mask (donut)
    ring_mask = Image.new("L", (size, size), 0)
    rm = ImageDraw.Draw(ring_mask)
    rm.ellipse([C - ring_r, C - ring_r, C + ring_r, C + ring_r], fill=255)
    rm.ellipse([C - ring_r + ring_w, C - ring_r + ring_w,
                C + ring_r - ring_w, C + ring_r - ring_w], fill=0)

    ring_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ring_img.paste(grad, mask=ring_mask)

    # Glow behind ring
    ring_glow = ring_img.filter(ImageFilter.GaussianBlur(size * 0.022))
    canvas = Image.alpha_composite(canvas, ring_glow)
    canvas = Image.alpha_composite(canvas, ring_img)

    # ── 4. "FM" text ──────────────────────────────────────────────────────────
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    font = next(
        (ImageFont.truetype(fp, font_sz) for fp in font_paths if os.path.exists(fp)),
        ImageFont.load_default()
    )

    # Blue glow behind text
    txt_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tgd = ImageDraw.Draw(txt_glow)
    tgd.text((C, C + int(size * 0.012)), "FM", fill=(*BLUE, 160),
             font=font, anchor="mm")
    txt_glow = txt_glow.filter(ImageFilter.GaussianBlur(size * 0.028))
    canvas = Image.alpha_composite(canvas, txt_glow)

    # Main white text
    draw = ImageDraw.Draw(canvas)
    draw.text((C, C + int(size * 0.012)), "FM", fill=(*WHITE, 255),
              font=font, anchor="mm")

    # ── 5. Three glowing nodes on the ring ───────────────────────────────────
    #   Positions: top, bottom-right, bottom-left (120° apart)
    node_angles_deg = [-90, 30, 150]   # from 3-o'clock, so -90 = top
    node_colors = [BLUE, VIOLET, lerp(BLUE, VIOLET, 0.5)]

    for angle_deg, col in zip(node_angles_deg, node_colors):
        rad = math.radians(angle_deg)
        nx = C + int(ring_r * math.cos(rad))
        ny = C + int(ring_r * math.sin(rad))

        # Node glow
        ng = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ngd = ImageDraw.Draw(ng)
        ngd.ellipse([nx - dot_r * 3, ny - dot_r * 3,
                     nx + dot_r * 3, ny + dot_r * 3],
                    fill=(*col, 200))
        ng = ng.filter(ImageFilter.GaussianBlur(dot_r * 1.4))
        canvas = Image.alpha_composite(canvas, ng)

        # Node dot (white center)
        draw = ImageDraw.Draw(canvas)
        draw.ellipse([nx - dot_r, ny - dot_r, nx + dot_r, ny + dot_r],
                     fill=(255, 255, 255, 255))

    return canvas


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..", "resources")
    os.makedirs(out_dir, exist_ok=True)

    print("Rendering icon at 1024×1024...")
    raw = make_icon(1024)

    # Final 512×512 PNG (LANCZOS downsample for crisp AA)
    icon512 = raw.resize((512, 512), Image.LANCZOS)
    png_path = os.path.join(out_dir, "icon.png")
    icon512.save(png_path, "PNG")
    print(f"  OK {png_path}")

    # ICO with 16, 32, 48, 256 px layers
    ico_path = os.path.join(out_dir, "icon.ico")
    sizes = [16, 32, 48, 256]
    frames = [raw.resize((s, s), Image.LANCZOS) for s in sizes]
    frames[0].save(ico_path, format="ICO",
                   sizes=[(s, s) for s in sizes],
                   append_images=frames[1:])
    print(f"  OK {ico_path}")
    print("Done.")


if __name__ == "__main__":
    main()
