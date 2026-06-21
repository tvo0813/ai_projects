"""
Loads store locations from S3 (locations.csv) or a local fallback.

S3 key:   s3://<MENU_S3_BUCKET>/<store_slug>/locations.csv
Local:    backend/menus/<store_slug>/locations.csv

CSV columns:
  name, address, city, state, zip, country, hours, phone

The full address (address + city + state + zip + country) is used as the
Google Maps query string — paste a real address and Maps will pin it exactly.

Returns [] if neither source exists.
"""

import csv
import io
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)


@dataclass
class Location:
    name: str
    address: str
    city: str
    state: str
    zip: str
    country: str
    hours: Optional[str]
    phone: Optional[str]

    @property
    def full_address(self) -> str:
        return f"{self.address}, {self.city}, {self.state} {self.zip}, {self.country}"

    api_key: str = ""

    def maps_embed_url_keyed(self) -> str:
        """Official Maps Embed API URL — requires a key. Empty string when no key is set."""
        if not self.api_key:
            return ""
        return (
            f"https://www.google.com/maps/embed/v1/place"
            f"?key={self.api_key}&q={quote_plus(self.full_address)}"
        )

    @property
    def maps_embed_url_legacy(self) -> str:
        """Legacy embed URL — no key required, used as fallback."""
        return f"https://maps.google.com/maps?q={quote_plus(self.full_address)}&output=embed"

    @property
    def maps_link_url(self) -> str:
        return f"https://www.google.com/maps/search/?api=1&query={quote_plus(self.full_address)}"


def _parse_csv(content: str, api_key: str = "") -> list[Location]:
    locations = []
    for row in csv.DictReader(io.StringIO(content)):
        name = row.get("name", "").strip()
        address = row.get("address", "").strip()
        if not name or not address:
            continue
        locations.append(Location(
            name=name,
            address=address,
            city=row.get("city", "").strip(),
            state=row.get("state", "").strip(),
            zip=row.get("zip", "").strip(),
            country=row.get("country", "").strip(),
            hours=row.get("hours", "").strip() or None,
            phone=row.get("phone", "").strip() or None,
            api_key=api_key,
        ))
    return locations


def load_locations(store_slug: str, s3_bucket: str = "", aws_region: str = "us-east-1", api_key: str = "") -> list[Location]:
    if s3_bucket:
        try:
            import boto3
            s3 = boto3.client("s3", region_name=aws_region)
            key = f"{store_slug}/locations.csv"
            response = s3.get_object(Bucket=s3_bucket, Key=key)
            content = response["Body"].read().decode("utf-8")
            locations = _parse_csv(content)
            logger.info("Loaded %d locations for '%s' from S3.", len(locations), store_slug)
            return locations
        except Exception as exc:
            logger.warning("Could not load locations from S3 for '%s' — falling back to local. Reason: %s", store_slug, exc)

    local_path = Path(__file__).parent.parent.parent / "menus" / store_slug / "locations.csv"
    if not local_path.exists():
        logger.info("No locations.csv found for '%s' — returning empty list.", store_slug)
        return []

    locations = _parse_csv(local_path.read_text(encoding="utf-8"))
    logger.info("Loaded %d locations for '%s' from local CSV.", len(locations), store_slug)
    return locations
