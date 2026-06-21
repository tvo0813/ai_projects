"""
Loads public deals for a store from S3 (deals.csv) or a local fallback.

S3 key:   s3://<MENU_S3_BUCKET>/<store_slug>/deals.csv
Local:    backend/menus/<store_slug>/deals.csv

CSV columns:
  title, description, discount_type, discount_value, label, expires_at, badge

  discount_type  — percentage | fixed_amount | free_item
  discount_value — numeric (0 for free_item / points deals)
  label          — short human label shown on the card, e.g. "15% off"
  expires_at     — ISO date string or blank (no expiry)
  badge          — short tag shown on the card, e.g. "Daily", "Weekly", "Ongoing"

Returns [] if neither S3 nor local file exists — frontend shows the empty state.
"""

import csv
import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class PublicDeal:
    title: str
    description: str
    discount_type: str
    discount_value: float
    label: str
    expires_at: Optional[str]
    badge: Optional[str]


def _parse_csv(content: str) -> list[PublicDeal]:
    deals = []
    for row in csv.DictReader(io.StringIO(content)):
        title = row.get("title", "").strip()
        if not title:
            continue
        try:
            discount_value = float(row.get("discount_value", "0").strip() or "0")
        except ValueError:
            discount_value = 0.0
        deals.append(PublicDeal(
            title=title,
            description=row.get("description", "").strip(),
            discount_type=row.get("discount_type", "").strip(),
            discount_value=discount_value,
            label=row.get("label", "").strip(),
            expires_at=row.get("expires_at", "").strip() or None,
            badge=row.get("badge", "").strip() or None,
        ))
    return deals


def load_deals(store_slug: str, s3_bucket: str = "", aws_region: str = "us-east-1") -> list[PublicDeal]:
    if s3_bucket:
        try:
            import boto3
            s3 = boto3.client("s3", region_name=aws_region)
            key = f"{store_slug}/deals.csv"
            response = s3.get_object(Bucket=s3_bucket, Key=key)
            content = response["Body"].read().decode("utf-8")
            deals = _parse_csv(content)
            logger.info("Loaded %d deals for '%s' from s3://%s/%s", len(deals), store_slug, s3_bucket, key)
            return deals
        except Exception as exc:
            logger.warning("Could not load deals from S3 for '%s' — falling back to local. Reason: %s", store_slug, exc)

    local_path = Path(__file__).parent.parent.parent / "menus" / store_slug / "deals.csv"
    if not local_path.exists():
        logger.info("No deals.csv found for '%s' — returning empty list.", store_slug)
        return []

    deals = _parse_csv(local_path.read_text(encoding="utf-8"))
    logger.info("Loaded %d deals for '%s' from local CSV.", len(deals), store_slug)
    return deals
