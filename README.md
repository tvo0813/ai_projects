# Coffee Tea App

Multi-store Vietnamese-inspired coffee & tea shop platform. One codebase, multiple independent store deployments — each with its own domain, menu, database, and AWS infrastructure. Store identity is injected entirely through environment variables.

**Active stores:** Phin and Beans (`phin-and-beans`) · Phin Drips (`phin-drips`)

> **Current state:** Public-facing showcase/menu site. Customers browse the menu, view deals, find locations, and order via Grab Food. Order placement UI will be re-enabled in a future release.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Framer Motion |
| State | Zustand (auth + cart), persisted to localStorage |
| Backend | Python FastAPI + Uvicorn |
| Database | PostgreSQL 16 |
| Menu / Deals / Locations | Per-store CSVs in `backend/menus/<slug>/` (dev) · S3 (prod) |
| Auth | JWT — bcrypt passwords, python-jose tokens |
| Payments | Stripe (payment intents + webhook) |
| POS Sync | Square |
| Maps | Google Maps Embed API (keyed) with legacy fallback |
| Infrastructure | AWS ECS Fargate + RDS + S3/CloudFront, Terraform |
| CI/CD | GitHub Actions (per-store path-filtered workflows) |

---

## Table of Contents

1. [Local Development](#local-development)
2. [Multi-Store System](#multi-store-system)
3. [Pages & Features](#pages--features)
4. [AWS Setup — Do This Once](#aws-setup--do-this-once)
5. [GitHub Setup — Do This Once](#github-setup--do-this-once)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Adding a New Store](#adding-a-new-store)
8. [API Reference](#api-reference)

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+ (frontend-only dev)
- Python 3.11+ (backend-only dev)

### Run with Docker (recommended)

Both stores can run simultaneously on offset ports — each in its own terminal:

```bash
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |

The `-p` flag isolates each stack — separate Docker networks, containers, and named Postgres volumes. Port offsets are defined in each store's `.env` file.

### Restart backend after editing a CSV

Menu, deals, and locations CSVs are loaded at startup. After editing one:

```bash
docker compose -p phin-and-beans restart coffee-tea-api
# or
docker compose -p phin-drips restart coffee-tea-api
```

### Share locally with remote viewers (ngrok)

ngrok creates a public HTTPS tunnel to your local machine so anyone on the internet can view your app while it's running on your computer.

**One-time setup:**

1. Install ngrok: `brew install ngrok`
2. Sign up at [ngrok.com](https://ngrok.com) and get your auth token
3. `ngrok config add-authtoken <your-token>`
4. Set `allowedHosts: true` in `frontend/vite.config.ts` (already done in this repo — required for Vite 5 to accept non-localhost hosts)

**Start the tunnel:**

```bash
# Make sure the store is already running first
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up

# In a separate terminal
ngrok http 5173   # 5174 for Phin Drips
```

ngrok prints a public URL like `https://abc123.ngrok-free.dev` — share it and anyone can open the full app. The Vite dev server proxies `/api` and `/static` server-side so the backend works through the tunnel automatically.

> ⚠️ **Security considerations before sharing:**
> - Your local database is exposed through the tunnel — anyone with the URL can hit your API
> - `SECRET_KEY` in `backend/.env` defaults to `change-this-in-production` — change it before sharing
> - The tunnel is only active while ngrok is running; stop it with `Ctrl+C` when done
> - Free tier URLs change every time you restart ngrok — don't rely on them for anything persistent
> - **Never share a production database or real API keys through an ngrok tunnel**
>
> For quick demos with trusted people this is fine. For anything longer-term, deploy to AWS instead.

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

### Database migrations

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Tests

```bash
# Unit tests
cd backend && pip install -r requirements-test.txt && pytest

# E2E tests
cd tests/e2e && npm install && npx playwright install chromium
E2E_FRONTEND_URL=http://localhost:5173 E2E_API_URL=http://localhost:8000 npm test
```

### First admin user

Register via the app at `/register`, then promote directly in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Then navigate to `/admin`.

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
  "db_name_dev": "phin_and_beans_dev",
  "db_name_prod": "phin_and_beans",
  "env_prefix": "PAB"
}
```

`env_prefix` maps to the GitHub secret naming pattern (e.g. `PAB` → `DEV_PAB_DB_PASSWORD`).

### Per-store env files (`stores/<slug>.env`)

| Variable | Purpose |
|---|---|
| `STORE_SLUG` | Selects `backend/menus/<slug>/` data directory |
| `STORE_NAME` | API title, ECS env |
| `STORE_TAGLINE` | Frontend hero section |
| `STORE_DOMAIN` | Backend CORS allowed origin |
| `GRAB_URL` | "Order" button link in navbar |
| `POSTGRES_DB` | PostgreSQL database name |
| `MENU_S3_BUCKET` | S3 bucket for CSVs; blank = local only |
| `GOOGLE_MAPS_API_KEY` | Google Maps Embed API; blank = legacy fallback |
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets |

### Per-store data files

```
backend/menus/<slug>/
├── menu.csv        — drink menu (loaded at startup; restart backend after changes)
├── deals.csv       — public deals/promotions
├── locations.csv   — physical store locations
└── images/         — drink photos served at /static/images/
```

**menu.csv:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`
- `tags` pipe-separated: `hot|iced|popular|signature|coffee|matcha|latte|tea`
- Signature items tagged with their base category appear in both the Signature section and that base section
- `item_id` blank → stable UUID from `(store_slug + name)`
- `customizations`: `milk=Whole|Oat|Almond;size=12oz|16oz`

**deals.csv:** `title, description, discount_type, discount_value, label, expires_at, badge`

**locations.csv:** `name, address, city, state, zip, country, hours, phone`

### Terraform layout

```
terraform/envs/
├── phin-and-beans/dev/   VPC: 10.0.0.0/16
├── phin-and-beans/prod/  VPC: 10.1.0.0/16
├── phin-drips/dev/       VPC: 10.2.0.0/16
└── phin-drips/prod/      VPC: 10.3.0.0/16
```

Shared state: S3 `coffee-tea-app-tfstate` + DynamoDB lock `coffee-tea-app-tfstate-lock`. Dev → `us-east-2`, Prod → `us-east-1`.

### AWS resource naming

Pattern: `<store-slug>-<env>-<resource>`

- ECS cluster/service/task: `phin-and-beans-dev-cluster` / `phin-and-beans-dev-api`
- Container name: `coffee-tea-api`
- RDS: `phin-and-beans-dev-postgres`
- Secrets Manager: `phin-and-beans-dev/coffee-tea-secrets`
- ECR (shared): `coffee-tea-dev-api`
- S3 frontend: `phin-and-beans-dev-frontend`

---

## Pages & Features

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, Vietnam origin story, 4 pillars, live signature drinks |
| `/menu` | Menu | Section browse (Signature, Coffee, Matcha, Latte, Tea, Hot Drinks); circular cards; click for description |
| `/deals` | Deals | Active deals from `deals.csv`; empty state if none |
| `/locations` | Locations | Google Maps embed + address, hours, phone |
| `/careers` | Careers | Benefits, 3-step apply process, email CTA |
| `/privacy` | Privacy Policy | Loaded from `frontend/public/privacy-policy.txt` |
| `/login` | Login | Not in public nav — navigate directly |
| `/admin` | Admin Dashboard | Menu CRUD, deals, order management (admin only) |

---

## AWS Setup — Do This Once

### 1 — Bootstrap Terraform state

```bash
bash terraform/bootstrap.sh
```

Creates S3 bucket `coffee-tea-app-tfstate` and DynamoDB lock table.

### 2 — Create GitHub Actions IAM user

1. AWS Console → IAM → Create user `coffee-tea-app-github-actions`
2. Attach policy from `terraform/github-actions-iam-policy.json`
3. Create access key → save for GitHub secrets

### 3 — Create shared ECR repo

```bash
cd terraform/envs/dev
terraform init && terraform apply -var="secret_key=placeholder" -var="db_password=placeholder"
terraform output ecr_repo_url   # save this value
```

Per-store infrastructure is provisioned automatically by the pipeline on first run.

---

## GitHub Setup — Do This Once

### Secrets

**Settings → Secrets and variables → Actions → Secrets**

**Shared (not per-store):**

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `GOOGLE_MAPS_API_KEY` | Google Maps Embed API key |

**Phin and Beans (`PAB` prefix):**

| Dev | Prod |
|---|---|
| `DEV_PAB_DB_PASSWORD` | `PROD_PAB_DB_PASSWORD` |
| `DEV_PAB_SECRET_KEY` | `PROD_PAB_SECRET_KEY` |
| `DEV_PAB_STRIPE_SECRET_KEY` | `PROD_PAB_STRIPE_SECRET_KEY` |
| `DEV_PAB_STRIPE_WEBHOOK_SECRET` | `PROD_PAB_STRIPE_WEBHOOK_SECRET` |
| `DEV_PAB_SQUARE_ACCESS_TOKEN` | `PROD_PAB_SQUARE_ACCESS_TOKEN` |
| `DEV_PAB_SQUARE_LOCATION_ID` | `PROD_PAB_SQUARE_LOCATION_ID` |
| — | `PROD_PAB_ACM_CERT_ARN` |

**Phin Drips (`PD` prefix):** same pattern with `PD` in place of `PAB`.

**Pattern for new stores:** `{ENV}_{PREFIX}_{VAR}` e.g. `DEV_MNS_DB_PASSWORD`

### Variables

| Variable | Example |
|---|---|
| `ECR_REPO` | `123456789.dkr.ecr.us-east-1.amazonaws.com/coffee-tea-dev-api` |

### Environments

- **`dev`** — auto-deploys, no approval
- **`prod`** — enable Required Reviewers under Environment protection rules

---

## CI/CD Pipeline

**Two separate workflow files, one per store:**
- `.github/workflows/ci-cd-phin-and-beans.yml`
- `.github/workflows/ci-cd-phin-drips.yml`

**Smart path filtering — only the affected store deploys:**

| Changed path | PAB | PD |
|---|---|---|
| `backend/app/**`, `frontend/src/**` | ✅ | ✅ |
| `backend/menus/phin-and-beans/**` | ✅ | ❌ |
| `backend/menus/phin-drips/**` | ❌ | ✅ |
| `stores/phin-and-beans.env` | ✅ | ❌ |
| `terraform/envs/phin-and-beans/**` | ✅ | ❌ |

**Pipeline stages (identical in both workflows):**

```
push / PR (matching paths)
    │
    ├─ build-backend    Docker image → ECR (git SHA tag)
    ├─ build-frontend   Vite build (bakes VITE_STORE_NAME/TAGLINE/GRAB_URL) → artifact
    ├─ unit-test        pytest, SQLite in-memory
    │
    ▼ (all pass)
    │
    ├─ deploy-dev       terraform apply → ECS deploy → DB migrations → S3/CloudFront
    ├─ e2e              Playwright against live dev URL
    │
    ▼ (push to main only)
    │
    └─ deploy-prod      same as deploy-dev + manual approval gate
```

Each workflow has its own concurrency group so they never cancel each other.

### AWS architecture (per store)

```
Users
  ├─ HTTPS → CloudFront → S3          (React SPA, store-specific build)
  └─ /api/* → ALB → ECS Fargate       (FastAPI, private subnets)
                        ├─ RDS PostgreSQL
                        └─ Secrets Manager
```

---

## Adding a New Store

1. Add entry to `stores/stores.json`
2. Create `stores/<slug>.env` with all variables + unique port offsets
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy Terraform: `cp -r terraform/envs/phin-drips terraform/envs/<slug>` — update locals, VPC CIDRs, state key, db_name
5. Copy workflow: `cp .github/workflows/ci-cd-phin-drips.yml .github/workflows/ci-cd-<slug>.yml` — update all store-specific values
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`, `PROD_{PREFIX}_ACM_CERT_ARN`
7. Test: `docker compose --env-file stores/<slug>.env -p <slug> up`

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Create account, returns JWT |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/menu/` | Public | List items (`?category=` optional) |
| GET | `/api/menu/categories` | Public | List categories |
| GET | `/api/menu/{id}` | Public | Get single item |
| POST | `/api/menu/` | Admin | Create item |
| PUT | `/api/menu/{id}` | Admin | Update item |
| DELETE | `/api/menu/{id}` | Admin | Delete item |
| GET | `/api/deals/public` | Public | Active deals (no auth) |
| POST | `/api/deals/spin` | User | Spin wheel, returns deal code |
| GET | `/api/deals/validate/{code}` | User | Validate deal code |
| POST | `/api/deals/` | Admin | Create deal |
| PATCH | `/api/deals/{id}/toggle` | Admin | Toggle deal on/off |
| GET | `/api/locations/` | Public | Store locations with Maps URLs |
| GET | `/api/users/me` | User | Current user profile |
| GET | `/api/users/` | Admin | List all users |
| POST | `/api/users/{id}/make-admin` | Admin | Promote to admin |
| GET | `/static/images/{filename}` | Public | Local menu item images |
