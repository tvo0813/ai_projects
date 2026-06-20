"""
Loads a store's menu from backend/menus/<store_slug>.csv at startup.

CSV columns:
  item_id, name, category, description, price, image_url,
  is_available, tags, customizations

  tags            — pipe-separated:  hot|iced|popular
  customizations  — semicolon-separated key=pipe-values:
                    milk=Whole|Oat|Almond;size=12oz|16oz
  item_id         — leave blank to auto-generate a stable UUID derived
                    from (store_slug, name)
"""

import csv
import hashlib
import uuid
from pathlib import Path
from typing import Dict

from ..schemas.menu import MenuItem


def _stable_id(store_slug: str, name: str) -> str:
    """Deterministic UUID from store + item name so IDs survive restarts."""
    seed = f"{store_slug}:{name}".encode()
    return str(uuid.UUID(bytes=hashlib.md5(seed).digest()))


def _parse_customizations(raw: str) -> Dict[str, list]:
    """'milk=Whole|Oat;size=12oz|16oz'  →  {'milk': ['Whole','Oat'], 'size': ['12oz','16oz']}"""
    if not raw or not raw.strip():
        return {}
    result = {}
    for part in raw.strip().split(";"):
        part = part.strip()
        if "=" not in part:
            continue
        key, _, values = part.partition("=")
        result[key.strip()] = [v.strip() for v in values.split("|") if v.strip()]
    return result


def _parse_tags(raw: str) -> list:
    """'hot|iced|popular'  →  ['hot', 'iced', 'popular']"""
    if not raw or not raw.strip():
        return []
    return [t.strip() for t in raw.split("|") if t.strip()]


def load_menu_from_csv(store_slug: str) -> Dict[str, MenuItem]:
    """
    Reads backend/menus/<store_slug>.csv and returns a dict keyed by item_id.
    Falls back to an empty dict (with a warning) if the file is missing.
    """
    csv_path = Path(__file__).parent.parent.parent / "menus" / f"{store_slug}.csv"

    if not csv_path.exists():
        import logging
        logging.getLogger(__name__).warning(
            "Menu CSV not found for store '%s' at %s — menu will be empty.",
            store_slug, csv_path,
        )
        return {}

    items: Dict[str, MenuItem] = {}

    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["name"].strip()
            if not name:
                continue

            item_id = row.get("item_id", "").strip() or _stable_id(store_slug, name)

            price_raw = row.get("price", "0").strip()
            try:
                price = float(price_raw)
            except ValueError:
                price = 0.0

            is_available_raw = row.get("is_available", "true").strip().lower()
            is_available = is_available_raw not in ("false", "0", "no")

            item = MenuItem(
                item_id=item_id,
                name=name,
                category=row.get("category", "").strip(),
                description=row.get("description", "").strip() or None,
                price=price,
                image_url=row.get("image_url", "").strip() or None,
                is_available=is_available,
                tags=_parse_tags(row.get("tags", "")),
                config_json=_parse_customizations(row.get("customizations", "")),
            )
            items[item_id] = item

    return items
