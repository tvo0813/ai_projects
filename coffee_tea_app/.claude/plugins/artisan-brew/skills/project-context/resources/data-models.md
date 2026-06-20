# Data Models — Full Reference

## SQLAlchemy ORM Models

### User (`models/user.py`)
```python
id: int (PK)
email: str (unique, indexed)
hashed_password: str
full_name: str
phone: str | None
is_active: bool = True
is_admin: bool = False
loyalty_points: int = 0
created_at: datetime (server default)
updated_at: datetime (server default, onupdate)

# Relationships
orders: List[Order]
deal_redemptions: List[UserDealRedemption]
```

### Order (`models/order.py`)
```python
id: int (PK)
user_id: int (FK → users.id)
status: str   # "received" | "brewing" | "ready_for_pickup" | "completed" | "cancelled"
total_amount: float
stripe_payment_id: str | None
square_order_id: str | None
customer_name: str
customer_email: str
special_instructions: str | None
applied_deal_code: str | None
discount_amount: float = 0.0
created_at: datetime
updated_at: datetime

# Relationships
user: User
items: List[OrderItem]
deal_redemptions: List[UserDealRedemption]
```

### OrderItem (`models/order.py`)
```python
id: int (PK)
order_id: int (FK → orders.id, cascade delete)
item_id: str
item_name: str
quantity: int
unit_price: float
customizations: dict (JSON column)  # {"size": "large", "milk": "oat", "shots": 2, ...}
created_at: datetime
```

### Deal (`models/deal.py`)
```python
id: int (PK)
code: str (unique, indexed)
deal_type: str       # "spin_to_win" | "flash_sale" | "loyalty_reward"
title: str
description: str
discount_type: str   # "percentage" | "fixed_amount" | "free_item"
discount_value: float   # percent (0-100) or dollar amount
win_probability: float  # 0.0–1.0, used for spin_to_win selection
max_redemptions: int | None
current_redemptions: int = 0
is_active: bool = True
expires_at: datetime | None
mechanics: dict (JSON column)  # arbitrary deal-specific config
created_at: datetime

# Relationships
redemptions: List[UserDealRedemption]
```

### UserDealRedemption (`models/deal.py`)
```python
id: int (PK)
user_id: int (FK → users.id)
deal_id: int (FK → deals.id)
code_used: str
redeemed_at: datetime (server default)
order_id: int | None (FK → orders.id)  # set when order is placed
```

## Pydantic Schemas

### User Schemas (`schemas/user.py`)
- `UserCreate` — email, password, full_name, phone
- `UserLogin` — email, password
- `UserOut` — id, email, full_name, is_admin, loyalty_points, created_at
- `Token` — access_token, token_type="bearer"
- `TokenData` — email (extracted from JWT)

### Order Schemas (`schemas/order.py`)
- `OrderCreate` — items, customer_name, customer_email, special_instructions, deal_code, stripe_payment_id
- `OrderOut` — full order including nested `OrderItemOut` list
- `OrderItemOut` — item_id, item_name, quantity, unit_price, customizations
- `OrderStatusUpdate` — status

### Menu Schemas (`schemas/menu.py`)
- `MenuItem` — id, name, description, price, category, image_url, is_available, customization_options
- `MenuItemCreate` — same fields without id
- `MenuItemUpdate` — all optional fields for partial update

### Deal Schemas (`schemas/deal.py`)
- `DealCreate` — all deal fields
- `DealOut` — full deal including redemption counts
- `SpinResult` — won: bool, deal_code: str | None, message: str, discount_type: str | None, discount_value: float | None
