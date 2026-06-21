# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-store coffee & tea shop platform — one codebase, N independent deployments. Each store gets its own AWS infrastructure (VPC, RDS, ECS, S3/CloudFront), its own database, and its own frontend build baked with its store identity.

**Active stores:** Phin and Beans (`phin-and-beans`), Phin Drips (`phin-drips`)
**Stack:** React 18 + Vite + TypeScript · Python FastAPI · PostgreSQL · Stripe · Square POS · Ollama (local LLM)
**Store registry:** `stores/stores.json` — source of truth for all store slugs, names, taglines, domains

## Development Commands

### Full stack — pick a store
```bash
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |

Or use the dev script:
```bash
./scripts/dev.sh phin-and-beans           # start store
./scripts/dev.sh phin-drips --expose      # start + ngrok tunnel
```

**Note:** First startup pulls the Ollama model (~2GB). Subsequent starts are instant — model is cached in the `ollama_models` Docker volume.

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

### Database migrations
```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

## Multi-Store System

### Store registry
`stores/stores.json` is the authoritative list of stores. Each entry has:
`slug`, `name`, `tagline`, `domain`, `db_name_dev`, `db_name_prod`, `env_prefix`

### Per-store env files
`stores/<slug>.env` — used with `docker compose --env-file` for local dev. Variables:

| Variable | Used by | Example |
|---|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/menu.csv` at startup; passed to ECS | `phin-and-beans` |
| `STORE_NAME` | Backend API, ECS env, Square key | `Phin and Beans` |
| `STORE_TAGLINE` | Frontend hero/tab | `Vietnamese-inspired...` |
| `STORE_DOMAIN` | CORS allowed origins | `phinandbeans.com` |
| `POSTGRES_DB` | PostgreSQL database name | `phin_and_beans` |
| `DYNAMODB_TABLE_MENU` | DynamoDB menu table (prod) | `phin-and-beans-menu` |
| `DYNAMODB_TABLE_DEALS` | DynamoDB deals table (prod) | `phin-and-beans-deals` |
| `GRAB_URL` | Grab Food ordering URL for this store | `https://food.grab.com/...` |
| `OLLAMA_MODEL` | LLM model for the menu chatbot | `llama3.2` |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets for running both stores simultaneously | `5173`, `8000`, `5432` |

### Terraform layout
One Terraform env directory per store × environment — fully isolated state, VPC, RDS, ECS, secrets:
```
terraform/envs/
├── phin-and-beans/
│   ├── dev/    # state key: phin-and-beans/dev/terraform.tfstate  VPC: 10.0.0.0/16
│   └── prod/   # state key: phin-and-beans/prod/terraform.tfstate VPC: 10.1.0.0/16
└── phin-drips/
    ├── dev/    # state key: phin-drips/dev/terraform.tfstate       VPC: 10.2.0.0/16
    └── prod/   # state key: phin-drips/prod/terraform.tfstate      VPC: 10.3.0.0/16
```
All envs share the same S3 state bucket (`coffee-tea-app-tfstate`) and DynamoDB lock table.

### Per-store menus
Each store has its own menu CSV at `backend/menus/<slug>/menu.csv`. The backend loads it at startup via `app/services/menu_loader.py` — no code changes needed to change a menu.

**CSV columns:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `tags` — pipe-separated: `hot|iced|popular`
- `customizations` — `key=opt1|opt2;key2=opt1|opt2` e.g. `milk=Whole|Oat;size=12oz|16oz`
- `item_id` — leave blank; a stable UUID is derived from (store_slug + name) so IDs survive restarts

Admin CRUD (POST/PUT/DELETE `/api/menu/`) works on top of the in-memory dict loaded from CSV. Changes persist only until restart; for permanent changes, edit the CSV and redeploy.

### Adding a new store
1. Add an entry to `stores/stores.json`
2. Create `stores/<slug>.env` with port offsets (use next unused port set) and `OLLAMA_MODEL`
3. Copy and adapt `terraform/envs/phin-drips/` → `terraform/envs/<slug>/` — update `locals`, VPC CIDRs (use next unused /16), S3 state key, `db_name`
4. Create `.github/workflows/ci-cd-<slug>.yml` (copy existing, update store-specific values and secret prefix)
5. Add the store's GitHub secrets (see below)

### GitHub Secrets required per store
CI/CD uses the naming pattern `{ENV}_{PREFIX}_{VAR}` where PREFIX is `PAB` (Phin and Beans) or `PD` (Phin Drips):

| Secret name pattern | Example |
|---|---|
| `DEV_{PREFIX}_DB_PASSWORD` | `DEV_PAB_DB_PASSWORD` |
| `DEV_{PREFIX}_SECRET_KEY` | `DEV_PAB_SECRET_KEY` |
| `DEV_{PREFIX}_STRIPE_SECRET_KEY` | `DEV_PAB_STRIPE_SECRET_KEY` |
| `DEV_{PREFIX}_STRIPE_WEBHOOK_SECRET` | `DEV_PAB_STRIPE_WEBHOOK_SECRET` |
| `DEV_{PREFIX}_SQUARE_ACCESS_TOKEN` | `DEV_PAB_SQUARE_ACCESS_TOKEN` |
| `DEV_{PREFIX}_SQUARE_LOCATION_ID` | `DEV_PAB_SQUARE_LOCATION_ID` |
| `PROD_{PREFIX}_*` | same pattern with `PROD_` prefix |
| `PROD_{PREFIX}_ACM_CERT_ARN` | `PROD_PAB_ACM_CERT_ARN` |

