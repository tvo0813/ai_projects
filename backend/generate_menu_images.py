"""
Generate placeholder drink images for all menu items.
Run from the backend/ directory:
    python generate_menu_images.py

Produces:  menus/<slug>/images/<drink_name>.png
Images use category-specific color palettes and elegant typography.
"""

import csv
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# --- Config -----------------------------------------------------------

STORES = ["phin-and-beans", "phin-drips"]

# Each category: (gradient_top, gradient_bottom, text_color, accent)
CATEGORY_PALETTE = {
    "signature": ("#1E3932", "#2E6D5E", "#F2F0EB", "#CBA258"),
    "coffee":    ("#2C1A0E", "#4A2C17", "#F2F0EB", "#CBA258"),
    "matcha":    ("#1A3020", "#2E5C3A", "#F2F0EB", "#D4E9E2"),
    "latte":     ("#3A2410", "#6B3F1E", "#F2F0EB", "#E8C99A"),
    "tea":       ("#1A2C3A", "#2A4A5C", "#F2F0EB", "#90BFD4"),
    "hot":       ("#2C1A0E", "#5C2D0C", "#F2F0EB", "#E8A87C"),
}

DEFAULT_PALETTE = ("#1E3932", "#2E4A3E", "#F2F0EB", "#CBA258")

IMG_W, IMG_H = 600, 400

FONT_PATH_TITLE  = "/System/Library/Fonts/Supplemental/Georgia.ttf"
FONT_PATH_LABEL  = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
FONT_PATH_PRICE  = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"


def slug(name: str) -> str:
    """'Matcha Cream Latte' → 'matcha_cream_latte'"""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def vertical_gradient(draw: ImageDraw.Draw, w: int, h: int, top: str, bottom: str):
    tr, tg, tb = int(top[1:3], 16), int(top[3:5], 16), int(top[5:7], 16)
    br, bg, bb = int(bottom[1:3], 16), int(bottom[3:5], 16), int(bottom[5:7], 16)
    for y in range(h):
        t = y / (h - 1)
        r = int(tr + (br - tr) * t)
        g = int(tg + (bg - tg) * t)
        b = int(tb + (bb - tb) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def hex_to_rgb(h: str, alpha: int = 255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), alpha)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        test = (current + " " + word).strip()
        if font.getlength(test) <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def generate_image(name: str, category: str, price: float, out_path: Path):
    palette = CATEGORY_PALETTE.get(category, DEFAULT_PALETTE)
    top_color, bot_color, text_color, accent_color = palette

    img  = Image.new("RGB", (IMG_W, IMG_H))
    draw = ImageDraw.Draw(img)

    # Gradient background
    vertical_gradient(draw, IMG_W, IMG_H, top_color, bot_color)

    # Subtle grid texture (light lines)
    line_color = hex_to_rgb(accent_color, 18)
    for x in range(0, IMG_W, 40):
        draw.line([(x, 0), (x, IMG_H)], fill=line_color[:3])
    for y in range(0, IMG_H, 40):
        draw.line([(0, y), (IMG_W, y)], fill=line_color[:3])

    # Accent top bar
    bar_h = 5
    accent_rgb = hex_to_rgb(accent_color)[:3]
    draw.rectangle([(0, 0), (IMG_W, bar_h)], fill=accent_rgb)

    # Decorative circle behind name
    cx, cy = IMG_W // 2, IMG_H // 2 - 20
    r = 130
    circle_color = hex_to_rgb(accent_color, 20)[:3]
    draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=circle_color)

    # Fonts
    try:
        font_title = ImageFont.truetype(FONT_PATH_TITLE, 38)
        font_label = ImageFont.truetype(FONT_PATH_LABEL, 18)
        font_price = ImageFont.truetype(FONT_PATH_PRICE, 28)
    except Exception:
        font_title = font_label = font_price = ImageFont.load_default()

    text_rgb  = hex_to_rgb(text_color)[:3]
    accent_rgb_full = hex_to_rgb(accent_color)[:3]

    # Category label (top center)
    cat_label = category.upper()
    label_w = int(font_label.getlength(cat_label))
    draw.text(((IMG_W - label_w) // 2, 28), cat_label, font=font_label, fill=accent_rgb_full)

    # Drink name (wrapped, centered)
    max_text_w = IMG_W - 80
    lines = wrap_text(name, font_title, max_text_w)
    line_h = 48
    total_text_h = len(lines) * line_h
    start_y = cy - total_text_h // 2

    for i, line in enumerate(lines):
        lw = int(font_title.getlength(line))
        x  = (IMG_W - lw) // 2
        y  = start_y + i * line_h
        # Soft shadow
        draw.text((x + 2, y + 2), line, font=font_title, fill=(0, 0, 0))
        draw.text((x, y), line, font=font_title, fill=text_rgb)

    # Price (bottom center)
    price_str = f"${price:.2f}"
    pw = int(font_price.getlength(price_str))
    draw.text(((IMG_W - pw) // 2, IMG_H - 70), price_str, font=font_price, fill=accent_rgb_full)

    # Bottom store name hint
    hint = "Crafted with care"
    hw = int(font_label.getlength(hint))
    hint_color = tuple(min(255, c + 60) for c in hex_to_rgb(text_color)[:3])
    draw.text(((IMG_W - hw) // 2, IMG_H - 36), hint, font=font_label, fill=hint_color)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(out_path), "PNG", optimize=True)
    print(f"  ✓  {out_path.name} ({category})")


def main():
    base = Path(__file__).parent / "menus"

    for store in STORES:
        csv_path = base / store / "menu.csv"
        if not csv_path.exists():
            print(f"  skip {store} — no menu.csv")
            continue

        print(f"\n── {store} ──")
        with open(csv_path, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                name = row["name"].strip()
                if not name:
                    continue
                category = row.get("category", "").strip()
                try:
                    price = float(row.get("price", "0").strip())
                except ValueError:
                    price = 0.0

                out = base / store / "images" / f"{slug(name)}.png"
                generate_image(name, category, price, out)

    print("\nDone.")


if __name__ == "__main__":
    main()
