"""
Fetch real drink photos from DuckDuckGo image search.
Run from backend/:
    python fetch_menu_images.py

Downloads the best image for each menu item and saves to:
    menus/<slug>/images/<drink_slug>.png  (600x400, cropped center)

Skips items that already have an image. Re-run to fill gaps.
"""

import csv
import re
import time
import warnings
from io import BytesIO
from pathlib import Path

import requests
try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS
from PIL import Image

warnings.filterwarnings("ignore")

STORES = ["phin-and-beans", "phin-drips"]
IMG_W, IMG_H = 600, 400
REQUEST_TIMEOUT = 8
DELAY_BETWEEN_SEARCHES = 3.0  # seconds — avoid rate limiting

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

# Per-item search queries — override generic search for ambiguous names
SEARCH_OVERRIDES: dict[str, str] = {
    "Marble Drip":               "Vietnamese phin coffee condensed milk iced drink",
    "Egg Cream Coffee":          "Vietnamese egg coffee ca phe trung drink",
    "Ube Cream Coffee":          "ube cream coffee Vietnamese drink purple",
    "Matcha Cream Coffee":       "matcha cold foam Vietnamese iced coffee drink",
    "Einspanner Cream Coffee":   "einspanner whipped cream iced coffee drink",
    "Coconut Blended Coffee":    "coconut blended Vietnamese iced coffee drink",
    "Vietnamese Coffee":         "ca phe sua da Vietnamese iced coffee condensed milk",
    "Cafe Latte":                "iced cafe latte coffee milk drink",
    "Cold Brew":                 "black cold brew coffee iced drink glass",
    "Sweet Cream Cold Brew":     "sweet cream cold foam cold brew coffee drink",
    "Matcha Latte":              "matcha latte green tea milk drink",
    "Iced Matcha":               "iced matcha green tea latte drink glass",
    "Matcha Cream Latte":        "matcha cold foam latte coffee drink",
    "Einspanner Latte":          "einspanner whipped cream latte coffee drink",
    "Banana Latte":              "banana latte coffee drink",
    "Ube Latte":                 "ube latte purple yam milk drink",
    "Sesame Latte":              "black sesame latte coffee drink",
    "Strawberry Cream Oat Latte":"strawberry cream latte oat milk drink",
    "Jasmine Milk Tea":          "jasmine milk tea boba drink",
    "Taro Milk Tea":             "taro milk tea boba bubble tea drink",
    "Thai Tea":                  "Thai iced tea condensed milk orange drink",
    "Peach Green Tea":           "peach green tea iced drink glass",
    "Hot Vietnamese Coffee":     "hot Vietnamese phin coffee condensed milk cup",
    "Hot Latte":                 "hot latte coffee cup cafe",
    "Hot Matcha":                "hot matcha latte green tea cup",
    "Hot Americano":             "hot americano black coffee cup",
    "Ca Phe Trung":              "Vietnamese egg coffee ca phe trung Hanoi",
    "Pandan Cream Coffee":       "pandan green cream iced coffee drink",
    "Ca Phe Sua Da":             "ca phe sua da Vietnamese iced coffee condensed milk",
    "Coconut Cold Brew":         "coconut cold brew coffee iced drink",
    "Pandan Latte":              "pandan latte green milk drink",
    "Sesame Cream Coffee":       "black sesame cream iced coffee drink",
    "Sweet Cream Cold Brew":     "sweet cream cold foam cold brew coffee",
}


def slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def crop_center(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Scale then center-crop to target dimensions."""
    ratio = max(target_w / img.width, target_h / img.height)
    new_w = int(img.width * ratio)
    new_h = int(img.height * ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top  = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def download_image(url: str) -> Image.Image | None:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type and not url.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            return None
        img = Image.open(BytesIO(resp.content)).convert("RGB")
        return img
    except Exception:
        return None


def fetch_image(name: str) -> Image.Image | None:
    query = SEARCH_OVERRIDES.get(name, f"{name} drink coffee shop")
    results = []
    for attempt in range(3):
        try:
            results = list(DDGS().images(query, max_results=8))
            break
        except Exception as e:
            wait = (attempt + 1) * 8
            print(f"\n    rate limit, waiting {wait}s... ", end="", flush=True)
            time.sleep(wait)
    if not results:
        return None

    for result in results:
        url = result.get("image", "")  # "image" is the direct image URL; "url" is the page URL
        if not url:
            continue
        img = download_image(url)
        if img and img.width >= 300 and img.height >= 200:
            return img

    return None


def process_store(store: str):
    base  = Path(__file__).parent / "menus" / store
    csv_path = base / "menu.csv"
    if not csv_path.exists():
        print(f"  skip {store} — no menu.csv")
        return

    print(f"\n{'─'*50}")
    print(f"  {store}")
    print(f"{'─'*50}")

    with open(csv_path, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r["name"].strip()]

    for row in rows:
        name = row["name"].strip()
        out  = base / "images" / f"{slug(name)}.png"

        if out.exists():
            print(f"  skip  {name} (already exists)")
            continue

        print(f"  fetch {name} ...", end=" ", flush=True)
        img = fetch_image(name)

        if img:
            img = crop_center(img, IMG_W, IMG_H)
            out.parent.mkdir(parents=True, exist_ok=True)
            img.save(str(out), "PNG", optimize=True)
            print(f"saved ({img.width}x{img.height})")
        else:
            print("no image found — keeping placeholder")

        time.sleep(DELAY_BETWEEN_SEARCHES)


def main():
    for store in STORES:
        process_store(store)
    print("\nDone.")


if __name__ == "__main__":
    main()
