# Coffee Tea App

Multi-store Vietnamese-inspired coffee & tea shop platform. One codebase, multiple independent store deployments — each with its own domain, menu, and AWS infrastructure. Store identity is injected entirely through environment variables.

**Active stores:** Phin and Beans (`phin-and-beans`) · Phin Drips (`phin-drips`) · Daboba (`daboba`)

> **Current state:** Public-facing showcase/menu site. No auth, login, admin, or database deployed. Customers browse the menu, view deals, find locations, order via Grab Food, and chat with a menu AI assistant.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Framer Motion |
| Backend | Python FastAPI + Uvicorn |
| Data | Per-store CSVs in `backend/menus/<slug>/` (dev) · DynamoDB (prod) |
| Payments | Stripe (configured, not in active UI) |
| POS Sync | Square (configured, not in active UI) |
| Maps | Google Maps Embed API (keyed) with legacy fallback |
| Menu Chatbot | Ollama (`llama3.2:1b`) — runs locally in Docker, no API costs |
| Infrastructure | AWS ECS Fargate + S3/CloudFront, Terraform |
| CI/CD | GitHub Actions (per-store path-filtered workflows + GitHub Pages static deploy) |

---

## Table of Contents

1. [Local Development](#local-development)
2. [Makefile Commands](#makefile-commands)
3. [Multi-Store System](#multi-store-system)
4. [Pages & Features](#pages--features)
5. [Frontend Design System](#frontend-design-system)
6. [GitHub Pages (Free Static Deploy)](#github-pages-free-static-deploy)
7. [First-Time AWS Deployment](#first-time-aws-deployment)
8. [What the CI/CD Pipeline Does Automatically](#what-the-cicd-pipeline-does-automatically)
9. [GitHub Secrets Reference](#github-secrets-reference)
10. [Deployment Troubleshooting](#deployment-troubleshooting)
11. [Adding a New Store](#adding-a-new-store)
12. [API Reference](#api-reference)

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+ (frontend-only dev)
- Python 3.11+ (backend-only dev)

### Run with Docker (recommended)

All three stores can run simultaneously — each in its own terminal:

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

> **First startup:** Ollama pulls `llama3.2:1b` (~1.3 GB) automatically. Subsequent starts are instant — the model is cached in the `ollama_models` Docker volume.

### Run frontend only

```bash
cd frontend && npm install && npm run dev
```

### Run backend only

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Tests

```bash
# Unit tests
cd backend && pip install -r requirements-test.txt && pytest

# E2E tests
cd tests/e2e && npm install && npx playwright install chromium
E2E_FRONTEND_URL=http://localhost:5173 E2E_API_URL=http://localhost:8000 npm test
```

---

## Makefile Commands

A `Makefile` at the repo root wraps all common operations.

### Per-store (always pass `STORE=`)

```bash
make up      STORE=phin-and-beans   # build + start
make down    STORE=phin-drips       # stop containers
make restart STORE=daboba           # rebuild + restart
make build   STORE=phin-and-beans   # rebuild images only
make logs    STORE=phin-drips       # tail all logs
make logs-web STORE=phin-drips      # frontend logs only
make logs-api STORE=phin-drips      # backend logs only
make ps      STORE=phin-and-beans   # show running containers
make clean   STORE=phin-drips       # stop + wipe volumes
make open    STORE=phin-and-beans   # open in browser
make expose  STORE=phin-and-beans   # ngrok public tunnel
```

### All stores at once

```bash
make up-all      # spin up all 3
make down-all    # stop all 3
make clean-all   # full teardown all 3
make ps-all      # container status all 3
make status      # health check — shows ✓/✗ per store with ports
```

### GitHub Pages (static build)

```bash
make static-data                     # generate JSON from all store CSVs
make static-build STORE=phin-drips   # full static build for GitHub Pages
make static-preview STORE=phin-drips # build + preview locally at :4173
```

### Housekeeping

```bash
make nuke    # remove ALL Docker containers/volumes/networks (asks to confirm)
make prune   # docker system prune to reclaim disk
```

---

## Multi-Store System

### Store registry

`stores/stores.json` is the authoritative list. Each entry:

```json
{
  "slug": "phin-and-beans",
  "name": "Phin and Beans",
  "tagline": "Vietnamese-inspired coffee & tea, crafted with care.",
  "domain": "phinandbeans.com",
  "grab_url": "https://food.grab.com/your-phin-and-beans-listing",
  "env_prefix": "PAB"
}
```

### Per-store env files (`stores/<slug>.env`)

| Variable | Purpose |
|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory |
| `STORE_NAME` | API title, ECS env |
| `STORE_TAGLINE` | Frontend hero section |
| `STORE_DOMAIN` | Backend CORS allowed origin |
| `GRAB_URL` | "Order" button link in navbar |
| `POSTGRES_DB` | Local dev PostgreSQL database name |
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) |
| `OLLAMA_MODEL` | Ollama model name (default: `llama3.2:1b`) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets |

### Per-store data files

```
backend/menus/<slug>/
├── menu.csv        — drink menu
├── deals.csv       — public deals/promotions
└── locations.csv   — physical store locations
```

**menu.csv columns:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `tags` pipe-separated: `hot|iced|popular|signature|coffee|matcha|latte|tea`
- `customizations`: `milk=Whole|Oat|Almond;size=12oz|16oz`
- `item_id` blank → stable UUID derived from `(store_slug + name)`

**deals.csv:** `title, description, discount_type, discount_value, label, expires_at, badge`

**locations.csv:** `name, address, city, state, zip, country, hours, phone`

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

Shared state: S3 `coffee-tea-app-tfstate` + DynamoDB lock `coffee-tea-app-tfstate-lock`.

---

## Pages & Features

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero (coffee beans bg + mouse-parallax floating beans), Vietnam origin story with live auto-brewing phin SVG, 4 pillars (glassmorphism cards), signature drinks, menu chatbot |
| `/menu` | Menu | Section browse (Signature, Coffee, Matcha, Latte, Tea, Hot Drinks); 3D magnetic cards with mouse-tracking tilt + specular glare; click for detail modal |
| `/deals` | Deals | Active deals from `deals.csv` |
| `/locations` | Locations | Google Maps embed + address, hours, phone |
| `/careers` | Careers | Benefits, 3-step apply process, email CTA |
| `/privacy` | Privacy Policy | Loaded from `frontend/public/privacy-policy.txt` |

### Menu Chatbot

AI assistant powered by Ollama (`llama3.2:1b`) running locally in Docker. In static/GitHub Pages mode it shows an offline card instead. Rules:
- Menu items and drink selection only
- Always lists 3+ drinks with prices when recommending
- Oat milk available as dairy-free substitute for extra charge

---

## Frontend Design System

The frontend uses a **Dark Luxury Espresso** design — deep espresso backgrounds, amber gold accents, glassmorphism cards, and animated SVGs.

### CSS Design Tokens (`frontend/src/index.css`)

```css
/* Original green palette (still used on menu/deals/locations pages) */
--green:        #00704A;
--green-dark:   #1E3932;
--cream:        #F2F0EB;

/* Dark Luxury Espresso (home page + navbar) */
--espresso:       #140C08;
--espresso-mid:   #1E1009;
--espresso-light: #3A1E0F;
--amber:          #C8A96E;
--amber-light:    #E8D5A3;
--amber-dark:     #9E7A3F;
--cream-warm:     #F5EDD6;
--glass-bg:       rgba(255,255,255,0.04);
--glass-border:   rgba(255,255,255,0.09);
```

### Key Components

| Component | Location | What it does |
|---|---|---|
| `Navbar.tsx` | `components/layout/` | Sticky frosted-glass dark bar; amber active states |
| `ChatBot.tsx` | `components/` | Live AI chat (Ollama) or offline card in static mode |
| `MenuCard.tsx` | `components/menu/` | 3D tilt + specular glare on mouse move; dark modal |
| `PhinBrewTimer.tsx` | `components/` | Standalone auto-brew timer component (available but not placed on any page) |
| `AutoPhin` | inlined in `Home.tsx` | SVG phin filter that auto-drips and fills a glass on a 12s loop |
| `CoffeeBean` / `FloatingBean` | inlined in `Home.tsx` | Mouse-parallax floating SVG coffee beans in the hero |
| `AnimatedTitle` | inlined in `Home.tsx` | Per-letter stagger animation for the hero store name |

### Static Mode (`VITE_STATIC_MODE=true`)

When `VITE_STATIC_MODE=true` is set at build time:
- `api/menu.ts`, `api/deals.ts`, `api/locations.ts` read from `/data/<slug>/*.json` instead of the backend
- `ChatBot.tsx` renders an offline card ("available in-store")
- No backend or Ollama required

To re-enable the live backend: remove `VITE_STATIC_MODE` or set it to `false`.

---

## GitHub Pages (Free Static Deploy)

Deploy any store as a fully static site — no backend, no Docker, no cost.

### How it works

1. `scripts/generate-static-data.js` converts all store CSVs → `frontend/public/data/<slug>/*.json`
2. Vite builds with `VITE_STATIC_MODE=true` — API calls read the JSON files, chatbot shows offline card
3. GitHub Actions deploys `frontend/dist/` to GitHub Pages automatically on every push to `main`

### Workflow file

`.github/workflows/gh-pages.yml` — triggers on pushes to `main` that touch `frontend/`, `backend/menus/`, or the workflow itself.

### Setup (one-time)

1. Go to your repo → **Settings → Pages → Source → GitHub Actions**
2. Push to `main` — the workflow fires automatically

Your site: `https://<your-username>.github.io/<repo-name>`

### Choose which store to deploy

**Option A — GitHub repo variables (no code change needed):**
Settings → Variables → Actions → add:

| Variable | Value |
|---|---|
| `VITE_STORE_SLUG` | `phin-drips` |
| `VITE_STORE_NAME` | `Phin Drips` |
| `VITE_STORE_TAGLINE` | `Bold Vietnamese drip coffee, your way.` |
| `VITE_GRAB_URL` | your Grab URL |

**Option B — Change defaults in the workflow file** (`gh-pages.yml` build step env vars).

### Local static preview

```bash
make static-build STORE=phin-drips    # build
make static-preview STORE=phin-drips  # build + serve at localhost:4173
```

### Regenerate data after editing CSVs

```bash
make static-data   # regenerates all stores' JSON
git add frontend/public/data/
git commit -m "update menu data"
git push origin main   # triggers re-deploy
```

---

## First-Time AWS Deployment

This is everything you must do **once before your first push**. After this, CI/CD handles everything.

### Step 1 — AWS IAM user for GitHub Actions

1. Go to **AWS Console → IAM → Users → Create user**
2. Name: `coffee-tea-app-github-actions`
3. Attach the policy from `terraform/github-actions-iam-policy.json`
4. Create access key → save `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Step 2 — Bootstrap Terraform remote state

```bash
bash terraform/bootstrap.sh
```

Creates S3 bucket `coffee-tea-app-tfstate` + DynamoDB lock table.

### Step 3 — Create the ECR repository

```bash
aws ecr create-repository --repository-name coffee-tea-api --region us-east-2
```

Save the `repositoryUri` as your `ECR_REPO` GitHub variable.

### Step 4 — Request ACM certificates (prod only)

CloudFront requires SSL certificates in **us-east-1**.

For each store domain: Certificate Manager → us-east-1 → Request public certificate → DNS validation → save the Certificate ARN as `PROD_{PREFIX}_ACM_CERT_ARN`.

### Step 5 — Set up Ollama for prod

1. Launch EC2 (`t3.medium` minimum) in the same region as ECS
2. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh && ollama pull llama3.2:1b`
3. Enable on boot: `sudo systemctl enable ollama`
4. Allow TCP 11434 inbound from the ECS security group
5. Save `http://<private-ip>:11434` as `OLLAMA_BASE_URL`

### Step 6 — Add GitHub Secrets and Variables

**Variables:** `ECR_REPO`

**Shared secrets:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`

**Per-store secrets** (pattern: `{ENV}_{PREFIX}_{VAR}`):
`SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `OLLAMA_BASE_URL`, `ACM_CERT_ARN` (prod only)

Store prefixes: `PAB` (Phin and Beans), `PD` (Phin Drips), `DB` (Daboba)

### Step 7 — Create GitHub Environments

Settings → Environments:
1. **`dev`** — no protection rules
2. **`prod`** — enable Required reviewers (manual approval gate)

### Step 8 — Push to trigger first deploy

```bash
git push origin main
```

First run provisions all AWS infrastructure — expect 10–15 minutes.

---

## What the CI/CD Pipeline Does Automatically

Three workflow files — one per store, path-filtered:

```
push to main
    │
    ├─ build-backend    Docker image → ECR
    ├─ build-frontend   Vite build (bakes store env vars) → artifact
    ├─ unit-test        pytest
    │
    ▼
    ├─ deploy-dev       terraform apply + ECS rolling deploy + S3/CloudFront sync
    ├─ e2e              Playwright tests against live dev URL
    │
    ▼ (manual approval)
    └─ deploy-prod      same as deploy-dev against prod environment
```

---

## GitHub Secrets Reference

Pattern: `{ENV}_{PREFIX}_{VAR}`

| Part | Values |
|---|---|
| `ENV` | `DEV` or `PROD` |
| `PREFIX` | `PAB`, `PD`, `DB` |
| `VAR` | `SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `OLLAMA_BASE_URL` |

Prod-only: `PROD_{PREFIX}_ACM_CERT_ARN`

Shared: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`

Variable (not secret): `ECR_REPO`

---

## Deployment Troubleshooting

### Terraform / AWS

**`NoSuchBucket` on state backend** — run `bash terraform/bootstrap.sh`

**`InvalidClientTokenId`** — AWS secret wrong or has whitespace, re-add both secrets

**`RepositoryNotFoundException`** — create ECR repo (Step 3) or fix `ECR_REPO` variable

**ECS task stuck in PENDING** — check CloudWatch logs (`/ecs/<store>-dev-api`), confirm all Secrets Manager keys exist

**`exec format error` in ECS** — image built on Apple Silicon; add `--platform linux/amd64` to Docker build

### GitHub Pages

**Blank page / 404 on assets** — `vite.config.ts` sets `base: '/ai_projects/'` in static mode; confirm it matches your repo name

**Deep link routes 404** — `404.html` redirect script handles this; confirm it was generated by the workflow

**Menu/deals empty** — static JSON wasn't generated; run `make static-data` and commit `frontend/public/data/`

### Chatbot

**Dev (Docker): 500 error** — Ollama still pulling model, wait for `ollama-init` to exit 0; run `docker exec <ollama-container> ollama list` to confirm

**Prod (ECS): 500 error** — check `OLLAMA_BASE_URL` in Secrets Manager; verify EC2 security group allows port 11434

---

## Adding a New Store

1. Add entry to `stores/stores.json` with unique `slug` and `env_prefix`
2. Create `stores/<slug>.env` with all variables + unique port offsets
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy Terraform: `cp -r terraform/envs/phin-drips terraform/envs/<slug>` — update `locals`, VPC CIDRs, S3 state key
5. Copy workflow: `cp .github/workflows/ci-cd-phin-drips.yml .github/workflows/ci-cd-<slug>.yml` — update all store-specific values
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`
7. Test locally: `make up STORE=<slug>`

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/menu/` | List items (`?category=` optional) |
| GET | `/api/menu/categories` | List categories |
| GET | `/api/menu/{id}` | Get single item |
| GET | `/api/deals/public` | Active deals |
| GET | `/api/locations/` | Store locations with Maps URLs |
| POST | `/api/chat/` | Menu chatbot (Ollama) |
| GET | `/static/images/{filename}` | Menu item images |
