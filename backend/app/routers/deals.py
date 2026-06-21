from fastapi import APIRouter
from typing import List
from ..schemas.deal import PublicDealOut
from ..services.deals_loader import load_deals
from ..config import settings

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("/public", response_model=List[PublicDealOut])
def list_public_deals():
    deals = load_deals(settings.STORE_SLUG, s3_bucket=settings.MENU_S3_BUCKET, aws_region=settings.AWS_REGION)
    return [d.__dict__ for d in deals]
