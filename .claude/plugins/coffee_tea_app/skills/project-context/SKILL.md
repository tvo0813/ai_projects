---
name: coffee-tea-app-context
description: Load this skill when working on any feature, bug fix, or question about this multi-store coffee & tea shop app. Covers full-stack architecture, data models, service layer, auth, integrations, store config system, and development workflow.
version: 1.2.0
---

# Coffee & Tea Shop App — Project Context

## What This App Is

A multi-store coffee & tea shop ordering platform. The same codebase powers multiple stores (e.g. "Phin and Beans", "Phin Drip") via environment variables — no code changes needed to launch a new store. Customers browse a menu, spin a deals wheel, add items to cart with customizations, pay via Stripe, and track orders. Admins manage the menu, view live orders, update statuses, and create deals.

**Stack:**
- Frontend: React 18 + Vite + TypeScript + Zustand + Axios + Framer Motion + Stripe Elements
- Backend: Python FastAPI + SQLAlchemy 2 + Alembic + PostgreSQL 16
- External: Stripe (payments), Square POS (order sync), AWS DynamoDB (prod menu storage)
- Dev: Docker Compose (db + backend + frontend all containerised)

---

## Running the App

```bash
# Full stack (recommended)
cp backend/.env.example backend/.env   # fill in keys
docker compose up

# Frontend only
cd frontend && npm install && npm run dev   # http://localhost:5173 (uses frontend/.env)

# Backend only
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload             # http://localhost:8000

# DB migrations
cd backend && alembic upgrade head
alembic revision --autogenerate -m "description"
```

URLs: Frontend → 5173, Backend API → 8000, Swagger → http://localhost:8000/api/docs

---

## Multi-Store System

**Active stores:** `phin-and-beans` (Phin and Beans), `phin-drips` (Phin Drips)
**Registry:** `stores/stores.json` — source of truth for all store slugs, names, domains, DB names

### Local dev — pick a store
```bash
docker compose --env-file stores/phin-and-beans.env up
docker compose --env-file stores/phin-drips.env up
```

### Per-store env files (`stores/<slug>.env`)

| Variable | Layer | Purpose |
|---|---|---|
| `STORE_NAME` | Backend | API title, Square idempotency key prefix |
| `STORE_DOMAIN` | Backend | CORS allowed origin; blank = skip |
| `STORE_TAGLINE` | Frontend (Docker) | Hero tagline passed as `VITE_STORE_TAGLINE` |
| `VITE_STORE_NAME` | Frontend build | Baked in at `npm run build` |
| `VITE_STORE_TAGLINE` | Frontend build | Baked in at `npm run build` |
| `POSTGRES_DB` | Docker/DB | PostgreSQL database name |
| `DYNAMODB_TABLE_MENU` | Backend | DynamoDB menu table (prod) |
| `DYNAMODB_TABLE_DEALS` | Backend | DynamoDB deals table (prod) |

Frontend components read store identity from `frontend/src/config/store.ts` — always import from there, never hardcode.

### Terraform layout (fully isolated per store × env)
```
terraform/envs/
├── phin-and-beans/dev/   VPC: 10.0.0.0/16   state: phin-and-beans/dev/terraform.tfstate
├── phin-and-beans/prod/  VPC: 10.1.0.0/16   state: phin-and-beans/prod/terraform.tfstate
├── phin-drips/dev/       VPC: 10.2.0.0/16   state: phin-drips/dev/terraform.tfstate
└── phin-drips/prod/      VPC: 10.3.0.0/16   state: phin-drips/prod/terraform.tfstate
```
Each env has its own VPC, RDS, ECS service, Secrets Manager secret, S3 bucket, and CloudFront distribution. All use the same single backend ECR image — store identity is injected via env vars at ECS task startup.

