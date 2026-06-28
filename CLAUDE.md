# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multi-store coffee & tea shop platform — one codebase, N independent deployments. Each store gets its own AWS infrastructure (VPC, ECS, S3/CloudFront), its own frontend build baked with its store identity.

**Active stores:** Phin and Beans (`phin-and-beans`), Phin Drips (`phin-drips`), Daboba (`daboba`)
**Stack:** React 18 + Vite + TypeScript · Python FastAPI · Framer Motion · Stripe · Square POS · Ollama (local LLM)
**Store registry:** `stores/stores.json` — source of truth for all store slugs, names, taglines, domains

> **Current state:** Public-facing site. No auth, login, admin, or database in deployment. All data (menu, deals, locations) is served from per-store CSV files. Supports both a live Docker/backend mode and a fully static GitHub Pages mode.

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

### Makefile (preferred)
```bash
make up    STORE=phin-and-beans   # start
make down  STORE=phin-drips       # stop
make restart STORE=phin-and-beans # rebuild + restart
make logs  STORE=phin-drips       # tail logs
make logs-web STORE=phin-drips    # frontend logs only
make logs-api STORE=phin-drips    # backend logs only
make clean STORE=phin-and-beans   # stop + wipe volumes
make up-all / down-all / clean-all / ps-all / status
make nuke                         # remove all Docker resources
```

### GitHub Pages static build
```bash
make static-data                     # CSV → JSON in frontend/public/data/
make static-build STORE=phin-drips   # full static build (VITE_STATIC_MODE=true)
make static-preview STORE=phin-drips # build + serve at localhost:4173
```

### Frontend only
```bash
cd frontend && npm install && npm run dev
```

### Backend only
```bash
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && cp .env.example .env
uvicorn app.main:app --reload
```

## Active Routers

Only these routers are registered in `main.py`:
- `menu` — GET `/api/menu/`, `/api/menu/categories`, `/api/menu/{id}` (CSV-backed, no DB)
- `deals` — GET `/api/deals/public` only (CSV-backed, no DB)
- `locations` — GET `/api/locations/` (CSV-backed, no DB)
- `chat` — POST `/api/chat/` (Ollama, no DB)

Auth, users, orders, and admin are **disabled** — no DB is deployed.

## Multi-Store System

### Store registry
`stores/stores.json` is the authoritative list of stores. Each entry has:
`slug`, `name`, `tagline`, `domain`, `grab_url`, `db_name_dev`, `db_name_prod`, `env_prefix`

### Per-store env files
`stores/<slug>.env` — used with `docker compose --env-file` for local dev.

| Variable | Used by | Example |
|---|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory | `phin-and-beans` |
| `STORE_NAME` | Backend API title, ECS env | `Phin and Beans` |
| `STORE_TAGLINE` | Frontend hero/tab | `Vietnamese-inspired...` |
| `STORE_DOMAIN` | CORS allowed origins | `phinandbeans.com` |
| `GRAB_URL` | "Order" button link in navbar | `https://food.grab.com/...` |
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) | `phin-and-beans-menu` |
| `OLLAMA_MODEL` | LLM model for menu chatbot | `llama3.2:1b` |
| `FRONTEND_PORT` / `BACKEND_PORT` | Docker port offsets | `5173`, `8000` |

### Per-store data files
Each store has its own CSV data at `backend/menus/<slug>/`. Backend loads at startup — no code changes needed to update content.

