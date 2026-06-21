---
name: coffee-tea-app-context
description: Load this skill when working on any feature, bug fix, or question about this multi-store coffee & tea shop app. Covers full-stack architecture, data models, service layer, store config system, CI/CD, and development workflow.
version: 1.7.0
---

# Coffee & Tea Shop App — Project Context

## What This App Is

A multi-store Vietnamese-inspired coffee & tea shop platform. One codebase powers multiple independent stores via environment variables. Customers browse the menu, view deals, find locations, and order via Grab Food.

**Active stores:** `phin-and-beans` (Phin and Beans) · `phin-drips` (Phin Drips) · `daboba` (Daboba)

**Stack:** React 18 + Vite + TypeScript · Python FastAPI · Stripe · Square POS · Ollama (`llama3.2:1b`) · AWS ECS/S3/CloudFront · Terraform · GitHub Actions

> **Current state:** Public showcase/menu site. No auth, login, admin, or database deployed. All data (menu, deals, locations) is served from per-store CSV files. Auth/orders code exists in the repo and can be re-enabled by adding routers to `main.py` and provisioning RDS.

---

## Running the App Locally

```bash
# Run all stores simultaneously — each in its own terminal
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
docker compose --env-file stores/daboba.env          -p daboba          up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |
| Daboba | http://localhost:5175 | http://localhost:8002 | http://localhost:8002/api/docs |

> `ollama-init` shows `Exited (0)` after first startup — that is normal and means the model pull succeeded.

```bash
# Restart just the backend after editing a CSV file
docker compose -p phin-and-beans restart coffee-tea-api

# Fix corrupted node_modules (Vite "Cannot find module" error)
./scripts/dev.sh phin-and-beans --clean

# Frontend only
cd frontend && npm install && npm run dev

# Backend only
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload
```

---

## Multi-Store System

**Registry:** `stores/stores.json` — source of truth. Each entry: `slug`, `name`, `tagline`, `domain`, `grab_url`, `db_name_dev`, `db_name_prod`, `env_prefix` (e.g. `PAB`, `PD`, `DB` — maps to GitHub secret naming).

### Per-store env files (`stores/<slug>.env`)

| Variable | Purpose |
|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory |
| `STORE_NAME` | API title |
| `STORE_TAGLINE` | Frontend hero tagline (`VITE_STORE_TAGLINE`) |
| `STORE_DOMAIN` | CORS allowed origin |
| `GRAB_URL` | "Order" button URL in navbar |
| `POSTGRES_DB` | Local dev PostgreSQL database name |
| `MENU_S3_BUCKET` | S3 bucket for CSVs; blank = local files only |
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) |
| `OLLAMA_MODEL` | LLM model for the menu chatbot (e.g. `llama3.2:1b`) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets |

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
- `item_id` blank → stable UUID derived from `(store_slug + name)`
- `customizations`: `milk=Whole|Oat|Almond;size=12oz|16oz`

**deals.csv columns:** `title, description, discount_type, discount_value, label, expires_at, badge`

**locations.csv columns:** `name, address, city, state, zip, country, hours, phone`

### Terraform layout

```
terraform/envs/
├── phin-and-beans/dev/   VPC: 10.0.0.0/16
├── phin-and-beans/prod/  VPC: 10.1.0.0/16
├── phin-drips/dev/       VPC: 10.2.0.0/16
├── phin-drips/prod/      VPC: 10.3.0.0/16
├── daboba/dev/           VPC: 10.4.0.0/16
└── daboba/prod/          VPC: 10.5.0.0/16
```

Each env: VPC (public subnets only — no NAT Gateway), ECS (Fargate, `assign_public_ip=true`), Secrets Manager, S3, CloudFront. **No RDS** currently deployed. Shared state: S3 `coffee-tea-app-tfstate` + DynamoDB lock table. Dev → `us-east-2`, Prod → `us-east-1`.

---

## Frontend Architecture

**Active Routes** (`frontend/src/App.tsx`):

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, Vietnam origin story, 4 pillars, signature drinks grid, chatbot |
| `/menu` | Menu | Section nav; circular cards; click → description modal |
| `/deals` | Deals | Fetches `/api/deals/public`; empty state if none |
| `/locations` | Locations | Google Maps embed + address/hours/phone |
| `/careers` | Careers | Static content |
| `/privacy` | PrivacyPolicy | Loads `frontend/public/privacy-policy.txt` |

Login, Register, AdminDashboard are **not routed** — removed from `App.tsx`.

**Components:**
- `layout/Navbar.tsx` — nav links + Order (Grab) button; no auth UI
- `layout/Footer.tsx` — copyright left; Careers + Privacy + social links right
- `menu/MenuCard.tsx` — circular image (140px); click opens Framer Motion modal
- `ChatBot.tsx` — menu-only AI assistant; suggestion pills; typing indicator; auto-scroll

**State:** `useCartStore` (cart items + deal discount, persisted). `useAuthStore` exists but unused by active routes.

**Design tokens** (`index.css`): `--green-dark` (#1E3932) headers, `--green` (#00704A) CTAs, `--cream` (#F2F0EB) page bg. Never hardcode colors.

---

## Backend Architecture

**Active routers** (`main.py`):
```python
from .routers import menu, deals, locations, chat
```
No `Base.metadata.create_all()` — no database connection on startup.

| Router | Active endpoints |
|---|---|
| `menu.py` | GET `/api/menu/`, `/api/menu/categories`, `/api/menu/{id}` |
| `deals.py` | GET `/api/deals/public` only |
| `locations.py` | GET `/api/locations/` |
| `chat.py` | POST `/api/chat/` |

**Inactive routers** (in codebase, not registered): `auth.py`, `users.py`, `orders.py`

**Key services:**
- `menu_loader.py` — S3 → local CSV fallback; resolves image URLs
- `deals_loader.py` — S3 → local `deals.csv` fallback; returns `[]` if missing
- `locations_loader.py` — S3 → local fallback; builds Google Maps URLs
- `menu_service.py` — in-memory dict (dev, `ENVIRONMENT=development`) or DynamoDB (prod)

**Ollama (menu chatbot):**
- `ollama` Docker service + `ollama-init` one-shot service (pulls model on first run, exits 0)
- `chat.py` uses `openai` package pointed at `http://ollama:11434/v1`
- System prompt rules: menu-only, no ingredients revealed, always list 3+ drinks with prices, oat milk available for extra charge
- Change model via `OLLAMA_MODEL` env var — no code change needed

