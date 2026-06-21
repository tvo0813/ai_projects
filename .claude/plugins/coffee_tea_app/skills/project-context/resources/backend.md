# Backend — Detailed Reference

## Stack

| Package | Version | Purpose |
|---|---|---|
| fastapi | 0.111.0 | Web framework |
| uvicorn[standard] | 0.30.1 | ASGI server |
| pydantic | 2.7.4 | Data validation |
| pydantic-settings | 2.3.1 | Env var config |
| openai | latest | Ollama client (OpenAI-compatible API) |
| stripe | 9.9.0 | Stripe SDK (configured, not in active UI) |
| httpx | 0.27.0 | Async HTTP (Square) |
| boto3 | 1.34.131 | AWS SDK (S3 + DynamoDB) |

> SQLAlchemy, alembic, psycopg2-binary, python-jose, passlib are in requirements.txt for future re-enablement but are not used by active routes.

## Directory Structure

```
backend/app/
├── main.py           — app init, CORS, router registration, StaticFiles mount
├── config.py         — Pydantic Settings; from app.config import settings
├── constants.py      — ORDER_STATUSES list
├── database.py       — engine, SessionLocal, Base, get_db() (unused — no DB deployed)
├── models/           — SQLAlchemy ORM (user.py, order.py, deal.py) — unused
├── schemas/          — Pydantic request/response (user.py, order.py, menu.py, deal.py)
├── routers/
│   ├── menu.py       — GET /api/menu/* (active)
│   ├── deals.py      — GET /api/deals/public only (active)
│   ├── locations.py  — GET /api/locations/ (active)
│   ├── chat.py       — POST /api/chat/ (active)
│   ├── auth.py       — not registered in main.py
│   ├── users.py      — not registered in main.py
│   └── orders.py     — not registered in main.py
├── services/         — all business logic
└── utils/auth.py     — JWT, password hash, FastAPI auth dependencies (unused)
```

## Active Routers in main.py

```python
from .routers import menu, deals, locations, chat

app.include_router(menu.router)
app.include_router(deals.router)
app.include_router(locations.router)
app.include_router(chat.router)
```

No `Base.metadata.create_all()` — no database connection on startup.

## Config (`config.py`)

```python
STORE_NAME, STORE_SLUG, STORE_DOMAIN
SECRET_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID
AWS_REGION, MENU_S3_BUCKET
GOOGLE_MAPS_API_KEY     # blank = legacy Maps embed fallback
DYNAMODB_TABLE_MENU, DYNAMODB_TABLE_DEALS
ENVIRONMENT             # "development" = local CSV + in-memory menu
OLLAMA_BASE_URL         # http://ollama:11434 in Docker
OLLAMA_MODEL            # llama3.2:1b
```

Note: `DATABASE_URL` is in the codebase but not required — no DB is deployed.

## Static Files

`main.py` mounts `StaticFiles` at `/static/images` → `backend/menus/<STORE_SLUG>/images/`. The Vite dev server proxies `/static` to `http://localhost:8000`.

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

### chat.py (router)
- Builds live menu context from in-memory `_menu_db`
- Calls Ollama at `settings.OLLAMA_BASE_URL/v1` using the `openai` Python package with `api_key="ollama"`
- System prompt restricts model to menu discussion only; always lists 3+ drinks with prices; oat milk for extra charge

### menu_service.py
- `ENVIRONMENT=development` → in-memory Python dict loaded from CSV at startup
- Production → boto3 DynamoDB reads/writes to `DYNAMODB_TABLE_MENU`

## CORS

```python
origins = ["http://localhost:5173", "http://localhost:3000"]
if settings.STORE_DOMAIN:
    origins.append(f"https://{settings.STORE_DOMAIN}")
```
