# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-store coffee & tea shop platform — one codebase, N independent deployments. Each store gets its own AWS infrastructure (VPC, ECS, S3/CloudFront), its own frontend build baked with its store identity.

**Active stores:** Phin and Beans (`phin-and-beans`), Phin Drips (`phin-drips`), Daboba (`daboba`)
**Stack:** React 18 + Vite + TypeScript · Python FastAPI · Stripe · Square POS · Ollama (local LLM)
**Store registry:** `stores/stores.json` — source of truth for all store slugs, names, taglines, domains

> **Current state:** Public-facing site. No auth, login, admin, or database in deployment. All data (menu, deals, locations) is served from per-store CSV files.

## Development Commands

### Full stack — pick a store
```bash
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
docker compose --env-file stores/daboba.env          -p daboba          up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |
| Daboba | http://localhost:5175 | http://localhost:8002 | http://localhost:8002/api/docs |

Or use the dev script:
```bash
./scripts/dev.sh phin-and-beans           # start store
./scripts/dev.sh phin-drips --expose      # start + ngrok tunnel
./scripts/dev.sh phin-and-beans --clean   # full wipe + rebuild
```

**Note:** First startup pulls the Ollama model (~1.3GB). Subsequent starts are instant — model is cached in the `ollama_models` Docker volume.

### Frontend only
```bash
cd frontend
npm install
npm run dev        # uses frontend/.env for store identity
npm run build      # tsc + Vite production build
```

### Backend only
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Active Routers

Only these routers are registered in `main.py`:
- `menu` — GET `/api/menu/`, `/api/menu/categories`, `/api/menu/{id}` (CSV-backed, no DB)
- `deals` — GET `/api/deals/public` only (CSV-backed, no DB)
- `locations` — GET `/api/locations/` (CSV-backed, no DB)
- `chat` — POST `/api/chat/` (Ollama, no DB)

Auth, users, orders, and admin are **disabled** — no DB is deployed. Re-enable by adding the routers back to `main.py` and provisioning RDS via `terraform/modules/rds`.

## Multi-Store System

### Store registry
`stores/stores.json` is the authoritative list of stores. Each entry has:
`slug`, `name`, `tagline`, `domain`, `grab_url`, `db_name_dev`, `db_name_prod`, `env_prefix`

### Per-store env files
`stores/<slug>.env` — used with `docker compose --env-file` for local dev. Variables:

| Variable | Used by | Example |
|---|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory | `phin-and-beans` |
| `STORE_NAME` | Backend API title, ECS env | `Phin and Beans` |
| `STORE_TAGLINE` | Frontend hero/tab | `Vietnamese-inspired...` |
| `STORE_DOMAIN` | CORS allowed origins | `phinandbeans.com` |
| `GRAB_URL` | "Order" button link in navbar | `https://food.grab.com/...` |
| `POSTGRES_DB` | Local dev DB name (Docker only) | `phin_and_beans` |
| `DYNAMODB_TABLE_MENU` | DynamoDB menu table (prod) | `phin-and-beans-menu` |
| `DYNAMODB_TABLE_DEALS` | DynamoDB deals table (prod) | `phin-and-beans-deals` |
| `OLLAMA_MODEL` | LLM model for menu chatbot | `llama3.2:1b` |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets | `5173`, `8000`, `5432` |

### Terraform layout
One Terraform env directory per store × environment — fully isolated state, VPC, ECS, secrets. No RDS currently deployed.
```
terraform/envs/
├── phin-and-beans/
│   ├── dev/    # state key: phin-and-beans/dev/terraform.tfstate  VPC: 10.0.0.0/16
│   └── prod/   # state key: phin-and-beans/prod/terraform.tfstate VPC: 10.1.0.0/16
├── phin-drips/
│   ├── dev/    # state key: phin-drips/dev/terraform.tfstate       VPC: 10.2.0.0/16
│   └── prod/   # state key: phin-drips/prod/terraform.tfstate      VPC: 10.3.0.0/16
└── daboba/
    ├── dev/    # state key: daboba/dev/terraform.tfstate            VPC: 10.4.0.0/16
    └── prod/   # state key: daboba/prod/terraform.tfstate           VPC: 10.5.0.0/16
```
All envs share the same S3 state bucket (`coffee-tea-app-tfstate`) and DynamoDB lock table.

### Per-store data files
Each store has its own CSV data at `backend/menus/<slug>/`. The backend loads all files at startup — no code changes needed to change content.

**CSV files:**
- `menu.csv` — drink menu
- `deals.csv` — public deals/promotions
- `locations.csv` — physical store locations

**menu.csv columns:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `tags` — pipe-separated: `hot|iced|popular`
- `customizations` — `key=opt1|opt2;key2=opt1|opt2` e.g. `milk=Whole|Oat;size=12oz|16oz`
- `item_id` — leave blank; a stable UUID is derived from (store_slug + name) so IDs survive restarts

### Adding a new store
1. Add an entry to `stores/stores.json`
2. Create `stores/<slug>.env` with port offsets (use next unused port set) and `OLLAMA_MODEL`
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy and adapt `terraform/envs/phin-drips/` → `terraform/envs/<slug>/` — update `locals`, VPC CIDRs (use next unused /16), S3 state key
5. Create `.github/workflows/ci-cd-<slug>.yml` (copy existing, update store-specific values and secret prefix)
6. Add the store's GitHub secrets (see below)

### GitHub Secrets required per store
CI/CD uses the naming pattern `{ENV}_{PREFIX}_{VAR}`:

