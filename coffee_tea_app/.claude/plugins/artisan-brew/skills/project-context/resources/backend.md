# Backend — Detailed Reference

## Stack & Versions

| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.111.0 | Web framework |
| uvicorn[standard] | 0.30.1 | ASGI server |
| sqlalchemy | 2.0.30 | ORM |
| alembic | 1.13.1 | DB migrations |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |
| pydantic | 2.7.4 | Data validation |
| pydantic-settings | 2.3.1 | Env var config |
| python-jose[cryptography] | 3.3.0 | JWT |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| stripe | 9.9.0 | Stripe SDK |
| httpx | 0.27.0 | Async HTTP (Square calls) |
| boto3 | 1.34.131 | AWS SDK (DynamoDB) |

## Directory Structure

```
backend/app/
├── __init__.py
├── main.py          — FastAPI app init, CORS middleware, router registration
├── config.py        — Pydantic Settings; all env vars; import: from app.config import settings
├── database.py      — SQLAlchemy engine, SessionLocal, Base, get_db() dependency
├── models/
│   ├── user.py      — User ORM model
│   ├── order.py     — Order + OrderItem ORM models
│   └── deal.py      — Deal + UserDealRedemption ORM models
├── schemas/
│   ├── user.py      — UserCreate, UserLogin, UserOut, Token, TokenData
│   ├── order.py     — OrderCreate, OrderOut, OrderItemOut, OrderStatusUpdate
│   ├── menu.py      — MenuItem, MenuItemCreate, MenuItemUpdate
│   └── deal.py      — DealCreate, DealOut, SpinResult
├── routers/
│   ├── auth.py      — POST /register, POST /login
│   ├── menu.py      — GET|POST|PUT|DELETE /menu/
│   ├── orders.py    — payment-intent, create order, history, status, Stripe webhook
│   ├── deals.py     — spin, validate, list, create, toggle
│   └── users.py     — /me, list users, make-admin
├── services/
│   ├── deal_service.py    — spin logic, code generation, validation, discount calc
│   ├── payment_service.py — Stripe payment intent, webhook verification
│   ├── square_service.py  — Square POS order push
│   └── menu_service.py    — in-memory dict (dev) / DynamoDB (prod)
└── utils/
    └── auth.py      — JWT create/verify, password hash/verify, FastAPI auth dependencies
```

## Authentication Pattern

```python
# In any router that needs auth:
from app.utils.auth import get_current_user, get_current_admin_user

@router.get("/my")
def get_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ...

@router.post("/menu/")
def create_item(data: MenuItemCreate, admin: User = Depends(get_current_admin_user), db: Session = Depends(get_db)):
    ...
```

## Config Access Pattern

```python
from app.config import settings

settings.DATABASE_URL
settings.SECRET_KEY
settings.STRIPE_SECRET_KEY
settings.SQUARE_ACCESS_TOKEN
settings.ENVIRONMENT   # "development" → in-memory menu; anything else → DynamoDB
```

## Service Layer — Key Functions

### deal_service.py
- `generate_deal_code()` → `"BREW-XXXXX"` format, cryptographically secure
- `spin_for_deal(user, db)` → selects deal by `win_probability`, saves `UserDealRedemption`, returns `SpinResult`
- `validate_deal_code(code, db)` → checks exists, not expired, not already redeemed
- `apply_deal_to_order(code, subtotal, db)` → returns `(final_total_cents, discount_cents)`
- `create_deal(data, db)` → persists to DB

### payment_service.py
- `create_payment_intent(amount_cents, currency, metadata)` → Stripe API call, returns `{client_secret, payment_intent_id}`
- `verify_payment(payment_intent_id)` → checks Stripe status
- `verify_webhook(payload, sig_header)` → validates Stripe webhook signature, returns event

### square_service.py
- `push_order_to_pos(order_data)` → async httpx POST to Square `/v2/orders` with line items
- Called automatically on order creation in `routers/orders.py`

### menu_service.py
- `ENVIRONMENT=development`: in-memory Python dict
- Production: boto3 DynamoDB reads/writes to table named by `DYNAMODB_TABLE_MENU` env var (default: `phin-and-beans-menu`)

## CORS Config (main.py)

Allowed origins: `["http://localhost:5173", "http://localhost:3000"]` + `https://{STORE_DOMAIN}` if `STORE_DOMAIN` env var is set

## Order Status State Machine

Valid transitions enforced in `routers/orders.py`:
```
received → brewing
brewing → ready_for_pickup
ready_for_pickup → completed
any → cancelled
```
