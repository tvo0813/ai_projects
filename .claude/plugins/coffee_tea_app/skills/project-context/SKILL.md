---
name: coffee-tea-app-context
description: Load this skill when working on any feature, bug fix, or question about this multi-store coffee & tea shop app. Covers full-stack architecture, data models, service layer, auth, integrations, store config system, CI/CD, and development workflow.
version: 1.5.0
---

# Coffee & Tea Shop App — Project Context

## What This App Is

A multi-store Vietnamese-inspired coffee & tea shop platform. One codebase powers multiple independent stores via environment variables — no code changes to launch a new store. Customers browse the menu, view deals, find locations, and order via Grab Food. Admins manage menu, deals, and orders.

**Active stores:** `phin-and-beans` (Phin and Beans) · `phin-drips` (Phin Drips)

**Stack:** React 18 + Vite + TypeScript · Python FastAPI · PostgreSQL 16 · Stripe · Square POS · AWS ECS/RDS/S3/CloudFront · Terraform · GitHub Actions

> Order placement is implemented in the backend but not surfaced in the public UI — will be re-enabled in a future release. The app is currently a public showcase/menu site.

---

## Running the App Locally

```bash
# Run both stores simultaneously — each in its own terminal
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |

The `-p` flag gives each stack an isolated Docker project name — separate containers, networks, and named Postgres volumes. Port offsets are set in each store's `.env` file (`FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT`, `DB_VOLUME`).

```bash
# Restart just the backend after editing a CSV file
docker compose -p phin-and-beans restart coffee-tea-api

# Frontend only
cd frontend && npm install && npm run dev

# Backend only
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload

# DB migrations
cd backend && alembic upgrade head
alembic revision --autogenerate -m "description"

# Share locally with remote viewers
ngrok http 5173   # or 5174 for Phin Drips
```

---

## Multi-Store System

**Registry:** `stores/stores.json` — source of truth. Each entry: `slug`, `name`, `tagline`, `domain`, `grab_url`, `db_name_dev`, `db_name_prod`, `env_prefix` (e.g. `PAB`, `PD` — maps to GitHub secret naming).

### Per-store env files (`stores/<slug>.env`)

| Variable | Purpose |
|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory |
| `STORE_NAME` | API title, Square idempotency key prefix |
| `STORE_TAGLINE` | Frontend hero tagline (`VITE_STORE_TAGLINE`) |
| `STORE_DOMAIN` | CORS allowed origin |
| `GRAB_URL` | "Order" button URL in navbar |
| `POSTGRES_DB` | PostgreSQL database name |
| `MENU_S3_BUCKET` | S3 bucket for CSVs; blank = local files only |
| `GOOGLE_MAPS_API_KEY` | Maps Embed API; blank = legacy embed fallback |
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets for running stores simultaneously |

Frontend reads store identity from `frontend/src/config/store.ts` — always import from there.

### Per-store data files (`backend/menus/<slug>/`)

```
backend/menus/<slug>/
├── menu.csv        — drink menu (loaded at startup)
├── deals.csv       — public deals/promotions
├── locations.csv   — physical store locations
└── images/         — drink photos served at /static/images/
```

**menu.csv columns:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `tags` pipe-separated: `hot|iced|popular|signature|coffee|matcha|latte|tea`
- Signature items tagged with their base category appear in both Signature section AND that base section on the menu page
- `item_id` blank → stable UUID derived from `(store_slug + name)`
- `customizations`: `milk=Whole|Oat|Almond;size=12oz|16oz`

**deals.csv columns:** `title, description, discount_type, discount_value, label, expires_at, badge`

**locations.csv columns:** `name, address, city, state, zip, country, hours, phone`
- Use a real Google Maps-resolvable address

### Terraform layout

```
terraform/envs/
├── phin-and-beans/dev/   VPC: 10.0.0.0/16
├── phin-and-beans/prod/  VPC: 10.1.0.0/16
├── phin-drips/dev/       VPC: 10.2.0.0/16
└── phin-drips/prod/      VPC: 10.3.0.0/16
```

Each env is fully isolated: VPC, RDS, ECS, Secrets Manager, S3, CloudFront. Shared state: S3 bucket `coffee-tea-app-tfstate` + DynamoDB lock table. Dev → `us-east-2`, Prod → `us-east-1`.

---

## Frontend Architecture

**Pages** (`frontend/src/pages/`):

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, Vietnam origin story, 4 pillars, live signature drinks grid |
| `/menu` | Menu | Section nav (Signature, Coffee, Matcha, Latte, Tea, Hot Drinks); circular cards; click → description modal |
| `/deals` | Deals | Fetches `/api/deals/public`; deal cards; empty state if none |
| `/locations` | Locations | Google Maps embed + address/hours/phone from `locations.csv` |
| `/careers` | Careers | Static — 3-step apply process, email CTA |
| `/privacy` | PrivacyPolicy | Loads `frontend/public/privacy-policy.txt` |
| `/login` | Login | Not linked from public nav — navigate to `/login` directly |
| `/admin` | AdminDashboard | `is_admin` only |

**Components:**
- `layout/Navbar.tsx` — Home/Menu/Deals center nav; Locations + Order (Grab) buttons right; admin controls if `is_admin`
- `layout/Footer.tsx` — copyright left; Careers + Privacy Policy + Instagram/Facebook/TikTok icons right
- `menu/MenuCard.tsx` — circular image (140px), name + price; click opens Framer Motion modal with full description
- `deals/SpinWheel.tsx` — animated spin wheel

**State** (`frontend/src/store/`):
- `useAuthStore` — user + JWT, Zustand `persist` to localStorage `"auth-storage"`
- `useCartStore` — items + deal discount, persisted to `"cart-storage"`

**API clients** (`frontend/src/api/`): `client.ts` (Axios + JWT interceptor + 401 redirect), `auth.ts`, `menu.ts`, `deals.ts`, `locations.ts`

**Vite proxy** (dev only): `/api` and `/static` → `http://localhost:8000`

