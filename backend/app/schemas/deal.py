from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class PublicDealOut(BaseModel):
    title: str
    description: str
    discount_type: str
    discount_value: float
    label: str
    expires_at: Optional[str] = None
    badge: Optional[str] = None


class DealCreate(BaseModel):
    code: str
    deal_type: str
    title: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    win_probability: float = 1.0
    max_redemptions: Optional[int] = None
    expires_at: Optional[datetime] = None
    mechanics: Optional[Dict[str, Any]] = None


class DealOut(BaseModel):
    id: int
    code: str
    deal_type: str
    title: str
    description: Optional[str]
    discount_type: str
    discount_value: float
    is_active: bool
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class SpinResult(BaseModel):
    won: bool
    deal_code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    message: str