| Secret name pattern | Example (PAB = Phin and Beans) |
|---|---|
| `DEV_{PREFIX}_SECRET_KEY` | `DEV_PAB_SECRET_KEY` |
| `DEV_{PREFIX}_STRIPE_SECRET_KEY` | `DEV_PAB_STRIPE_SECRET_KEY` |
| `DEV_{PREFIX}_STRIPE_WEBHOOK_SECRET` | `DEV_PAB_STRIPE_WEBHOOK_SECRET` |
| `DEV_{PREFIX}_SQUARE_ACCESS_TOKEN` | `DEV_PAB_SQUARE_ACCESS_TOKEN` |
| `DEV_{PREFIX}_SQUARE_LOCATION_ID` | `DEV_PAB_SQUARE_LOCATION_ID` |
| `DEV_{PREFIX}_OLLAMA_BASE_URL` | `DEV_PAB_OLLAMA_BASE_URL` |
| `PROD_{PREFIX}_*` | same pattern with `PROD_` prefix |
| `PROD_{PREFIX}_ACM_CERT_ARN` | `PROD_PAB_ACM_CERT_ARN` |

Shared secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`
Shared vars: `ECR_REPO` (single backend image repo used by all stores)

**Store prefixes:** `PAB` (Phin and Beans), `PD` (Phin Drips), `DB` (Daboba)

## Architecture

### Request Flow
```
Browser → React SPA → Axios (/api/* proxy via Vite) → FastAPI → CSV/in-memory
                                                              ↳ Ollama (menu chatbot)
                                                              ↳ Stripe (payments — configured but not surfaced in UI)
                                                              ↳ Square (POS — configured but not surfaced in UI)
```

### Frontend (`frontend/src/`)
- **`config/store.ts`** — single import for `STORE_NAME`, `STORE_TAGLINE`, `GRAB_URL`; always import from here
- **`api/`** — Axios clients; `client.ts` is a base instance (no auth interceptor needed currently)
- **`api/chat.ts`** — `sendChatMessage(messages)` → POST `/api/chat/`
- **`components/layout/`** — `Navbar.tsx` + `Footer.tsx`
- **`components/ChatBot.tsx`** — menu assistant on Home page; suggestion pills, typing indicator, conversation history
- **`index.css`** — design tokens: `--green-dark` (#1E3932) headers, `--green` (#00704A) CTAs, `--cream` page bg

### Backend (`backend/app/`)
- **`routers/`** — thin handlers; no auth deps on active routes
- **`routers/chat.py`** — POST `/api/chat/`; builds live menu context from `_menu_db`, calls Ollama via OpenAI-compatible client
- **`config.py`** — all env vars via Pydantic `Settings`; `from app.config import settings`
- **`services/`** — `deals_loader.py`, `menu_loader.py` (DynamoDB in prod), `locations_loader.py`
- Menu storage: `ENVIRONMENT=development` → in-memory dict; production → `menu_service.py` DynamoDB

### Ollama (local LLM)
The chatbot runs entirely via Ollama — no external API costs or keys needed.

- **Docker service:** `ollama` container exposes port `11434`; models persisted to `ollama_models` Docker volume
- **`ollama-init` service:** one-shot container that auto-pulls `${OLLAMA_MODEL:-llama3.2:1b}` on first run, then exits with code 0 (this is normal)
- **Backend:** uses `openai` Python package pointed at `http://ollama:11434/v1` (Ollama's OpenAI-compatible endpoint)
- **Model config:** set `OLLAMA_MODEL` in the store's `.env` file — e.g. `llama3.2:1b`, `mistral`, `gemma2`
- **System prompt:** restricts model to menu-only; never reveals ingredients; always lists 3+ drinks with prices; oat milk available for extra charge

## CI/CD Pipeline

Three separate workflow files — one per store, triggered only by paths relevant to that store:
- `.github/workflows/ci-cd-phin-and-beans.yml`
- `.github/workflows/ci-cd-phin-drips.yml`
- `.github/workflows/ci-cd-daboba.yml`

```
build-backend   — one Docker image pushed to ECR (shared by all stores)
build-frontend  — Vite build with store-specific VITE_* vars → artifact
unit-test       — pytest against the backend
deploy-dev      — Terraform apply + ECS rolling deploy + S3/CloudFront sync
e2e             — Playwright tests against live dev URL
deploy-prod     — same as deploy-dev; main branch + manual approval only
```

No DB migration step — RDS is not deployed.

## Environment Variables

Required in `backend/.env` (see `backend/.env.example`):
- `STORE_NAME` / `STORE_SLUG` / `STORE_DOMAIN`
- `SECRET_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`
- `AWS_REGION` / `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` — prod only
- `ENVIRONMENT` — `development` uses in-memory menu
- `OLLAMA_BASE_URL` — `http://ollama:11434` in Docker; `http://localhost:11434` outside Docker
- `OLLAMA_MODEL` — model name, e.g. `llama3.2:1b`
- `GOOGLE_MAPS_API_KEY` — optional; falls back to keyless embed if blank

Note: `DATABASE_URL` is **not** required — no database is deployed.

## Deployment

- **Frontend** — each store builds independently → `dist/` → S3 + CloudFront (per-store bucket)
- **Backend** — single Docker image → ECR → ECS Fargate (per-store service, env vars injected at runtime via Secrets Manager)
- **No database** — auth/orders disabled; all data served from CSV files
- **Ollama (prod)** — deploy an EC2 instance running Ollama; set `OLLAMA_BASE_URL` in Secrets Manager to point to it