**Design tokens** (`index.css`): `--green-dark` (#1E3932) headers, `--green` (#00704A) CTAs, `--gold` loyalty, `--cream` (#F2F0EB) page bg, `--white` cards. Never hardcode colors.

---

## Backend Architecture

**`main.py`** — FastAPI app, CORS, router registration, `StaticFiles` mount at `/static/images` → `backend/menus/<STORE_SLUG>/images/`

**`config.py`** — all env vars via Pydantic `Settings`; `from app.config import settings`

**Routers** (`backend/app/routers/`) — thin handlers only:

| Router | Prefix | Key endpoints |
|---|---|---|
| `auth.py` | `/api/auth` | POST `/register`, POST `/login` |
| `menu.py` | `/api/menu` | GET `/`, GET `/categories`, admin CRUD |
| `deals.py` | `/api/deals` | GET `/public` (no auth), POST `/spin` (user), admin CRUD |
| `locations.py` | `/api/locations` | GET `/` (public) |
| `orders.py` | `/api/orders` | payment-intent, create, history, status, Stripe webhook |
| `users.py` | `/api/users` | `/me`, list, make-admin |

**Services** (`backend/app/services/`):
- `menu_loader.py` — S3 → local CSV fallback; resolves image URLs to `/static/images/`
- `deals_loader.py` — S3 → local `deals.csv` fallback; returns `[]` if missing
- `locations_loader.py` — S3 → local `locations.csv` fallback; builds Google Maps URLs
- `deal_service.py` — spin logic, code generation (`BREW-XXXXX`), validation, discount calc
- `payment_service.py` — Stripe payment intent, webhook verification
- `square_service.py` — async Square POS order push
- `menu_service.py` — in-memory dict (dev, `ENVIRONMENT=development`) or DynamoDB (prod)

**Menu storage:** `ENVIRONMENT=development` → in-memory dict from CSV at startup. Production → DynamoDB via `menu_service.py`.

**Locations Google Maps:** `maps_embed_url_keyed()` uses official Embed API (requires `GOOGLE_MAPS_API_KEY`); `maps_embed_url_legacy` property is the keyless fallback. Frontend tries keyed first, falls back via iframe `onError`.

**Order status:** `received → brewing → ready_for_pickup → completed | cancelled`

---

## Authentication

JWT-based, stateless. Login UI is not linked from the public navbar — go to `/login` directly. First admin: register, then `UPDATE users SET is_admin = true WHERE email = '...'`.

- Backend: `get_current_active_user` (any user) / `get_admin_user` (is_admin only) in `utils/auth.py`
- Frontend: Axios interceptor injects `Authorization: Bearer <token>`; 401 → logout + redirect to `/login`

---

## CI/CD Pipeline

**Two separate workflow files** — one per store, each triggered only by paths relevant to that store:
- `.github/workflows/ci-cd-phin-and-beans.yml`
- `.github/workflows/ci-cd-phin-drips.yml`

**What triggers each workflow:**

| Changed path | PAB workflow | PD workflow |
|---|---|---|
| `backend/app/**`, `frontend/src/**` (shared) | ✅ | ✅ |
| `backend/menus/phin-and-beans/**` | ✅ | ❌ |
| `backend/menus/phin-drips/**` | ❌ | ✅ |
| `stores/phin-and-beans.env` | ✅ | ❌ |
| `terraform/envs/phin-and-beans/**` | ✅ | ❌ |

**Pipeline stages (identical in both workflows):**
1. `build-backend` — Docker image → ECR (shared image, git SHA tag)
2. `build-frontend` — Vite build with store-specific `VITE_` vars → artifact
3. `unit-test` — pytest, SQLite in-memory
4. `deploy-dev` — Terraform apply → ECS rolling deploy → DB migrations → S3/CloudFront sync
5. `e2e` — Playwright against live dev URL
6. `deploy-prod` — same as deploy-dev; `main` branch + manual approval only

Each workflow has its own concurrency group so they never cancel each other.

**GitHub Secrets:**

| Secret | Scope |
|---|---|
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Shared |
| `GOOGLE_MAPS_API_KEY` | Shared (passed as `TF_VAR_google_maps_api_key`) |
| `DEV_PAB_*` / `PROD_PAB_*` | Phin and Beans only |
| `DEV_PD_*` / `PROD_PD_*` | Phin Drips only |

Per-store secret pattern: `{ENV}_{PREFIX}_{VAR}` e.g. `DEV_PAB_DB_PASSWORD`, `PROD_PD_SECRET_KEY`

---

## Adding a New Store

1. Add entry to `stores/stores.json` (slug, name, tagline, domain, grab_url, db names, env_prefix)
2. Create `stores/<slug>.env` with all variables + port offsets (use next unused port set)
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy `terraform/envs/phin-drips/` → `terraform/envs/<slug>/`; update locals, VPC CIDRs, state key, db_name
5. Create `.github/workflows/ci-cd-<slug>.yml` (copy existing, update store-specific values)
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`, `PROD_{PREFIX}_ACM_CERT_ARN`
7. Test: `docker compose --env-file stores/<slug>.env -p <slug> up`
