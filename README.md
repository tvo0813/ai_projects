# Coffee Tea App

Multi-store Vietnamese-inspired coffee & tea shop platform. One codebase, multiple independent store deployments — each with its own domain, menu, database, and AWS infrastructure. Store identity is injected entirely through environment variables.

**Active stores:** Phin and Beans (`phin-and-beans`) · Phin Drips (`phin-drips`)

> **Current state:** Public-facing showcase/menu site. Customers browse the menu, view deals, find locations, order via Grab Food, and chat with a menu AI assistant. Order placement UI will be re-enabled in a future release.

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
| Menu Chatbot | Ollama (`llama3.2:1b`) — runs locally in Docker, no API costs |
| Infrastructure | AWS ECS Fargate + RDS + S3/CloudFront, Terraform |
| CI/CD | GitHub Actions (per-store path-filtered workflows) |

---

## Table of Contents

1. [Local Development](#local-development)
2. [Dev Script](#dev-script)
3. [Multi-Store System](#multi-store-system)
4. [Pages & Features](#pages--features)
5. [First-Time Deployment — Manual Setup](#first-time-deployment--manual-setup)
6. [What the CI/CD Pipeline Does Automatically](#what-the-cicd-pipeline-does-automatically)
7. [GitHub Secrets Reference](#github-secrets-reference)
8. [Deployment Troubleshooting](#deployment-troubleshooting)
9. [Adding a New Store](#adding-a-new-store)
10. [API Reference](#api-reference)

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+ (frontend-only dev)
- Python 3.11+ (backend-only dev)

### Run with Docker (recommended)

Both stores can run simultaneously — each in its own terminal:

```bash
docker compose --env-file stores/phin-and-beans.env -p phin-and-beans up
docker compose --env-file stores/phin-drips.env     -p phin-drips     up
```

| Store | Frontend | Backend API | Swagger |
|---|---|---|---|
| Phin and Beans | http://localhost:5173 | http://localhost:8000 | http://localhost:8000/api/docs |
| Phin Drips | http://localhost:5174 | http://localhost:8001 | http://localhost:8001/api/docs |

> **First startup:** Ollama pulls `llama3.2:1b` (~1.3 GB) automatically. Subsequent starts are instant — the model is cached in the `ollama_models` Docker volume.

The `-p` flag isolates each stack with separate Docker networks, containers, and named Postgres volumes. Port offsets are defined in each store's `.env` file.

### Restart backend after editing a CSV

```bash
docker compose -p phin-and-beans restart coffee-tea-api
```

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

Register at `/register`, then promote in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

---

## Dev Script

`scripts/dev.sh` wraps the Docker commands for convenience.

```bash
./scripts/dev.sh phin-and-beans              # start store
./scripts/dev.sh phin-drips                  # start other store
./scripts/dev.sh phin-and-beans --expose     # start + ngrok tunnel
./scripts/dev.sh phin-and-beans --clean      # full wipe + rebuild (fixes node_modules errors)
```

### `--expose` (ngrok)

Creates a public HTTPS tunnel so anyone can view your local app.

**One-time setup:**
1. `brew install ngrok`
2. Sign up at ngrok.com, get your auth token
3. `ngrok config add-authtoken <your-token>`

> ⚠️ Only share with trusted people. Your local database and API are exposed while the tunnel is active. Stop it with `Ctrl+C` when done. Free tier URLs change on every restart.

### `--clean` (fix corrupted node_modules)

If you get a Vite error like `Cannot find module .../vite/dist/node/chunks/dep-*.js`, the `node_modules` inside Docker is corrupted. Run:

```bash
./scripts/dev.sh phin-and-beans --clean
```

This removes all containers and volumes with `phin` in the name (including anonymous node_modules volumes), then does a full `--build` restart. The Ollama model volume is preserved because it doesn't contain `phin`.

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

`env_prefix` maps directly to GitHub secret names (e.g. `PAB` → `DEV_PAB_DB_PASSWORD`).

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
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod) |
| `OLLAMA_MODEL` | Ollama model name (default: `llama3.2:1b`) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `DB_PORT` / `DB_VOLUME` | Docker port offsets |

### Per-store data files

```
backend/menus/<slug>/
├── menu.csv        — drink menu (restart backend after changes)
├── deals.csv       — public deals/promotions
├── locations.csv   — physical store locations
└── images/         — drink photos served at /static/images/
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
└── phin-drips/prod/      VPC: 10.3.0.0/16
```

Shared state: S3 `coffee-tea-app-tfstate` + DynamoDB lock `coffee-tea-app-tfstate-lock`. Dev → `us-east-2`, Prod → `us-east-1`.

---

## Pages & Features

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, Vietnam origin story, 4 pillars, live signature drinks, menu chatbot |
| `/menu` | Menu | Section browse (Signature, Coffee, Matcha, Latte, Tea, Hot Drinks); circular cards; click for description modal |
| `/deals` | Deals | Active deals from `deals.csv`; spin wheel; empty state if none |
| `/locations` | Locations | Google Maps embed + address, hours, phone |
| `/careers` | Careers | Benefits, 3-step apply process, email CTA |
| `/privacy` | Privacy Policy | Loaded from `frontend/public/privacy-policy.txt` |
| `/login` | Login | Not in public nav — navigate directly |
| `/admin` | Admin Dashboard | Menu CRUD, deals, order management (admin only) |

### Menu Chatbot

The Home page includes an AI assistant powered by Ollama (`llama3.2:1b`) running locally in Docker. It is strictly restricted to discussing items on the menu — it will redirect any off-topic questions. No API key or external service required.

---

## First-Time Deployment — Manual Setup

This is everything you must do **once before your first push**. After this, the CI/CD pipeline handles everything automatically.

### Step 1 — AWS IAM user for GitHub Actions

1. Go to **AWS Console → IAM → Users → Create user**
2. Name: `coffee-tea-app-github-actions`
3. Select **Attach policies directly → Create policy**
4. Paste the contents of `terraform/github-actions-iam-policy.json` as JSON → name it `coffee-tea-github-actions`
5. Attach that policy to the user
6. Go to the user → **Security credentials → Create access key**
7. Select **Third-party service** → save the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Step 2 — Bootstrap Terraform remote state

Run this **once** from your local machine with your personal AWS credentials (not the GitHub Actions user):

```bash
bash terraform/bootstrap.sh
```

This creates:
- S3 bucket `coffee-tea-app-tfstate` (versioned + encrypted) — stores all Terraform state
- DynamoDB table `coffee-tea-app-tfstate-lock` — prevents concurrent Terraform runs from corrupting state

If this fails, check that your local AWS credentials have S3 and DynamoDB create permissions.

### Step 3 — Create the ECR repository

```bash
aws ecr create-repository --repository-name coffee-tea-api --region us-east-2
```

The output includes `repositoryUri` — save it. It looks like:
```
123456789012.dkr.ecr.us-east-2.amazonaws.com/coffee-tea-api
```

This is your `ECR_REPO` GitHub variable.

### Step 4 — Request ACM certificates (prod only)

CloudFront requires SSL certificates in **us-east-1** (regardless of where your resources are).

For each store domain:
1. **AWS Console → Certificate Manager → Switch region to us-east-1**
2. **Request a public certificate**
3. Add domains: `phinandbeans.com` and `www.phinandbeans.com`
4. Choose **DNS validation**
5. AWS gives you CNAME records — add them to your domain registrar (GoDaddy, Namecheap, etc.)
6. Wait for status to show **Issued** (can take a few minutes)
7. Copy the **Certificate ARN** — save it as `PROD_PAB_ACM_CERT_ARN`

Repeat for `phindrips.com` → save as `PROD_PD_ACM_CERT_ARN`.

> You can skip this for dev — dev deployments don't use custom domains.

### Step 5 — Set up Ollama for prod

Ollama runs in Docker locally, but in production it needs to be a server that ECS can reach. The simplest setup:

1. Launch an EC2 instance (`t3.medium` minimum — 2 vCPU, 4GB RAM) in the same region as your ECS services
2. SSH in and install Ollama:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull llama3.2:1b
   ```
3. Make Ollama start on boot:
   ```bash
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```
4. In your EC2 security group, add an inbound rule: **TCP port 11434** from the ECS security group
5. Note the EC2 **private IP** (e.g. `10.0.5.100`) — your `OLLAMA_BASE_URL` is `http://10.0.5.100:11434`

> You can share one Ollama instance across both stores and both dev/prod environments as long as it's in a VPC both ECS clusters can reach.

### Step 6 — Add GitHub Secrets and Variables

Go to your repo → **Settings → Secrets and variables → Actions**

#### Variables (plain text, not secret)

| Variable | Value |
|---|---|
| `ECR_REPO` | Full ECR URI from Step 3 |

#### Shared Secrets

| Secret | Value | Where to get it |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key | Step 1 |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key | Step 1 |
| `GOOGLE_MAPS_API_KEY` | Maps Embed API key | Google Cloud Console → APIs & Services → Credentials (optional — maps work without it via legacy fallback) |

#### Phin and Beans Secrets

| Secret | Value |
|---|---|
| `DEV_PAB_DB_PASSWORD` | Any strong password (min 16 chars) — you choose, Terraform creates the RDS instance with this |
| `DEV_PAB_SECRET_KEY` | Long random string for JWT signing — run `openssl rand -hex 32` |
| `DEV_PAB_STRIPE_SECRET_KEY` | From Stripe dashboard → Developers → API keys (use test key for dev) |
| `DEV_PAB_STRIPE_WEBHOOK_SECRET` | From Stripe dashboard → Webhooks → signing secret |
| `DEV_PAB_SQUARE_ACCESS_TOKEN` | From Square Developer dashboard (or leave blank — Square is optional) |
| `DEV_PAB_SQUARE_LOCATION_ID` | From Square dashboard (or leave blank) |
| `DEV_PAB_OLLAMA_BASE_URL` | Private IP URL of your Ollama EC2 (Step 5), e.g. `http://10.0.5.100:11434` |
| `PROD_PAB_DB_PASSWORD` | Different strong password for prod |
| `PROD_PAB_SECRET_KEY` | Different random string for prod — run `openssl rand -hex 32` |
| `PROD_PAB_STRIPE_SECRET_KEY` | Live Stripe key for prod |
| `PROD_PAB_STRIPE_WEBHOOK_SECRET` | Live Stripe webhook secret for prod |
| `PROD_PAB_SQUARE_ACCESS_TOKEN` | Prod Square token |
| `PROD_PAB_SQUARE_LOCATION_ID` | Prod Square location |
| `PROD_PAB_OLLAMA_BASE_URL` | Prod Ollama server URL |
| `PROD_PAB_ACM_CERT_ARN` | Certificate ARN for phinandbeans.com from Step 4 |

#### Phin Drips Secrets (same pattern, `PD` prefix)

| Secret | Value |
|---|---|
| `DEV_PD_DB_PASSWORD` | Strong password |
| `DEV_PD_SECRET_KEY` | `openssl rand -hex 32` |
| `DEV_PD_STRIPE_SECRET_KEY` | Stripe test key |
| `DEV_PD_STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `DEV_PD_SQUARE_ACCESS_TOKEN` | Square token (or blank) |
| `DEV_PD_SQUARE_LOCATION_ID` | Square location (or blank) |
| `DEV_PD_OLLAMA_BASE_URL` | Ollama server URL |
| `PROD_PD_DB_PASSWORD` | Strong password |
| `PROD_PD_SECRET_KEY` | `openssl rand -hex 32` |
| `PROD_PD_STRIPE_SECRET_KEY` | Prod Stripe key |
| `PROD_PD_STRIPE_WEBHOOK_SECRET` | Prod Stripe webhook |
| `PROD_PD_SQUARE_ACCESS_TOKEN` | Prod Square token |
| `PROD_PD_SQUARE_LOCATION_ID` | Prod Square location |
| `PROD_PD_OLLAMA_BASE_URL` | Prod Ollama server URL |
| `PROD_PD_ACM_CERT_ARN` | Certificate ARN for phindrips.com from Step 4 |

### Step 7 — Create GitHub Environments

Go to **Settings → Environments**:

1. Create **`dev`** — no protection rules needed
2. Create **`prod`** — enable **Required reviewers** and add yourself. This creates the manual approval gate that blocks prod deploys until you click approve.

### Step 8 — Push code to trigger the first deploy

```bash
git push origin main
```

The workflow runs automatically. Watch it at **Actions** tab in your repo. On first run, Terraform will create all AWS infrastructure from scratch — expect 10–15 minutes.

---

## What the CI/CD Pipeline Does Automatically

Once the manual setup above is done, every push triggers this automatically:

### Trigger logic

Two separate workflow files — one per store. Each only triggers on paths relevant to that store:

| Changed path | PAB workflow | PD workflow |
|---|---|---|
| `backend/app/**`, `frontend/src/**` | ✅ | ✅ |
| `docker-compose.yml` | ✅ | ✅ |
| `backend/menus/phin-and-beans/**` | ✅ | ❌ |
| `backend/menus/phin-drips/**` | ❌ | ✅ |
| `stores/phin-and-beans.env` | ✅ | ❌ |
| `terraform/envs/phin-and-beans/**` | ✅ | ❌ |

### Pipeline stages

```
push / PR (matching paths)
    │
    ├─ build-backend    Docker image → ECR (tagged with git SHA + latest)
    ├─ build-frontend   Vite build (bakes VITE_STORE_NAME/TAGLINE/GRAB_URL) → artifact
    ├─ unit-test        pytest
    │
    ▼ (all pass)
    │
    ├─ deploy-dev       terraform apply
    │                   → provisions VPC, RDS, ECS cluster, ALB, Secrets Manager,
    │                     S3 bucket, CloudFront distribution (first run only)
    │                   → force new ECS deployment (rolling update)
    │                   → alembic upgrade head (one-off ECS task)
    │                   → aws s3 sync dist/ + CloudFront invalidation
    │
    ├─ e2e              Playwright tests against live dev URL
    │
    ▼ (push to main only + manual approval)
    │
    └─ deploy-prod      same as deploy-dev against prod environment
```

### AWS resources Terraform creates automatically

On first run, Terraform provisions everything from scratch:

| Resource | What it is |
|---|---|
| VPC + subnets | Isolated network per store (public + private subnets across 2 AZs) |
| Internet Gateway + NAT Gateway | Public internet access for ALB; outbound-only for ECS |
| Security groups | ALB (80/443 open), ECS (8000 from ALB only) |
| ALB + target group | Load balancer routing traffic to ECS |
| ECS cluster + task definition | Runs the FastAPI container on Fargate |
| ECS service | Manages rolling deploys, health checks |
| RDS PostgreSQL | Managed database (t3.micro dev, t3.small prod with multi-AZ) |
| Secrets Manager | Stores DB password, secret key, Stripe/Square keys — ECS reads them at runtime |
| IAM roles | Task execution role (pull ECR + read Secrets Manager) + task role (DynamoDB access) |
| S3 bucket | Hosts the frontend static build |
| CloudFront distribution | CDN in front of S3 (HTTPS, caching) |
| CloudWatch log group | ECS container logs, 14-day retention (30-day prod) |

---

## GitHub Secrets Reference

Quick reference for the naming pattern: `{ENV}_{PREFIX}_{VAR}`

| Part | Values |
|---|---|
| `ENV` | `DEV` or `PROD` |
| `PREFIX` | `PAB` (Phin and Beans) or `PD` (Phin Drips) |
| `VAR` | `DB_PASSWORD`, `SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `OLLAMA_BASE_URL` |

Prod-only additions: `PROD_{PREFIX}_ACM_CERT_ARN`

Shared (no prefix): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_MAPS_API_KEY`

Repository variable (not secret): `ECR_REPO`

---

## Deployment Troubleshooting

### Terraform apply fails on first run

**Error: `NoSuchBucket` or `AccessDenied` on state backend**
- You haven't run `bootstrap.sh` yet, or it failed — run it now
- Or your GitHub Actions IAM user doesn't have S3 access — check the policy in `terraform/github-actions-iam-policy.json` is attached

**Error: `InvalidClientTokenId` or `AuthFailure`**
- `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` secret is wrong or has a leading/trailing space
- Go to Settings → Secrets → delete and re-add both

**Error: `RepositoryNotFoundException` on ECR push**
- You didn't create the ECR repo in Step 3 — run `aws ecr create-repository --repository-name coffee-tea-api --region us-east-2`
- Or `ECR_REPO` variable has the wrong value — confirm it matches the `repositoryUri` from ECR exactly

### ECS deploy fails

**Error: ECS service stuck in `PENDING` or health checks failing**
- Check CloudWatch logs: AWS Console → CloudWatch → Log groups → `/ecs/phin-and-beans-dev-api`
- Common cause: `DATABASE_URL` is wrong — the Secrets Manager secret may not have been created correctly
- Check Secrets Manager: AWS Console → Secrets Manager → `phin-and-beans-dev/coffee-tea-secrets` → Retrieve secret value

**Error: `exec format error` in ECS logs**
- Docker image was built on Apple Silicon (arm64) but ECS needs amd64
- Add `--platform linux/amd64` to the Docker build in the workflow, or use `docker buildx`

**ECS task keeps restarting**
- Missing required env var — check CloudWatch logs for a Python `ValidationError` or missing config error
- Confirm all secrets in Secrets Manager match what `backend/app/config.py` expects

### DB migration fails

**Error: `alembic upgrade head` ECS task exits non-zero**
- Check CloudWatch logs for the one-off migration task
- Common cause: RDS not yet reachable (ECS security group not allowing traffic from migration task)
- Or `DATABASE_URL` in Secrets Manager has wrong host/password

### Frontend shows blank page or API errors

**Blank page after CloudFront deploy**
- CloudFront is serving cached `index.html` — wait 2–3 minutes for the invalidation to propagate
- Or check S3 bucket: AWS Console → S3 → `phin-and-beans-dev-frontend` → confirm `index.html` is there

**API calls return 502/504**
- ECS service is unhealthy — check CloudWatch logs
- ALB health check failing — confirm `/api/health` returns 200 in the ECS task

**API calls return 401 unexpectedly**
- `SECRET_KEY` mismatch between what was used to sign a token and what ECS is currently using
- Can happen if you rotated `PROD_{PREFIX}_SECRET_KEY` — all existing sessions become invalid, users need to log in again

### ACM certificate not issuing

- DNS validation CNAME records not added yet — add them at your domain registrar
- Propagation can take up to 30 minutes — check status in Certificate Manager
- Make sure you're in **us-east-1** — CloudFront requires it

### Chatbot returns 500

**In dev (Docker):**
- Ollama container is still pulling the model — wait for `ollama-init` to finish, then retry
- Run `docker logs phin-and-beans-ollama-1` — if you see `404` on `/v1/chat/completions`, the model isn't loaded yet
- Run `docker exec phin-and-beans-ollama-1 ollama list` to confirm `llama3.2:1b` is present

**In prod (ECS):**
- `OLLAMA_BASE_URL` secret is wrong or the EC2 Ollama server is unreachable
- Check the EC2 security group allows port 11434 inbound from the ECS security group
- SSH into the EC2 and run `curl http://localhost:11434/api/tags` — should return JSON with the model list

---

## Adding a New Store

1. Add entry to `stores/stores.json` with a unique `slug` and `env_prefix`
2. Create `stores/<slug>.env` with all variables + unique port offsets (increment from last store)
3. Create `backend/menus/<slug>/menu.csv`, `deals.csv`, `locations.csv`
4. Copy Terraform: `cp -r terraform/envs/phin-drips terraform/envs/<slug>` — update `locals`, VPC CIDRs (use next unused `/16`), S3 state key, `db_name`
5. Copy workflow: `cp .github/workflows/ci-cd-phin-drips.yml .github/workflows/ci-cd-<slug>.yml` — update store name, slug, tagline, secret prefix, and all path filters
6. Add GitHub secrets: `DEV_{PREFIX}_*`, `PROD_{PREFIX}_*`, `PROD_{PREFIX}_ACM_CERT_ARN`
7. Test locally: `docker compose --env-file stores/<slug>.env -p <slug> up`

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
| POST | `/api/chat/` | Public | Menu chatbot (Ollama) |
| GET | `/api/users/me` | User | Current user profile |
| GET | `/api/users/` | Admin | List all users |
| POST | `/api/users/{id}/make-admin` | Admin | Promote to admin |
| GET | `/static/images/{filename}` | Public | Local menu item images |
