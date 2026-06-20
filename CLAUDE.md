# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-store coffee & tea shop web app — the same codebase powers multiple stores (e.g. "Phin and Beans", "Phin Drip") via environment variables. React 18 + Vite + TypeScript frontend, Python FastAPI backend, PostgreSQL database, with Stripe payment and Square POS integrations.

Store identity is configured entirely through env vars. See `stores/` for per-store `.env` files.

## Development Commands

### Full Stack (Docker — recommended)
```bash
cp backend/.env.example backend/.env   # fill in keys first
docker compose --env-file stores/phin-and-beans.env up
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/api/docs

### Frontend only
```bash
cd frontend
npm install
npm run dev        # uses frontend/.env for store name
npm run build      # tsc type-check + Vite production build
npm run preview    # serve the production build locally
```

### Backend only
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Database migrations
```bash
cd backend
alembic upgrade head        # apply all migrations
alembic revision --autogenerate -m "description"  # generate new migration
```

## Store Configuration

| Variable | Where used | Example |
|---|---|---|
| `STORE_NAME` | Backend API title, health endpoint, Square idempotency key | `Phin and Beans` |
| `STORE_DOMAIN` | CORS allowed origins (blank = no extra origin) | `phinandbeans.com` |
| `VITE_STORE_NAME` | Browser tab title, navbar, hero, admin panel | `Phin and Beans` |
| `VITE_STORE_TAGLINE` | Hero section subtitle | `Vietnamese-inspired coffee...` |
| `POSTGRES_DB` | PostgreSQL database name | `phin_and_beans` |
| `DYNAMODB_TABLE_MENU` | DynamoDB menu table (prod only) | `phin-and-beans-menu` |
| `DYNAMODB_TABLE_DEALS` | DynamoDB deals table (prod only) | `phin-and-beans-deals` |

Store env files live in `stores/<store-slug>.env`. To add a new store, create a new file there — no code changes needed.

## Architecture

### Request Flow
```
Browser → React SPA → Axios (/api/* proxy via Vite in dev) → FastAPI → SQLAlchemy → PostgreSQL
                                                                      ↳ Stripe (payments)
                                                                      ↳ Square (POS sync on order completion)
```

### Frontend (`frontend/src/`)
- **`config/store.ts`** — single source for `STORE_NAME` and `STORE_TAGLINE`; import from here in any component that needs the store name.
- **`constants/orderStatus.ts`** — `ORDER_STATUSES`, `ORDER_STATUS_COLORS`, `ORDER_STATUS_LABELS`; used in `Orders.tsx` and `AdminDashboard.tsx`.
- **`api/`** — Axios API client modules. `client.ts` sets up the base Axios instance with JWT `Authorization` header injection (reads from Zustand, not localStorage directly) and auto-logout + redirect on 401.
- **`store/`** — Zustand stores persisted to `localStorage`: `useAuthStore` (user + JWT token) and `useCartStore` (items + applied deal discount).
- **`pages/`** — Route-level components. `admin/AdminDashboard.tsx` is protected by `is_admin` flag on the user object.
- **`components/`** — Reusable UI, organized by domain (`menu/`, `cart/`, `deals/`, `layout/`).
- **`index.css`** — Global design tokens as CSS custom properties (brown palette, `--cream`, `--green-matcha`, typography, shadows, radii). All new UI should use these variables.

### Backend (`backend/app/`)
- **`routers/`** — Thin route handlers. Auth via `get_current_active_user` / `get_admin_user` dependencies from `utils/auth.py`.
- **`constants.py`** — `ORDER_STATUSES` list; used by orders router for validation.
- **`services/`** — Business logic lives here, not in routers:
  - `deal_service.py` — spin-to-win randomness, deal code validation
  - `menu_service.py` — DynamoDB CRUD (used in production; dev uses in-memory dict in `routers/menu.py`)
  - `payment_service.py` — Stripe payment intent creation
  - `square_service.py` — Square POS sync triggered on order completion
- **`models/`** — SQLAlchemy ORM models (the database schema).
- **`schemas/`** — Pydantic models for request validation and response serialization. Separate from ORM models.
- **`config.py`** — All environment variables loaded via Pydantic `Settings`. Access config via `from app.config import settings`.

### Key Data Models
- **Order** has statuses: `received → brewing → ready_for_pickup → completed | cancelled`
- **OrderItem** stores `customizations` as JSON (arbitrary drink customizations)
- **Deal** supports `spin_to_win`, `flash_sale`, `loyalty_reward` types; `discount_type` is `percentage`, `fixed_amount`, or `free_item`
- **User** has `is_admin` boolean and `loyalty_points` int

### Authentication
JWT-based. Token stored in Zustand `useAuthStore` (persisted to `auth-storage` in localStorage) and attached by the Axios client via `useAuthStore.getState().token`. Backend validates tokens in `utils/auth.py` using `python-jose`. Passwords hashed with `bcrypt` via `passlib`.

## Environment Variables

Required in `backend/.env` (see `backend/.env.example`):
- `STORE_NAME` / `STORE_DOMAIN` — store identity and CORS domain
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing secret
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`
- `AWS_REGION` / `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` — only needed for production DynamoDB menu storage
- `ENVIRONMENT` — `development` uses in-memory menu storage in the router; anything else should wire `menu_service.py`

## Deployment

- **Frontend**: `npm run build` → deploy `dist/` to S3 + CloudFront
- **Backend**: Dockerfile uses `python:3.11-slim` + uvicorn; wrap with `mangum` for AWS Lambda + API Gateway
- **Database**: RDS PostgreSQL; run `alembic upgrade head` on deploy
