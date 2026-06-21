from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.deal import Deal
from ..models.user import User
from ..schemas.deal import DealOut, SpinResult, DealCreate, PublicDealOut
from ..services.deal_service import spin_for_deal, validate_deal_code, create_deal
from ..services.deals_loader import load_deals
from ..utils.auth import get_current_active_user, get_admin_user
from ..config import settings

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("/public", response_model=List[PublicDealOut])
def list_public_deals():
    deals = load_deals(settings.STORE_SLUG, s3_bucket=settings.MENU_S3_BUCKET, aws_region=settings.AWS_REGION)
    return [d.__dict__ for d in deals]


@router.post("/spin", response_model=SpinResult)
def spin(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return spin_for_deal(current_user, db)


@router.get("/validate/{code}")
def validate_code(code: str, db: Session = Depends(get_db)):
    deal = validate_deal_code(code, db)
    if not deal:
        raise HTTPException(status_code=404, detail="Invalid or expired deal code")
    return {
        "valid": True,
        "discount_type": deal.discount_type,
        "discount_value": deal.discount_value,
        "title": deal.title,
    }


@router.get("/", response_model=List[DealOut])
def list_deals(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(Deal).all()


@router.post("/", response_model=DealOut)
def create_new_deal(data: DealCreate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return create_deal(data, db)


@router.patch("/{deal_id}/toggle")
def toggle_deal(deal_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.is_active = not deal.is_active
    db.commit()
    return {"id": deal.id, "is_active": deal.is_active}
