"""Generate FlowMate icon — Enhanced FM Orb with hexagram web."""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math, os

# Brand colors
BLUE   = (0x4F, 0x8E, 0xF7)
VIOLET = (0x7C, 0x5F, 0xF7)
WHITE  = (0xE8, 0xEC, 0xF5)
DARK   = (0x0B, 0x0D, 0x16)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def h_gradient_canvas(size, c1=BLUE, c2=VIOLET):
    """Full-canvas left-to-right gradient."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d   = ImageDraw.Draw(img)
    for x in range(size):
        col = lerp(c1, c2, x / (size - 1))
        d.line([(x, 0), (x, size)], fill=(*col, 255))
    return img


def ring_layer(size, cx, cy, r, w, grad_img, opacity=1.0):
    """Paste a donut-shaped slice of grad_img onto a transparent canvas."""
    mask = Image.new("L", (size, size), 0)
    md   = ImageDraw.Draw(mask)
    md.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    md.ellipse([cx - r + w, cy - r + w, cx + r - w, cy + r - w], fill=0)
    if opacity < 1.0:
        mask = mask.point(lambda p: int(p * opacity))
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(grad_img, mask=mask)
    return layer


def get_font(size):
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/calibrib.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def pts_on_circle(cx, cy, r, angles_deg):
    return [
        (cx + r * math.cos(math.radians(a)),
         cy + r * math.sin(math.radians(a)))
        for a in angles_deg
    ]


def draw_line_aa(canvas, x1, y1, x2, y2, color, width, blur=1.2):
    """Anti-aliased line via a blurred separate layer."""
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.line([(x1, y1), (x2, y2)], fill=color, width=width)
    if blur > 0:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(canvas, layer)


def make_icon(size: int = 1024) -> Image.Image:
    C = size // 2

    # Geometry (all in proportional units)
    ring_r  = int(size * 0.415)    # outer ring radius
    ring_w  = int(size * 0.040)    # outer ring width
    inner_r = int(size * 0.255)    # inner ring radius
    inner_w = int(size * 0.007)    # inner ring width
    dot_r   = int(size * 0.030)    # outer node dot
    idot_r  = int(size * 0.016)    # inner node dot
    font_sz = int(size * 0.335)    # FM font size
    lw_tri  = int(size * 0.007)    # triangle line width
    lw_spk  = int(size * 0.004)    # spoke line width

    # Outer nodes: top, bottom-right, bottom-left (upward triangle ▲)
    outer_pts = pts_on_circle(C, C, ring_r,  [-90, 30, 150])
    # Inner nodes: top-right, bottom-center, top-left (downward triangle ▽)
    inner_pts = pts_on_circle(C, C, inner_r, [-30, 90, 210])

    grad = h_gradient_canvas(size)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    # ── 1. Wide atmospheric glow behind the orb ───────────────────────────────
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd   = ImageDraw.Draw(glow)
    for i in range(80, 0, -2):
        a = int(55 * (i / 80) ** 2.8)
        r = ring_r + ring_w // 2 + i
        gd.ellipse([C - r, C - r, C + r, C + r], outline=(*BLUE, a), width=2)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.060))
    canvas = Image.alpha_composite(canvas, glow)

    # Violet secondary glow (offset slightly)
    glow2 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    g2d   = ImageDraw.Draw(glow2)
    off   = int(size * 0.04)
    for i in range(50, 0, -2):
        a = int(35 * (i / 50) ** 2.5)
        r = ring_r + ring_w // 2 + i
        g2d.ellipse([C - r + off, C - r + off, C + r + off, C + r + off],
                    outline=(*VIOLET, a), width=2)
    glow2 = glow2.filter(ImageFilter.GaussianBlur(size * 0.055))
    canvas = Image.alpha_composite(canvas, glow2)

    # ── 2. Dark orb body ──────────────────────────────────────────────────────
    orb_r = ring_r + ring_w // 2 + 3
    body  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd    = ImageDraw.Draw(body)
    bd.ellipse([C - orb_r, C - orb_r, C + orb_r, C + orb_r], fill=(*DARK, 255))
    # Soft highlight toward top-left (gives 3-D "lit" feel)
    hl   = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd   = ImageDraw.Draw(hl)
    hox, hoy = int(size * 0.06), int(size * 0.09)
    for i in range(int(orb_r * 0.72), 0, -3):
        t = i / (orb_r * 0.72)
        a = int(14 * t ** 2.2)
        hd.ellipse([C - i - hox, C - i - hoy, C + i - hox, C + i - hoy],
                   outline=(255, 255, 255, a), width=2)
    hl   = hl.filter(ImageFilter.GaussianBlur(size * 0.012))
    body = Image.alpha_composite(body, hl)
    canvas = Image.alpha_composite(canvas, body)

    # ── 3. Outer gradient ring + glow ────────────────────────────────────────
    outer_ring = ring_layer(size, C, C, ring_r, ring_w, grad)
    ring_glow  = outer_ring.filter(ImageFilter.GaussianBlur(size * 0.022))
    canvas = Image.alpha_composite(canvas, ring_glow)
    canvas = Image.alpha_composite(canvas, outer_ring)

    # ── 4. Outer triangle (▲ connecting the 3 outer nodes) ───────────────────
    for i in range(3):
        x1, y1 = outer_pts[i]
        x2, y2 = outer_pts[(i + 1) % 3]
        canvas = draw_line_aa(canvas, x1, y1, x2, y2,
                              (200, 220, 255, 35), lw_tri, blur=size * 0.004)

    # ── 5. Inner gradient ring ────────────────────────────────────────────────
    inner_ring = ring_layer(size, C, C, inner_r, inner_w, grad, opacity=0.45)
    i_glow     = inner_ring.filter(ImageFilter.GaussianBlur(size * 0.010))
    canvas = Image.alpha_composite(canvas, i_glow)
    canvas = Image.alpha_composite(canvas, inner_ring)

    # ── 6. Inner triangle (▽ connecting the 3 inner nodes) ───────────────────
    for i in range(3):
        x1, y1 = inner_pts[i]
        x2, y2 = inner_pts[(i + 1) % 3]
        canvas = draw_line_aa(canvas, x1, y1, x2, y2,
                              (160, 180, 255, 28), lw_tri, blur=size * 0.003)

    # ── 7. Spokes: each outer node to its two adjacent inner nodes ────────────
    # outer[0]↔inner[0], outer[0]↔inner[2]
    # outer[1]↔inner[0], outer[1]↔inner[1]
    # outer[2]↔inner[1], outer[2]↔inner[2]
    spoke_pairs = [(0, 0), (0, 2), (1, 0), (1, 1), (2, 1), (2, 2)]
    for oi, ii in spoke_pairs:
        x1, y1 = outer_pts[oi]
        x2, y2 = inner_pts[ii]
        canvas = draw_line_aa(canvas, x1, y1, x2, y2,
                              (140, 170, 255, 22), lw_spk, blur=size * 0.002)

    # ── 8. Tiny tick marks around the inner ring ──────────────────────────────
    # 24 marks every 15°; skip the 6 node positions
    node_angles = {-30, 90, 210, -90, 30, 150}
    tick_layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    td = ImageDraw.Draw(tick_layer)
    tick_in  = inner_r - int(size * 0.025)
    tick_out = inner_r + int(size * 0.025)
    for deg in range(0, 360, 15):
        # Normalise to match node_angles set
        norm = deg if deg <= 180 else deg - 360
        if norm in node_angles or (norm + 360) in node_angles:
            continue
        rad = math.radians(deg)
        xi1 = C + int(tick_in  * math.cos(rad))
        yi1 = C + int(tick_in  * math.sin(rad))
        xi2 = C + int(tick_out * math.cos(rad))
        yi2 = C + int(tick_out * math.sin(rad))
        td.line([(xi1, yi1), (xi2, yi2)], fill=(255, 255, 255, 35),
                width=max(1, int(size * 0.003)))
    tick_layer = tick_layer.filter(ImageFilter.GaussianBlur(size * 0.002))
    canvas = Image.alpha_composite(canvas, tick_layer)

    # ── 9. "FM" text — centered exactly ──────────────────────────────────────
    font = get_font(font_sz)

    # Blue glow under text
    tg  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tgd = ImageDraw.Draw(tg)
    tgd.text((C, C), "FM", fill=(*BLUE, 160), font=font, anchor="mm")
    tg  = tg.filter(ImageFilter.GaussianBlur(size * 0.030))
    canvas = Image.alpha_composite(canvas, tg)

    # Second, wider violet glow
    tg2  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    tgd2 = ImageDraw.Draw(tg2)
    tgd2.text((C, C), "FM", fill=(*VIOLET, 100), font=font, anchor="mm")
    tg2  = tg2.filter(ImageFilter.GaussianBlur(size * 0.055))
    canvas = Image.alpha_composite(canvas, tg2)

    # Crisp white text
    draw = ImageDraw.Draw(canvas)
    draw.text((C, C), "FM", fill=(*WHITE, 255), font=font, anchor="mm")

    # ── 10. Outer node dots + halos ──────────────────────────────────────────
    node_cols = [BLUE, lerp(BLUE, VIOLET, 0.5), VIOLET]
    for (px, py), col in zip(outer_pts, node_cols):
        nx, ny = int(px), int(py)
        # Wide colour halo
        ng  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ngd = ImageDraw.Draw(ng)
        ngd.ellipse([nx - dot_r*4, ny - dot_r*4,
                     nx + dot_r*4, ny + dot_r*4], fill=(*col, 190))
        ng  = ng.filter(ImageFilter.GaussianBlur(dot_r * 1.8))
        canvas = Image.alpha_composite(canvas, ng)
        # White dot centre
        draw = ImageDraw.Draw(canvas)
        draw.ellipse([nx - dot_r, ny - dot_r, nx + dot_r, ny + dot_r],
                     fill=(255, 255, 255, 255))
        # Tiny bright highlight on dot
        draw.ellipse([nx - dot_r//2, ny - dot_r//2,
                      nx - dot_r//5, ny - dot_r//5],
                     fill=(255, 255, 255, 200))

    # ── 11. Inner node dots ───────────────────────────────────────────────────
    icols = [lerp(BLUE, VIOLET, t) for t in [0.25, 0.75, 0.5]]
    for (px, py), col in zip(inner_pts, icols):
        nx, ny = int(px), int(py)
        ng  = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ngd = ImageDraw.Draw(ng)
        ngd.ellipse([nx - idot_r*3, ny - idot_r*3,
                     nx + idot_r*3, ny + idot_r*3], fill=(*col, 180))
        ng  = ng.filter(ImageFilter.GaussianBlur(idot_r * 1.2))
        canvas = Image.alpha_composite(canvas, ng)
        draw = ImageDraw.Draw(canvas)
        draw.ellipse([nx - idot_r, ny - idot_r, nx + idot_r, ny + idot_r],
                     fill=(*col, 230))

    return canvas


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "resources")
    os.makedirs(out, exist_ok=True)

    print("Rendering FlowMate icon at 1024x1024...")
    raw = make_icon(1024)

    png = os.path.join(out, "icon.png")
    raw.resize((512, 512), Image.LANCZOS).save(png, "PNG")
    print("  Saved:", png)

    ico = os.path.join(out, "icon.ico")
    sizes = [16, 32, 48, 256]
    frames = [raw.resize((s, s), Image.LANCZOS) for s in sizes]
    frames[0].save(ico, format="ICO",
                   sizes=[(s, s) for s in sizes],
                   append_images=frames[1:])
    print("  Saved:", ico)
    print("Done.")


if __name__ == "__main__":
    main()
