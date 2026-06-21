from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from ..services.locations_loader import load_locations
from ..config import settings

router = APIRouter(prefix="/api/locations", tags=["locations"])


class LocationOut(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip: str
    country: str
    hours: Optional[str]
    phone: Optional[str]
    full_address: str
    maps_embed_url_keyed: str
    maps_embed_url_legacy: str
    maps_link_url: str


@router.get("/", response_model=List[LocationOut])
def list_locations():
    locs = load_locations(
        settings.STORE_SLUG,
        s3_bucket=settings.MENU_S3_BUCKET,
        aws_region=settings.AWS_REGION,
        api_key=settings.GOOGLE_MAPS_API_KEY,
    )
    return [
        LocationOut(
            name=l.name,
            address=l.address,
            city=l.city,
            state=l.state,
            zip=l.zip,
            country=l.country,
            hours=l.hours,
            phone=l.phone,
            full_address=l.full_address,
            maps_embed_url_keyed=l.maps_embed_url_keyed(),
            maps_embed_url_legacy=l.maps_embed_url_legacy,
            maps_link_url=l.maps_link_url,
        )
        for l in locs
    ]
