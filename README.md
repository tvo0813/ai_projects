# Coffee Tea App

Multi-store coffee & tea shop platform. One codebase, multiple independent store deployments — each with its own domain, menu, database, and AWS infrastructure. Store identity is injected entirely through environment variables; no code changes are needed to launch a new store.

**Active stores:** Phin and Beans (`phin-and-beans`) · Phin Drips (`phin-drips`)

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Framer Motion |
| State | Zustand (auth), persisted to localStorage |
| Backend | Python FastAPI + Uvicorn |
| Database | PostgreSQL 16 (users, deals) |
| Menu storage | Per-store CSV in `backend/menus/` (dev) · DynamoDB (prod) |
| Auth | JWT — bcrypt passwords, python-jose tokens |
| Infrastructure | AWS ECS Fargate + RDS + S3/CloudFront, managed by Terraform |
| CI/CD | GitHub Actions (`Coffee Tea App — CI/CD`) |

---

## Table of Contents

1. [Local Development](#local-development)
2. [Multi-Store System](#multi-store-system)
3. [AWS Setup — Do This Once](#aws-setup--do-this-once)
4. [GitHub Setup — Do This Once](#github-setup--do-this-once)
5. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
6. [Adding a New Store](#adding-a-new-store)
7. [API Reference](#api-reference)

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+ (frontend-only dev)
- Python 3.11+ (backend-only dev)

### Run everything with Docker (recommended)

Pick a store with `--env-file`:

```bash
docker compose --env-file stores/phin-and-beans.env up
docker compose --env-file stores/phin-drips.env up
```

| URL | Service |
|---|---|
| http://localhost:5173 | Frontend (React) |
| http://localhost:8000 | Backend API |
| http://localhost:8000/api/docs | Swagger / OpenAPI |

Docker Compose service names are `coffee-tea-db`, `coffee-tea-api`, `coffee-tea-web`.

### Run frontend only

```bash
cd frontend
npm install
npm run dev   # reads store identity from frontend/.env
```

### Run backend only

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn app.main:app --reload
```

### Database migrations

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "description"
```

### Run unit tests locally

```bash
cd backend
pip install -r requirements-test.txt
pytest
```

### Run E2E tests locally

```bash
cd tests/e2e
npm install
npx playwright install chromium
E2E_FRONTEND_URL=http://localhost:5173 \
E2E_API_URL=http://localhost:8000 \
npm test
```

### First admin user

Register via the app, then promote yourself directly in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

Admin can then access `/admin` in the browser to manage the menu and deals.

---

## Multi-Store System

### Store registry

`stores/stores.json` is the authoritative list of stores. Each entry has:

```json
{
  "slug": "phin-and-beans",
  "name": "Phin and Beans",
  "tagline": "Vietnamese-inspired coffee & tea, crafted with care.",
  "domain": "phinandbeans.com",
  "db_name_dev": "phin_and_beans_dev",
  "db_name_prod": "phin_and_beans",
  "env_prefix": "PAB"
}
```

### Per-store env files (`stores/<slug>.env`)

Used locally with `docker compose --env-file`:

| Variable | Used by | Example |
|---|---|---|
| `STORE_SLUG` | Backend — selects `backend/menus/<slug>.csv` | `phin-and-beans` |
| `STORE_NAME` | Backend API title, ECS env | `Phin and Beans` |
| `STORE_TAGLINE` | Frontend hero section | `Vietnamese-inspired...` |
| `STORE_DOMAIN` | Backend CORS allowed origins | `phinandbeans.com` |
| `POSTGRES_DB` | PostgreSQL database name | `phin_and_beans` |
| `DYNAMODB_TABLE_MENU` | DynamoDB menu table (prod) | `phin-and-beans-menu` |
| `DYNAMODB_TABLE_DEALS` | DynamoDB deals table (prod) | `phin-and-beans-deals` |

### Per-store menus

Each store has its own menu CSV at `backend/menus/<slug>.csv`. The backend loads it at startup — no code changes needed to update a menu.

**CSV columns:** `item_id, name, category, description, price, image_url, is_available, tags, customizations`

- `tags` — pipe-separated: `hot|iced|popular`
- `customizations` — `key=opt1|opt2;key2=opt1|opt2` e.g. `milk=Whole|Oat;size=12oz|16oz`
- `item_id` — leave blank; a stable UUID is derived from `(store_slug + name)` and persists across restarts

### Terraform layout

Fully isolated per store × environment — separate VPC, RDS, ECS, Secrets Manager, S3, CloudFront:

```
terraform/envs/
├── phin-and-beans/
│   ├── dev/    VPC: 10.0.0.0/16   state key: phin-and-beans/dev/terraform.tfstate
│   └── prod/   VPC: 10.1.0.0/16   state key: phin-and-beans/prod/terraform.tfstate
└── phin-drips/
    ├── dev/    VPC: 10.2.0.0/16   state key: phin-drips/dev/terraform.tfstate
    └── prod/   VPC: 10.3.0.0/16   state key: phin-drips/prod/terraform.tfstate
```

Shared state backend: S3 bucket `coffee-tea-app-tfstate` + DynamoDB lock table `coffee-tea-app-tfstate-lock`.

**AWS regions:** dev deploys to `us-east-2`, prod deploys to `us-east-1`. The Terraform state bucket and ECR repo live in `us-east-1`.

There is also `terraform/envs/dev/` and `terraform/envs/prod/` — shared environments used for the ECR repository (one shared Docker image repo used by all stores).

### AWS resource naming convention

All AWS resources are named `<store-slug>-<env>-<resource>`, e.g.:

- ECS cluster: `phin-and-beans-dev-cluster`
- ECS service / task definition: `phin-and-beans-dev-api`
- Container name (inside the task): `coffee-tea-api`
- RDS instance: `phin-and-beans-dev-postgres`
- ALB: `phin-and-beans-dev-alb`
- Target group: `phin-and-beans-dev-api-tg`
- CloudWatch log group: `/ecs/phin-and-beans-dev-api`
- Secrets Manager: `phin-and-beans-dev/coffee-tea-secrets`
- ECR repo: `coffee-tea-dev-api` (shared across all stores, one image per env)
- S3 frontend bucket: `phin-and-beans-dev-frontend`
- CloudFront distribution tagged: `phin-and-beans-dev-cf`

---

## AWS Setup — Do This Once

These steps bootstrap the AWS side before the pipeline can run. After this, the pipeline handles all subsequent deploys automatically.

### Step 1 — AWS account prerequisites

- An AWS account
- AWS CLI installed and configured (`aws configure`)
- A user or role with sufficient permissions (admin is simplest for initial setup)

### Step 2 — Bootstrap Terraform remote state

```bash
bash terraform/bootstrap.sh
```

Creates:
- S3 bucket `coffee-tea-app-tfstate` — versioned, encrypted, private
- DynamoDB table `coffee-tea-app-tfstate-lock` — prevents concurrent Terraform applies

### Step 3 — Create the GitHub Actions IAM user

1. Go to **AWS Console → IAM → Users → Create user**
2. Name it `coffee-tea-app-github-actions`
3. Attach the policy from `terraform/github-actions-iam-policy.json`
4. Go to **Security credentials → Create access key** (use case: "Other")
5. Save the **Access Key ID** and **Secret Access Key** for Step 1 of GitHub Setup

### Step 4 — Run Terraform for the first time

The shared ECR repo must exist before the pipeline can push images. Run this once from your local machine:

```bash
# Create the shared ECR repo (used by all stores)
cd terraform/envs/dev
terraform init
terraform apply -var="secret_key=placeholder" -var="db_password=placeholder"
terraform output ecr_repo_url   # save this value

cd ../prod
terraform init
terraform apply -var="secret_key=placeholder" -var="db_password=placeholder"
terraform output ecr_repo_url   # save this value
```

The per-store environments (`phin-and-beans/dev`, etc.) are provisioned automatically by the pipeline on first run.

---

## GitHub Setup — Do This Once

### Step 1 — Secrets

Go to **Settings → Secrets and variables → Actions → Secrets** and add the following.

**Shared secrets (not per-store):**

| Secret | Description | Where to get it |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | GitHub Actions IAM access key | AWS IAM step above |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions IAM secret key | AWS IAM step above |

**Per-store secrets — Phin and Beans (`PAB` prefix):**

| Secret | Description |
|---|---|
| `DEV_PAB_DB_PASSWORD` | Dev RDS database password |
| `DEV_PAB_SECRET_KEY` | Dev JWT signing secret (any long random string) |
| `PROD_PAB_DB_PASSWORD` | Prod RDS database password |
| `PROD_PAB_SECRET_KEY` | Prod JWT signing secret |
| `PROD_PAB_ACM_CERT_ARN` | ACM TLS certificate ARN for the domain (prod only) |

**Per-store secrets — Phin Drips (`PD` prefix):**

| Secret | Description |
|---|---|
| `DEV_PD_DB_PASSWORD` | Dev RDS database password |
| `DEV_PD_SECRET_KEY` | Dev JWT signing secret |
| `PROD_PD_DB_PASSWORD` | Prod RDS database password |
| `PROD_PD_SECRET_KEY` | Prod JWT signing secret |
| `PROD_PD_ACM_CERT_ARN` | ACM TLS certificate ARN for the domain (prod only) |

**Secret naming pattern for future stores:**

```
DEV_{PREFIX}_{VAR}     e.g.  DEV_PAB_DB_PASSWORD
PROD_{PREFIX}_{VAR}    e.g.  PROD_PD_SECRET_KEY
```

The `PREFIX` value for each store is defined in `stores/stores.json` under `env_prefix`.

### Step 2 — Variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Example value | Notes |
|---|---|---|
| `ECR_REPO` | `123456789.dkr.ecr.us-east-1.amazonaws.com/coffee-tea-dev-api` | From `terraform output api_repo_url` in `terraform/envs/dev` |

### Step 3 — Create GitHub environments

**`dev` environment** (auto-deploys, no approval required):
1. **Settings → Environments → New environment** → name it `dev`

**`prod` environment** (requires manual approval before deploy):
1. **Settings → Environments → New environment** → name it `prod`
2. Under **Environment protection rules**, enable **Required reviewers**
3. Add yourself (or your team) as a required reviewer

---

## How the CI/CD Pipeline Works

Pipeline file: `.github/workflows/ci-cd.yml`
Runs on: every pull request and every push to `main` or `develop`

```
push / PR
    │
    ├─ build-backend   Build & push Docker image to ECR (shared image, all stores)
    │
    ├─ build-frontends Build React app per store (bakes VITE_STORE_NAME/TAGLINE)
    │                  matrix: [phin-and-beans, phin-drips]
    │
    ├─ unit-test       pytest — fast, SQLite in-memory, no AWS
    │
    ▼ (all three pass)
    │
    ├─ deploy-dev      Per store (sequential to avoid Terraform lock collisions):
    │                  1. terraform apply  → provisions/updates AWS infra
    │                  2. ECS rolling deploy → new image, waits for stable
    │                  3. alembic upgrade head → DB migrations via one-off Fargate task
    │                  4. S3 sync + CloudFront invalidation → frontend live
    │
    ▼ (deploy-dev stable)
    │
    ├─ e2e             Playwright tests against live dev URLs, per store
    │
    ▼ (e2e passes + push to main only)
    │
    └─ deploy-prod     Same steps as deploy-dev, per store
                       ⚠ Pauses for manual approval before running
```

### ECS migration override

Migrations run as a one-off Fargate task using the container name `coffee-tea-api`:

```bash
aws ecs run-task \
  --task-definition phin-and-beans-dev-api \
  --overrides '{"containerOverrides":[{"name":"coffee-tea-api","command":["alembic","upgrade","head"]}]}'
```

### AWS architecture (per store)

```
Users
  │
  ├─ HTTPS ──→ CloudFront ──→ S3  (React SPA, per-store build)
  │
  └─ /api/* ──→ ALB (public subnets)
                    │
                    ▼
               ECS Fargate  ←── ECR (coffee-tea-dev-api image)
               coffee-tea-api container, port 8000
               (private subnets)
                    │
                    ├──→ RDS PostgreSQL  (private subnets, Multi-AZ in prod)
                    │
                    └──→ Secrets Manager  (DB URL, JWT key)
```

Secrets are injected into containers at runtime from Secrets Manager — they never appear in the Docker image or CloudWatch logs.

---

## Adding a New Store

1. Add an entry to `stores/stores.json` with `slug`, `name`, `tagline`, `domain`, `db_name_dev`, `db_name_prod`, `env_prefix`

2. Create `stores/<slug>.env`:
```bash
STORE_SLUG=my-new-store
STORE_NAME=My New Store
STORE_TAGLINE=Your tagline here.
STORE_DOMAIN=mynewstore.com
POSTGRES_DB=my_new_store
DYNAMODB_TABLE_MENU=my-new-store-menu
DYNAMODB_TABLE_DEALS=my-new-store-deals
```

3. Create `backend/menus/<slug>.csv` with the store's menu items

4. Copy a Terraform env directory and update for the new store:
```bash
cp -r terraform/envs/phin-drips terraform/envs/my-new-store
# Update locals.name, locals.store_slug, VPC CIDRs (next unused /16),
# S3 state key, db_name in both dev/ and prod/
```

5. Add the new store to the `matrix` in both `deploy-dev` and `deploy-prod` jobs in `.github/workflows/ci-cd.yml`

6. Add GitHub secrets using the store's `env_prefix` (e.g. `MNS`):
   - `DEV_MNS_DB_PASSWORD`, `DEV_MNS_SECRET_KEY`
   - `PROD_MNS_DB_PASSWORD`, `PROD_MNS_SECRET_KEY`, `PROD_MNS_ACM_CERT_ARN`

7. Test locally:
```bash
docker compose --env-file stores/my-new-store.env up
```

Push to trigger the pipeline — infrastructure is provisioned automatically on first run.

---

## API Reference

Auth is JWT — pass `Authorization: Bearer <token>` on protected routes.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Create account, returns JWT |
| `POST` | `/api/auth/login` | Public | Login, returns JWT |
| `GET` | `/api/menu/` | Public | List menu items (`?category=` optional filter) |
| `GET` | `/api/menu/categories` | Public | List available categories |
| `GET` | `/api/menu/{id}` | Public | Get single menu item |
| `POST` | `/api/menu/` | Admin | Create menu item |
| `PUT` | `/api/menu/{id}` | Admin | Update menu item (availability, price, etc.) |
| `DELETE` | `/api/menu/{id}` | Admin | Delete menu item |
| `POST` | `/api/deals/spin` | User | Spin the wheel, returns deal code |
| `GET` | `/api/deals/validate/{code}` | User | Validate a deal code |
| `POST` | `/api/deals/` | Admin | Create a deal |
| `PATCH` | `/api/deals/{id}/toggle` | Admin | Toggle deal active/inactive |
| `GET` | `/api/users/me` | User | Get current user profile |
| `GET` | `/api/users/` | Admin | List all users |
| `POST` | `/api/users/{id}/make-admin` | Admin | Promote user to admin |

> **Note:** Ordering and payment endpoints have been intentionally removed. The app currently serves as a showcase/menu site with a rewards wheel. Order placement will be added in a future release.