### Adding a new store
1. Add entry to `stores/stores.json`
2. Create `stores/<slug>.env`
3. Copy `terraform/envs/phin-drips/` → `terraform/envs/<slug>/`, update locals + VPC CIDRs + state key + db_name
4. Add store to `matrix` in both `deploy-dev` and `deploy-prod` jobs in `.github/workflows/ci-cd.yml`
5. Add GitHub secrets using pattern `DEV_{PREFIX}_*` / `PROD_{PREFIX}_*`

---

## Request Flow

```
Browser (React SPA)
  → Axios (JWT injected from useAuthStore.getState().token via interceptor in api/client.ts)
  → Vite proxy /api → http://localhost:8000  (dev only)
  → FastAPI routers  (backend/app/routers/)
  → Services         (backend/app/services/)
  → SQLAlchemy ORM   (backend/app/models/)
  → PostgreSQL
       ↳ Stripe API  (payment_service.py)
       ↳ Square API  (square_service.py)
```

---

## Frontend Architecture

See `resources/frontend.md` for full detail. Key points:

- **`config/store.ts`** — single import for `STORE_NAME` + `STORE_TAGLINE`; use in any component that needs store identity
- **`constants/orderStatus.ts`** — `ORDER_STATUSES`, `ORDER_STATUS_COLORS`, `ORDER_STATUS_LABELS`
- **Pages** live in `frontend/src/pages/` — route-level components
- **Stores** in `frontend/src/store/` — Zustand persisted to localStorage:
  - `useAuthStore` — user object + JWT token; Zustand `persist` handles localStorage (no manual calls)
  - `useCartStore` — items, customizations, applied deal code + discount
- **API clients** in `frontend/src/api/`:
  - `client.ts` — Axios base instance; reads token via `useAuthStore.getState().token`; 401 → calls `logout()` + redirect to `/login`
  - `auth.ts`, `menu.ts`, `orders.ts`, `deals.ts` — domain-specific endpoints with TypeScript types