Shared secrets (not per-store): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`
Per-store Ollama secrets: `DEV_{PREFIX}_OLLAMA_BASE_URL`, `PROD_{PREFIX}_OLLAMA_BASE_URL` — URL of your Ollama server reachable from ECS (e.g. `http://ollama.internal:11434`)
Shared vars: `ECR_REPO` (single backend image repo used by all stores)

## Architecture

### Request Flow
```
Browser → React SPA → Axios (/api/* proxy via Vite) → FastAPI → SQLAlchemy → PostgreSQL
                                                              ↳ Stripe (payments)
                                                              ↳ Square (POS sync on order)
                                                              ↳ Ollama (menu chatbot)
```

### Frontend (`frontend/src/`)
- **`config/store.ts`** — single import for `STORE_NAME` + `STORE_TAGLINE`; always import from here
- **`constants/orderStatus.ts`** — `ORDER_STATUSES`, `ORDER_STATUS_COLORS`, `ORDER_STATUS_LABELS`
- **`api/`** — Axios clients; `client.ts` injects JWT from `useAuthStore.getState().token`; 401 → logout + redirect
- **`api/chat.ts`** — `sendChatMessage(messages)` → POST `/api/chat/`
- **`store/`** — Zustand: `useAuthStore` (user + JWT), `useCartStore` (items + deal discount), both persisted to localStorage
- **`components/layout/`** — `Navbar.tsx` + `Footer.tsx` (minimal Davien-style: copyright left, links right)
- **`components/ChatBot.tsx`** — menu assistant section on Home page; suggestion pills, animated typing indicator, conversation history
- **`index.css`** — Starbucks-inspired design tokens: `--green-dark` (#1E3932) headers, `--green` (#00704A) CTAs, `--gold` loyalty, `--cream` page bg

### Backend (`backend/app/`)
- **`routers/`** — thin handlers; auth deps: `get_current_active_user` (user) / `get_admin_user` (admin) from `utils/auth.py`
- **`routers/chat.py`** — POST `/api/chat/`; builds live menu context from `_menu_db`, calls Ollama via OpenAI-compatible client
- **`config.py`** — all env vars via Pydantic `Settings`; `from app.config import settings`
- **`constants.py`** — `ORDER_STATUSES` list
- **`services/`** — all business logic: `deal_service.py`, `payment_service.py`, `square_service.py`, `menu_service.py` (DynamoDB in prod)
- **`models/`** — SQLAlchemy ORM; **`schemas/`** — Pydantic request/response (kept separate)
- Menu storage: `ENVIRONMENT=development` → in-memory dict in `routers/menu.py`; production → `menu_service.py` DynamoDB

### Ollama (local LLM)
The chatbot runs entirely on-device via Ollama — no external API costs or keys needed.

- **Docker service:** `ollama` container exposes port `11434`; models persisted to `ollama_models` Docker volume
- **`ollama-init` service:** one-shot container that auto-pulls `${OLLAMA_MODEL:-llama3.2}` on first run, then exits
- **Backend:** uses `openai` Python package pointed at `http://ollama:11434/v1` (Ollama's OpenAI-compatible endpoint)
- **Model config:** set `OLLAMA_MODEL` in the store's `.env` file — e.g. `llama3.2`, `mistral`, `gemma2`, `phi3`
- **System prompt:** strictly restricts the model to menu-only discussion; built dynamically with live menu data

### Key Data Models
- **Order** statuses: `received → brewing → ready_for_pickup → completed | cancelled`
- **Deal** types: `spin_to_win`, `flash_sale`, `loyalty_reward`; discount types: `percentage`, `fixed_amount`, `free_item`
- **User** has `is_admin` bool and `loyalty_points` int

## CI/CD Pipeline

Two separate workflow files — one per store, triggered only by paths relevant to that store:
- `.github/workflows/ci-cd-phin-and-beans.yml`
- `.github/workflows/ci-cd-phin-drips.yml`

```
build-backend   — one Docker image pushed to ECR (shared by all stores)
build-frontend  — Vite build with store-specific VITE_* vars → artifact
unit-test       — pytest against the backend
deploy-dev      — Terraform apply + ECS rolling deploy + DB migrations + S3/CloudFront sync
e2e             — Playwright tests against live dev URL
deploy-prod     — same as deploy-dev; main branch + manual approval only
```

Shared paths (`backend/app/**`, `frontend/src/**`, `docker-compose.yml`) trigger both workflows. Store-specific paths only trigger that store's workflow.

## Environment Variables

Required in `backend/.env` (see `backend/.env.example`):
- `STORE_NAME` / `STORE_DOMAIN`
- `DATABASE_URL`
- `SECRET_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`
- `AWS_REGION` / `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` — prod only
- `ENVIRONMENT` — `development` uses in-memory menu
- `OLLAMA_BASE_URL` — `http://ollama:11434` in Docker; `http://localhost:11434` outside Docker
- `OLLAMA_MODEL` — model name, e.g. `llama3.2`, `mistral`

## Deployment

- **Frontend** — each store builds independently → `dist/` → S3 + CloudFront (per-store bucket)
- **Backend** — single Docker image → ECR → ECS Fargate (per-store service, env vars injected at runtime via Secrets Manager)
- **Database** — per-store RDS PostgreSQL; run `alembic upgrade head` via ECS one-off task on deploy
- **Ollama (prod)** — deploy a separate ECS service or EC2 instance running Ollama; set `OLLAMA_BASE_URL` in Secrets Manager to point to it
