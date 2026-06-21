"""
Loads a store's menu at startup.

Priority:
  1. S3 bucket  — if MENU_S3_BUCKET is set, fetches <store_slug>/menu.csv from that bucket.
  2. Local CSV  — falls back to backend/menus/<store_slug>/menu.csv on any S3 failure.

Image URL resolution per item (derived from item name):
  1. S3 pre-signed URL — s3://<bucket>/<store_slug>/images/<name_slug>.png (3600s expiry)
  2. Local static path — /static/images/<name_slug>.png served by FastAPI StaticFiles
  3. None              — if neither exists (frontend shows placeholder)

CSV columns:
  item_id, name, category, description, price, image_url,
  is_available, tags, customizations

  image_url       — leave blank to auto-resolve from item name
  tags            — pipe-separated:  hot|iced|popular
  customizations  — semicolon-separated key=pipe-values:
                    milk=Whole|Oat|Almond;size=12oz|16oz
  item_id         — leave blank to auto-generate a stable UUID derived
                    from (store_slug, name)
"""

import csv
import hashlib
import io
import logging
import re
import uuid
from pathlib import Path
from typing import Dict, Optional

from ..schemas.menu import MenuItem

logger = logging.getLogger(__name__)


def _stable_id(store_slug: str, name: str) -> str:
    seed = f"{store_slug}:{name}".encode()
    return str(uuid.UUID(bytes=hashlib.md5(seed).digest()))


def _name_slug(name: str) -> str:
    """'Matcha Cream Latte' → 'matcha_cream_latte'"""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _parse_customizations(raw: str) -> Dict[str, list]:
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
    if not raw or not raw.strip():
        return []
    return [t.strip() for t in raw.split("|") if t.strip()]


def _s3_image_url(s3_client, bucket: str, store_slug: str, name: str) -> Optional[str]:
    """Return a pre-signed URL for the item image, or None if it doesn't exist in S3."""
    key = f"{store_slug}/images/{_name_slug(name)}.png"
    try:
        s3_client.head_object(Bucket=bucket, Key=key)
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=3600,
        )
        return url
    except Exception:
        return None


def _local_image_url(store_slug: str, name: str) -> Optional[str]:
    """Return /static/images/<slug>.png if the file exists locally, else None."""
    img_path = (
        Path(__file__).parent.parent.parent
        / "menus" / store_slug / "images" / f"{_name_slug(name)}.png"
    )
    if img_path.exists():
        return f"/static/images/{_name_slug(name)}.png"
    return None


def _resolve_image_url(
    name: str,
    csv_image_url: str,
    store_slug: str,
    s3_client=None,
    s3_bucket: str = "",
) -> Optional[str]:
    """
    Resolve the image URL for a menu item.
    CSV value wins if explicitly set. Otherwise try S3 then local.
    """
    if csv_image_url:
        return csv_image_url

    if s3_client and s3_bucket:
        url = _s3_image_url(s3_client, s3_bucket, store_slug, name)
        if url:
            return url

    return _local_image_url(store_slug, name)


def _parse_csv_content(
    content: str,
    store_slug: str,
    s3_client=None,
    s3_bucket: str = "",
) -> Dict[str, MenuItem]:
    items: Dict[str, MenuItem] = {}
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        name = row["name"].strip()
        if not name:
            continue

        item_id = row.get("item_id", "").strip() or _stable_id(store_slug, name)

        try:
            price = float(row.get("price", "0").strip())
        except ValueError:
            price = 0.0

        is_available_raw = row.get("is_available", "true").strip().lower()
        is_available = is_available_raw not in ("false", "0", "no")

        image_url = _resolve_image_url(
            name=name,
            csv_image_url=row.get("image_url", "").strip(),
            store_slug=store_slug,
            s3_client=s3_client,
            s3_bucket=s3_bucket,
        )

        item = MenuItem(
            item_id=item_id,
            name=name,
            category=row.get("category", "").strip(),
            description=row.get("description", "").strip() or None,
            price=price,
            image_url=image_url,
            is_available=is_available,
            tags=_parse_tags(row.get("tags", "")),
            config_json=_parse_customizations(row.get("customizations", "")),
        )
        items[item_id] = item

    return items


def _load_from_s3(bucket: str, store_slug: str, aws_region: str) -> Optional[Dict[str, MenuItem]]:
    """
    Fetch menu CSV from S3 and resolve image URLs.
    Returns parsed items on success, None on any failure.
    """
    try:
        import boto3
        from botocore.exceptions import BotoCoreError, ClientError

        s3 = boto3.client("s3", region_name=aws_region)
        key = f"{store_slug}/menu.csv"
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response["Body"].read().decode("utf-8")
        items = _parse_csv_content(content, store_slug, s3_client=s3, s3_bucket=bucket)
        logger.info(
            "Loaded %d menu items for '%s' from s3://%s/%s",
            len(items), store_slug, bucket, key,
        )
        return items
    except Exception as exc:
        logger.warning(
            "Could not load menu from s3://%s/%s/menu.csv — falling back to local CSV. Reason: %s",
            bucket, store_slug, exc,
        )
        return None


def _load_from_local(store_slug: str) -> Dict[str, MenuItem]:
    """Read local CSV and resolve image URLs from local images directory."""
    csv_path = Path(__file__).parent.parent.parent / "menus" / store_slug / "menu.csv"

    if not csv_path.exists():
        logger.warning(
            "Menu CSV not found for store '%s' at %s — menu will be empty.",
            store_slug, csv_path,
        )
        return {}

    content = csv_path.read_text(encoding="utf-8")
    items = _parse_csv_content(content, store_slug)
    logger.info("Loaded %d menu items for '%s' from local CSV.", len(items), store_slug)
    return items


def load_menu_from_csv(
    store_slug: str,
    s3_bucket: str = "",
    aws_region: str = "us-east-1",
) -> Dict[str, MenuItem]:
    if s3_bucket:
        result = _load_from_s3(s3_bucket, store_slug, aws_region)
        if result is not None:
            return result

    return _load_from_local(store_slug)
