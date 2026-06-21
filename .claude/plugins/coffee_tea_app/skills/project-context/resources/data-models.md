# Data Models — Full Reference

> **Current state:** No database is deployed. SQLAlchemy models exist in the codebase for future re-enablement but are not used by any active route. All data is served from per-store CSV files.

## CSV-Backed Data (active)

### Menu Item (from `menu.csv`)
```
item_id, name, category, description, price, image_url, is_available, tags, customizations
```
- `tags` — pipe-separated: `hot|iced|popular|signature|coffee|matcha|latte|tea`
- `customizations` — `key=opt1|opt2;key2=opt1|opt2` e.g. `milk=Whole|Oat|Almond;size=12oz|16oz`
- `item_id` — leave blank; UUID derived from `(store_slug + name)` so IDs survive restarts

### Public Deal (from `deals.csv`)
```
title, description, discount_type, discount_value, label, expires_at, badge
```
- `discount_type` — `percentage` | `fixed_amount` | `free_item`
- `badge` — `green` | `gold` | `red` | `gray`

### Location (from `locations.csv`)
```
name, address, city, state, zip, country, hours, phone
```

## Pydantic Schemas (active)

### Menu Schemas (`schemas/menu.py`)
- `MenuItem` — id, name, description, price, category, image_url, is_available, customization_options
- `MenuItemCreate` — same fields without id
- `MenuItemUpdate` — all optional fields for partial update

### Deal Schemas (`schemas/deal.py`)
- `PublicDealOut` — title, description, discount_type, discount_value, label, expires_at, badge

---

## SQLAlchemy ORM Models (inactive — no DB deployed)

These exist in `backend/app/models/` and can be re-enabled by adding RDS to Terraform and registering the auth/users/orders routers in `main.py`.

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
created_at: datetime
updated_at: datetime
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
```

### OrderItem (`models/order.py`)
```python
id: int (PK)
order_id: int (FK → orders.id, cascade delete)
item_id: str
item_name: str
quantity: int
unit_price: float
customizations: dict (JSON)   # {"size": "large", "milk": "oat"}
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
discount_value: float
win_probability: float  # 0.0–1.0 for spin_to_win
max_redemptions: int | None
current_redemptions: int = 0
is_active: bool = True
expires_at: datetime | None
mechanics: dict (JSON)
created_at: datetime
```

## Order Status State Machine (inactive)

```
received → brewing → ready_for_pickup → completed
any      → cancelled
```

Invalid transitions return HTTP 400. Enforced in `routers/orders.py`.
