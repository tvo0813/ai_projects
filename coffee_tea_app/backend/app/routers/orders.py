from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.order import Order, OrderItem
from ..models.user import User
from ..schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from ..services.deal_service import apply_deal_to_order
from ..services.payment_service import create_payment_intent, verify_payment, verify_webhook
from ..services.square_service import push_order_to_pos
from ..utils.auth import get_current_active_user, get_admin_user
from ..constants import ORDER_STATUSES

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/payment-intent")
def get_payment_intent(order_data: OrderCreate, db: Session = Depends(get_db)):
    subtotal = sum(item.quantity * item.unit_price for item in order_data.items)
    final_total, discount = subtotal, 0.0
    if order_data.applied_deal_code:
        final_total, discount = apply_deal_to_order(order_data.applied_deal_code, subtotal, db)
    amount_cents = int(final_total * 100)
    intent = create_payment_intent(amount_cents, metadata={"customer": order_data.customer_name or ""})
    return {**intent, "subtotal": subtotal, "discount": discount, "total": final_total}


@router.post("/", response_model=OrderOut)
async def create_order(
    order_data: OrderCreate,
    payment_intent_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if not verify_payment(payment_intent_id):
        raise HTTPException(status_code=400, detail="Payment not confirmed")

    subtotal = sum(item.quantity * item.unit_price for item in order_data.items)
    final_total, discount = subtotal, 0.0
    if order_data.applied_deal_code:
        final_total, discount = apply_deal_to_order(order_data.applied_deal_code, subtotal, db)

    order = Order(
        user_id=current_user.id,
        total_amount=final_total,
        discount_amount=discount,
        stripe_payment_id=payment_intent_id,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        special_instructions=order_data.special_instructions,
        applied_deal_code=order_data.applied_deal_code,
    )
    db.add(order)
    db.flush()

    for item_data in order_data.items:
        item = OrderItem(
            order_id=order.id,
            item_id=item_data.item_id,
            item_name=item_data.item_name,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            customizations=item_data.customizations,
        )
        db.add(item)

    db.commit()
    db.refresh(order)

    await push_order_to_pos({
        "order_id": order.id,
        "items": [{"item_name": i.item_name, "quantity": i.quantity, "unit_price": i.unit_price} for i in order.items],
    })

    return order


@router.get("/my", response_model=List[OrderOut])
def get_my_orders(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()


@router.get("/", response_model=List[OrderOut])
def list_all_orders(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).limit(100).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if status_update.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {ORDER_STATUSES}")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    event = verify_webhook(payload, sig_header)
    if not event:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")
    if event["type"] == "payment_intent.succeeded":
        payment_intent_id = event["data"]["object"]["id"]
        order = db.query(Order).filter(Order.stripe_payment_id == payment_intent_id).first()
        if order and order.status == "received":
            order.status = "brewing"
            db.commit()
    return {"status": "ok"}
