from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class OrderItemCreate(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    unit_price: float
    customizations: Optional[Dict[str, str]] = None


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    special_instructions: Optional[str] = None
    applied_deal_code: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    item_id: str
    item_name: str
    quantity: int
    unit_price: float
    customizations: Optional[Dict[str, str]]

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: Optional[int]
    status: str
    total_amount: float
    discount_amount: float
    customer_name: Optional[str]
    customer_email: Optional[str]
    special_instructions: Optional[str]
    applied_deal_code: Optional[str]
    stripe_payment_id: Optional[str]
    items: List[OrderItemOut]
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str
