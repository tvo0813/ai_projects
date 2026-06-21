# Backend — Detailed Reference

## Stack

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
| httpx | 0.27.0 | Async HTTP (Square) |
| boto3 | 1.34.131 | AWS SDK (S3 + DynamoDB) |

## Directory Structure

```
backend/app/
├── main.py           — app init, CORS, router registration, StaticFiles mount
├── config.py         — Pydantic Settings; from app.config import settings
├── constants.py      — ORDER_STATUSES list
├── database.py       — engine, SessionLocal, Base, get_db()
├── models/           — SQLAlchemy ORM (user.py, order.py, deal.py)
├── schemas/          — Pydantic request/response (user.py, order.py, menu.py, deal.py)
├── routers/          — thin HTTP handlers (auth, menu, deals, locations, orders, users)
├── services/         — all business logic
└── utils/auth.py     — JWT, password hash, FastAPI auth dependencies
```

## Config (`config.py`)

```python
STORE_NAME, STORE_SLUG, STORE_DOMAIN
DATABASE_URL, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID
AWS_REGION, MENU_S3_BUCKET
GOOGLE_MAPS_API_KEY     # blank = legacy Maps embed fallback
DYNAMODB_TABLE_MENU, DYNAMODB_TABLE_DEALS
ENVIRONMENT             # "development" = local CSV + in-memory menu
```

## Static Files

`main.py` mounts `StaticFiles` at `/static/images` → `backend/menus/<STORE_SLUG>/images/`. The Vite dev server proxies `/static` to `http://localhost:8000`, so local images are seamlessly accessible in development.

## Authentication Pattern

```python
from app.utils.auth import get_current_active_user, get_admin_user

@router.get("/my")
def get_my_orders(user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    ...

@router.post("/menu/")
def create_item(data: MenuItemCreate, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    ...
```

## Services

### menu_loader.py
- `load_menu(store_slug, s3_bucket, aws_region)` — S3 first, local `backend/menus/<slug>/menu.csv` fallback
- Resolves `image_url` → S3 presigned URL (prod) or `/static/images/<filename>` (local)

### deals_loader.py
- `load_deals(store_slug, s3_bucket, aws_region)` — S3 first, local `deals.csv` fallback; returns `[]` if missing
- Returns `PublicDeal` dataclass instances

### locations_loader.py
- `load_locations(store_slug, s3_bucket, aws_region, api_key)` — S3 first, local fallback
- `Location` dataclass:
  - `maps_embed_url_keyed()` → official Google Maps Embed API URL (requires `api_key`); `""` if no key
  - `maps_embed_url_legacy` property → keyless fallback embed URL
  - `maps_link_url` property → Google Maps search link
  - `full_address` property → `"{address}, {city}, {state} {zip}, {country}"`

### deal_service.py
- `generate_deal_code()` → `"BREW-XXXXX"` (cryptographically secure)
- `spin_for_deal(user, db)` → selects by `win_probability`, returns `SpinResult`
- `validate_deal_code(code, db)` → checks existence, expiry, redemption
- `apply_deal_to_order(code, subtotal, db)` → `(final_total_cents, discount_cents)`

### payment_service.py
- `create_payment_intent(amount_cents, currency, metadata)` → Stripe API
- `verify_webhook(payload, sig_header)` → validates Stripe signature

### square_service.py
- `push_order_to_pos(order_data)` → async httpx POST to Square `/v2/orders`

### menu_service.py
- `ENVIRONMENT=development` → in-memory Python dict loaded from CSV at startup
- Production → boto3 DynamoDB reads/writes to `DYNAMODB_TABLE_MENU`

## CORS

```python
origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.STORE_DOMAIN:
    origins.append(f"https://{settings.STORE_DOMAIN}")
```

## Order Status State Machine

```
received → brewing → ready_for_pickup → completed
any      → cancelled
```

Invalid transitions return HTTP 400. Enforced in `routers/orders.py`.
