from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    deal_type = Column(String, nullable=False)  # spin_to_win, flash_sale, loyalty_reward
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    discount_type = Column(String, nullable=False)  # percentage, fixed_amount, free_item
    discount_value = Column(Float, nullable=False)
    win_probability = Column(Float, default=1.0)  # 0.0 to 1.0
    max_redemptions = Column(Integer, nullable=True)
    current_redemptions = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    mechanics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    redemptions = relationship("UserDealRedemption", back_populates="deal")


class UserDealRedemption(Base):
    __tablename__ = "user_deal_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    code_used = Column(String, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)

    user = relationship("User", back_populates="deal_redemptions")
    deal = relationship("Deal", back_populates="redemptions")