- `menu.csv` — `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `deals.csv` — `title, description, discount_type, discount_value, label, expires_at, badge`
- `locations.csv` — `name, address, city, state, zip, country, hours, phone`

`tags` pipe-separated: `hot|iced|popular`. `customizations`: `milk=Whole|Oat;size=12oz|16oz`. `item_id` blank → derived UUID from (store_slug + name).

### Static data generation
`scripts/generate-static-data.js` converts all store CSVs → `frontend/public/data/<slug>/{menu,deals,locations}.json`. Run via `make static-data`. These JSON files are committed and served by GitHub Pages.

## Architecture

### Request Flow — live mode
```
Browser → React SPA → Axios (/api/* proxy via Vite) → FastAPI → CSV/in-memory
                                                              ↳ Ollama (menu chatbot)
```

### Request Flow — static mode (GitHub Pages)
```
Browser → React SPA → fetch(/data/<slug>/*.json) → bundled JSON files
                     ChatBot → offline card (no Ollama)
```

### Frontend (`frontend/src/`)
- **`config/store.ts`** — single import for `STORE_NAME`, `STORE_TAGLINE`, `GRAB_URL`, `STORE_SLUG`; always import from here
- **`api/client.ts`** — Axios base instance
- **`api/staticClient.ts`** — fetch-based client that reads `/data/<slug>/` JSON; used when `VITE_STATIC_MODE=true`
- **`api/menu.ts`** / **`api/deals.ts`** / **`api/locations.ts`** — each checks `VITE_STATIC_MODE` and switches between Axios and static client
- **`api/chat.ts`** — `sendChatMessage(messages)` → POST `/api/chat/`
- **`components/layout/Navbar.tsx`** — sticky frosted-glass dark bar; amber active states; mobile hamburger
- **`components/layout/Footer.tsx`** — copyright, links, social icons
- **`components/ChatBot.tsx`** — live AI chat (Ollama) in live mode; offline card in static mode
- **`components/menu/MenuCard.tsx`** — 3D tilt + specular glare on mouse move; espresso-themed detail modal
- **`components/PhinBrewTimer.tsx`** — standalone countdown timer with SVG phin; not currently placed on any page

### Home page (`pages/Home.tsx`)
Contains several inlined components:
- **`AutoPhin`** — auto-looping SVG phin filter (drips + rising coffee level + steam, 12s loop); used in "Our Story" section
- **`CoffeeBean`** — inline SVG coffee bean shape
- **`FloatingBean`** — mouse-parallax wrapper for `CoffeeBean`; 8 instances in the hero, each at a different depth
- **`AnimatedTitle`** — per-letter stagger animation for the hero store name

### Design System
Dark Luxury Espresso theme throughout. Key CSS variables in `frontend/src/index.css`:

```css
--espresso: #140C08      /* page background */
--amber: #C8A96E         /* primary accent, CTAs */
--cream-warm: #F5EDD6    /* headings, body text on dark */
--glass-bg: rgba(255,255,255,0.04)   /* glassmorphism cards */
--glass-border: rgba(255,255,255,0.09)
```

CSS classes: `.luxury-hero`, `.luxury-blob-1/2/3` (animated gradient blobs), `.glass-card` (backdrop-blur glassmorphism), `.luxury-drink-card`, `.amber-rule`, `.luxury-section`.

The hero has: full-bleed coffee beans photo + dark gradient overlay + 3 animated gradient blobs + grain noise texture (`::before`) + 8 mouse-parallax floating SVG coffee beans.

### Backend (`backend/app/`)
- **`routers/`** — thin handlers; no auth deps on active routes
- **`config.py`** — all env vars via Pydantic `Settings`
- **`services/`** — `menu_loader.py`, `deals_loader.py`, `locations_loader.py` (CSV-backed)

### Ollama (local LLM)
- Docker service on port 11434; model persisted to `ollama_models` volume
- `ollama-init` one-shot service auto-pulls model on first run (exit 0 = normal)
- Backend uses `openai` Python package pointed at `http://ollama:11434/v1`
- Set `OLLAMA_MODEL` in store `.env`: `llama3.2:1b`, `mistral`, `gemma2`
- **Static mode:** chatbot is replaced by an offline card — no Ollama needed

## Static Mode (`VITE_STATIC_MODE`)

The single env var that controls live vs. static:

| `VITE_STATIC_MODE` | API source | Chatbot |
|---|---|---|
| `false` / unset | FastAPI backend | Live Ollama AI |
| `true` | `/data/<slug>/*.json` files | Offline card |

**To switch a store back to live mode:** remove `VITE_STATIC_MODE` from the build env. No code changes needed.

The static JSON files (`frontend/public/data/`) are committed to the repo and regenerated by `make static-data` whenever CSVs change.

## CI/CD Pipeline

### GitHub Pages (free, automatic)
`.github/workflows/gh-pages.yml` — triggers on push to `main`:
1. Runs `node scripts/generate-static-data.js` (CSV → JSON)
2. `npm ci && npm run build` with `VITE_STATIC_MODE=true`
3. Sets `base: '/ai_projects/'` in Vite (repo name path)
4. Generates `404.html` with SPA redirect script for React Router deep links
5. Deploys `frontend/dist/` to GitHub Pages

Store deployed to GitHub Pages is controlled by repo variables `VITE_STORE_SLUG`, `VITE_STORE_NAME`, `VITE_STORE_TAGLINE`, `VITE_GRAB_URL`. Defaults to phin-and-beans if not set.

### AWS CI/CD (per-store)
Three workflow files — one per store, triggered only by paths relevant to that store:
- `.github/workflows/ci-cd-phin-and-beans.yml`
- `.github/workflows/ci-cd-phin-drips.yml`
- `.github/workflows/ci-cd-daboba.yml`

```
build-backend   — Docker image → ECR
build-frontend  — Vite build (bakes VITE_* vars) → artifact
unit-test       — pytest
deploy-dev      — terraform apply + ECS rolling deploy + S3/CloudFront sync
e2e             — Playwright tests
deploy-prod     — main branch + manual approval only
```

## Terraform Layout

```
terraform/envs/
├── phin-and-beans/dev/   VPC: 10.0.0.0/16
├── phin-and-beans/prod/  VPC: 10.1.0.0/16
├── phin-drips/dev/       VPC: 10.2.0.0/16
├── phin-drips/prod/      VPC: 10.3.0.0/16
├── daboba/dev/           VPC: 10.4.0.0/16
└── daboba/prod/          VPC: 10.5.0.0/16
```

All envs share S3 state bucket `coffee-tea-app-tfstate` and DynamoDB lock table. No RDS deployed.

### Adding a new store
1. Add entry to `stores/stores.json`
2. Create `stores/<slug>.env` with next unused port set
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy `terraform/envs/phin-drips/` → `terraform/envs/<slug>/` — update locals, VPC CIDRs, S3 state key
5. Copy `.github/workflows/ci-cd-phin-drips.yml` → `ci-cd-<slug>.yml` — update all store values
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`
7. Test: `make up STORE=<slug>`

### GitHub Secrets naming
Pattern: `{ENV}_{PREFIX}_{VAR}` — e.g. `DEV_PAB_SECRET_KEY`, `PROD_PD_ACM_CERT_ARN`

Prefixes: `PAB` (Phin and Beans), `PD` (Phin Drips), `DB` (Daboba)

Shared: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`

Variable (not secret): `ECR_REPO`

GitHub Pages store override variables: `VITE_STORE_SLUG`, `VITE_STORE_NAME`, `VITE_STORE_TAGLINE`, `VITE_GRAB_URL`

## Environment Variables

Required in `backend/.env`:
- `STORE_NAME` / `STORE_SLUG` / `STORE_DOMAIN`
- `SECRET_KEY`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID`
- `ENVIRONMENT` — `development` uses in-memory menu
- `OLLAMA_BASE_URL` — `http://ollama:11434` in Docker; `http://localhost:11434` outside
- `OLLAMA_MODEL` — e.g. `llama3.2:1b`
- `GOOGLE_MAPS_API_KEY` — optional
- `AWS_REGION` / `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` — prod only

`DATABASE_URL` is **not** required — no database is deployed.

## Deployment

- **GitHub Pages** — free static deploy; `VITE_STATIC_MODE=true`; auto-deploys on push to `main` via `.github/workflows/gh-pages.yml`
- **Frontend (AWS)** — Vite build → S3 + CloudFront per store
- **Backend (AWS)** — single Docker image → ECR → ECS Fargate per store (env vars from Secrets Manager)
- **Ollama (prod)** — EC2 instance; set `OLLAMA_BASE_URL` in Secrets Manager
- **No database** — all data from CSV files