---

## CI/CD Pipeline

**Three workflow files** — one per store (`ci-cd-phin-and-beans.yml`, `ci-cd-phin-drips.yml`, `ci-cd-daboba.yml`), each triggered only by paths relevant to that store.

**Stages:**
1. `build-backend` — Docker image → ECR (shared image, git SHA tag)
2. `build-frontend` — Vite build with store-specific `VITE_` vars → artifact
3. `unit-test` — pytest
4. `deploy-dev` — Terraform apply → ECS rolling deploy → S3/CloudFront sync (no DB migration)
5. `e2e` — Playwright against live dev URL
6. `deploy-prod` — same as deploy-dev; `main` branch + manual approval only

**GitHub Secrets pattern:** `{ENV}_{PREFIX}_{VAR}` e.g. `DEV_PAB_SECRET_KEY`, `PROD_PD_OLLAMA_BASE_URL`

**Prefixes:** `PAB` (Phin and Beans), `PD` (Phin Drips), `DB` (Daboba)

**Per-store vars:** `SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `OLLAMA_BASE_URL`

**Prod-only additions:** `PROD_{PREFIX}_ACM_CERT_ARN`

**Shared:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`, `ECR_REPO` (variable)

> No `DB_PASSWORD` secrets — RDS is not deployed.

---

## Adding a New Store

1. Add entry to `stores/stores.json`
2. Create `stores/<slug>.env` with port offsets (use next unused port set)
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy `terraform/envs/phin-drips/` → `terraform/envs/<slug>/`; update locals, VPC CIDRs, state key
5. Create `.github/workflows/ci-cd-<slug>.yml` (copy existing, update store-specific values)
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`, `PROD_{PREFIX}_ACM_CERT_ARN`
7. Test: `docker compose --env-file stores/<slug>.env -p <slug> up`