- **Components** in `frontend/src/components/` by domain: `layout/` (Navbar + Footer), `menu/`, `cart/`, `deals/`
- **Design system** — Starbucks-inspired: `--green-dark` (#1E3932) headers/hero, `--green` (#00704A) primary CTAs, `--gold` for loyalty, `--cream` page background, white cards. See `resources/frontend.md` for full token list.
- **Footer** — `components/layout/Footer.tsx` — minimal single-row layout (copyright left, nav links right). Davien-style: no heavy decoration, just text links and copyright.

---

## Backend Architecture

See `resources/backend.md` for full detail. Key points:

- `backend/app/main.py` — FastAPI app, CORS (origins built from config), router registration
- `backend/app/config.py` — All env vars via Pydantic `Settings`; import as `from app.config import settings`
- `backend/app/constants.py` — `ORDER_STATUSES` list; used by orders router for validation
- `backend/app/database.py` — SQLAlchemy engine + `get_db` dependency
- **Routers** (`backend/app/routers/`) — thin handlers only; auth via `get_current_active_user` (user) / `get_admin_user` (admin) from `utils/auth.py`
- **Services** (`backend/app/services/`) — all business logic here; `menu_service.py` is the DynamoDB implementation for production
- **Models** (`backend/app/models/`) — SQLAlchemy ORM (the DB schema)
- **Schemas** (`backend/app/schemas/`) — Pydantic request/response models; kept separate from ORM models

### Menu storage
- `ENVIRONMENT=development` → `routers/menu.py` loads from `backend/menus/<STORE_SLUG>.csv` via `services/menu_loader.py` into an in-memory dict at startup
- Production → wire `menu_service.py` DynamoDB functions into the router
- CSV format: `item_id,name,category,description,price,image_url,is_available,tags,customizations`
  - `tags` pipe-separated: `hot|iced|popular`
  - `customizations` key=values: `milk=Whole|Oat;size=12oz|16oz`
  - blank `item_id` → stable UUID derived from (store_slug + name), survives restarts

---

## Data Models

See `resources/data-models.md` for full schemas. Quick reference:

| Model | Key Fields |
|---|---|
| `User` | email, hashed_password, is_admin, loyalty_points |
| `Order` | status, total_amount, stripe_payment_id, square_order_id, applied_deal_code, discount_amount |
| `OrderItem` | item_id, item_name, quantity, unit_price, customizations (JSON) |
| `Deal` | code, deal_type, discount_type, discount_value, win_probability, max_redemptions |
| `UserDealRedemption` | user_id, deal_id, code_used, order_id |

**Order status flow:** `received → brewing → ready_for_pickup → completed | cancelled`

**Deal types:** `spin_to_win`, `flash_sale`, `loyalty_reward`
**Discount types:** `percentage`, `fixed_amount`, `free_item`

---

## Authentication

JWT-based, stateless.
- Token issued at login/register, stored in Zustand `useAuthStore`, persisted to localStorage key `auth-storage` by Zustand `persist` middleware
- Axios interceptor in `api/client.ts` reads token via `useAuthStore.getState().token` and injects `Authorization: Bearer <token>`
- Backend: `utils/auth.py` — `get_current_active_user` + `get_admin_user` FastAPI dependencies
- Passwords: bcrypt via `passlib`; tokens: `python-jose`

---

## Key API Endpoints

See `resources/api-endpoints.md` for full list. Summary:

- `POST /api/auth/register` — create account + get JWT
- `POST /api/auth/login` — get JWT
- `GET  /api/menu/` — list menu items (optional `?category=`)
- `POST /api/orders/payment-intent` — create Stripe payment intent
- `POST /api/orders/` — place order (creates DB record + Square POS sync)
- `GET  /api/orders/my` — current user's order history
- `POST /api/deals/spin` — spin the wheel, get deal code
- `GET  /api/deals/validate/{code}` — validate deal code before checkout
- Admin: `PATCH /api/orders/{id}/status`, `POST /api/menu/`, `GET /api/users/`

---

## Integrations

**Stripe:**
- `payment_service.py` — creates payment intent, verifies webhook (`/api/orders/webhook/stripe`)
- Webhook event `payment.intent.succeeded` → update order status to `brewing`
- Frontend: `@stripe/react-stripe-js` Stripe Elements in `pages/Checkout.tsx`

**Square POS:**
- `square_service.py` — async httpx POST to Square `/v2/orders` API on order creation
- Idempotency key derived from `settings.STORE_NAME` + order ID
- Stores returned `square_order_id` on the Order

**AWS DynamoDB:**
- `menu_service.py` — production menu CRUD against DynamoDB
- Table names come from `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` env vars (default: `phin-and-beans-*`)

---

## Environment Variables

All defined in `backend/.env` (copy from `backend/.env.example`):

```
STORE_NAME=Phin and Beans
STORE_DOMAIN=phinandbeans.com

DATABASE_URL=postgresql://postgres:password@localhost:5432/phin_and_beans
SECRET_KEY=...
ACCESS_TOKEN_EXPIRE_MINUTES=60
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SQUARE_ACCESS_TOKEN=...
SQUARE_LOCATION_ID=...
AWS_REGION=us-east-1
DYNAMODB_TABLE_MENU=phin-and-beans-menu
DYNAMODB_TABLE_DEALS=phin-and-beans-deals
ENVIRONMENT=development
```

---

## Testing

No automated tests exist yet. This is a priority gap. When adding tests:
- Backend: pytest + httpx `TestClient`; use a test PostgreSQL DB, not mocks
- Frontend: Vitest + React Testing Library

---

## Deployment Notes

- **Frontend:** `npm run build` → `dist/` → S3 + CloudFront
- **Backend:** Dockerfile → uvicorn; wrap with `mangum` for AWS Lambda + API Gateway
- **DB:** RDS PostgreSQL; run `alembic upgrade head` on deploy
- **CORS:** Configured dynamically from `STORE_DOMAIN` env var + localhost dev origins
