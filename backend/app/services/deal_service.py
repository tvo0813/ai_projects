import secrets
import string
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..models.deal import Deal, UserDealRedemption
from ..models.user import User
from ..schemas.deal import SpinResult, DealCreate


def generate_deal_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "BREW-" + "".join(secrets.choice(alphabet) for _ in range(length))


def spin_for_deal(user: User, db: Session) -> SpinResult:
    active_deals = (
        db.query(Deal)
        .filter(
            Deal.is_active == True,
            Deal.deal_type == "spin_to_win",
            (Deal.expires_at == None) | (Deal.expires_at > datetime.utcnow()),
            (Deal.max_redemptions == None) | (Deal.current_redemptions < Deal.max_redemptions),
        )
        .all()
    )

    if not active_deals:
        return SpinResult(won=False, message="No active deals available right now. Check back soon!")

    # Use cryptographically secure random to pick deal based on probability
    random_val = secrets.randbelow(10000) / 10000.0

    cumulative = 0.0
    won_deal: Optional[Deal] = None
    for deal in active_deals:
        cumulative += deal.win_probability
        if random_val <= cumulative:
            won_deal = deal
            break

    if not won_deal:
        return SpinResult(won=False, message="Better luck next time! Spin again tomorrow.")

    unique_code = generate_deal_code()
    redemption = UserDealRedemption(
        user_id=user.id,
        deal_id=won_deal.id,
        code_used=unique_code,
    )
    won_deal.current_redemptions += 1
    db.add(redemption)
    db.commit()

    return SpinResult(
        won=True,
        deal_code=unique_code,
        title=won_deal.title,
        description=won_deal.description,
        discount_type=won_deal.discount_type,
        discount_value=won_deal.discount_value,
        message=f"You won: {won_deal.title}! Use code {unique_code} at checkout.",
    )


def validate_deal_code(code: str, db: Session) -> Optional[Deal]:
    redemption = db.query(UserDealRedemption).filter(UserDealRedemption.code_used == code).first()
    if not redemption:
        return None
    deal = db.query(Deal).filter(Deal.id == redemption.deal_id, Deal.is_active == True).first()
    if not deal:
        return None
    if deal.expires_at and deal.expires_at < datetime.utcnow():
        return None
    if redemption.order_id is not None:
        return None  # already used
    return deal


def apply_deal_to_order(code: str, order_total: float, db: Session) -> tuple[float, float]:
    deal = validate_deal_code(code, db)
    if not deal:
        return order_total, 0.0
    if deal.discount_type == "percentage":
        discount = order_total * (deal.discount_value / 100)
    elif deal.discount_type == "fixed_amount":
        discount = min(deal.discount_value, order_total)
    else:
        discount = 0.0
    return max(0.0, order_total - discount), discount


def create_deal(data: DealCreate, db: Session) -> Deal:
    deal = Deal(
        code=data.code,
        deal_type=data.deal_type,
        title=data.title,
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        win_probability=data.win_probability,
        max_redemptions=data.max_redemptions,
        expires_at=data.expires_at,
        mechanics=data.mechanics,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal
