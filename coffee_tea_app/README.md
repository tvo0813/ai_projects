# Coffee & Tea Shop App ☕

Multi-store coffee & tea shop web app. The same codebase powers multiple stores (e.g. "Phin and Beans", "Phin Drip") via environment variables — no code changes needed to launch a new store.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Pure CSS (custom design tokens) + Framer Motion |
| State | Zustand (cart + auth, persisted to localStorage) |
| Backend | Python FastAPI on Uvicorn |
| Database | PostgreSQL (orders/users/deals) |
| Payments | Stripe Elements API |
| POS Sync | Square Developer SDK |
| Auth | JWT (bcrypt + jose) |
| Infrastructure | AWS ECS Fargate + RDS + S3/CloudFront, managed by Terraform |
| CI/CD | GitHub Actions |

---

## Table of Contents

1. [Local Development](#local-development)
2. [AWS Setup — Do This Once](#aws-setup--do-this-once)
3. [GitHub Setup — Do This Once](#github-setup--do-this-once)
4. [After Setup — How the Pipeline Works](#after-setup--how-the-pipeline-works)
5. [Adding a New Store](#adding-a-new-store)
6. [API Reference](#api-reference)
7. [Features](#features)

---

## Local Development

### Prerequisites

- Docker Desktop
- Node.js 20+ (for frontend-only dev)
- Python 3.11+ (for backend-only dev)

### Run everything with Docker (recommended)

```bash
cp backend/.env.example backend/.env   # fill in your keys
docker compose --env-file stores/phin-and-beans.env up
```

| URL | Description |
|---|---|
| http://localhost:5173 | Frontend |
| http://localhost:8000 | Backend API |
| http://localhost:8000/api/docs | Swagger docs |

### Run frontend only

```bash
cd frontend
npm install
npm run dev   # reads store name from frontend/.env
```

### Run backend only

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
uvicorn app.main:app --reload
```

### Run backend unit tests locally

```bash
cd backend
pip install -r requirements-test.txt
pytest
```

### Run E2E tests locally (against a running app)

```bash
cd tests/e2e
npm install
npx playwright install chromium
E2E_FRONTEND_URL=http://localhost:5173 \
E2E_API_URL=http://localhost:8000 \
npm test
```

### First admin user

Register via the UI, then promote yourself in the database:

```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

---

## AWS Setup — Do This Once

These steps only need to be done once before the pipeline can run. After this, the pipeline handles everything automatically.

### Step 1 — AWS account prerequisites

You need an AWS account with:
- A user or role with enough permissions to bootstrap resources (admin is easiest for setup)
- AWS CLI installed and configured locally (`aws configure`)

### Step 2 — Bootstrap Terraform remote state

Terraform stores its state file in S3 so all pipeline runs share the same state. Run this once:

```bash
bash terraform/bootstrap.sh
```

This creates:
- An S3 bucket called `coffee-tea-app-tfstate` (versioned, encrypted, private)
- A DynamoDB table called `coffee-tea-app-tfstate-lock` (prevents concurrent applies)

### Step 3 — Create the GitHub Actions IAM user

The pipeline needs AWS credentials to deploy. Create a dedicated IAM user:

1. Go to **AWS Console → IAM → Users → Create user**
2. Name it `github-actions-deploy`
3. Attach the policy from `terraform/github-actions-iam-policy.json` (create a custom policy with that JSON)
4. Under the user, go to **Security credentials → Create access key** (use case: "Other")
5. Save the **Access Key ID** and **Secret Access Key** — you'll need them in the next section

### Step 4 — Run Terraform manually for the first time

The very first deploy needs to be run locally because the pipeline reads some output values (subnet IDs, security group IDs) that don't exist until infrastructure is created.

**For dev:**

```bash
cd terraform/envs/dev
terraform init
terraform apply \
  -var="db_password=your-dev-db-password" \
  -var="secret_key=your-dev-jwt-secret"
```

When it completes, save these output values — you'll need them as GitHub variables:

```bash
terraform output   # copy all values
```

**For prod** (optional — the pipeline can do this on first run to main):

```bash
cd terraform/envs/prod
terraform init
terraform apply \
  -var="db_password=your-prod-db-password" \
  -var="secret_key=your-prod-jwt-secret" \
  -var="stripe_secret_key=sk_live_..." \
  -var="stripe_webhook_secret=whsec_..." \
  -var="square_access_token=..." \
  -var="square_location_id=..."
terraform output
```

---

## GitHub Setup — Do This Once

### Step 1 — Create GitHub Actions secrets

Go to your repo → **Settings → Secrets and variables → Actions → Secrets** and add:

| Secret | What it is | Where to get it |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | GitHub Actions IAM access key | Step 3 above |
| `AWS_SECRET_ACCESS_KEY` | GitHub Actions IAM secret | Step 3 above |
| `DEV_DB_PASSWORD` | Dev RDS database password | Make up a strong password |
| `DEV_SECRET_KEY` | Dev JWT signing secret | Any long random string |
| `DEV_STRIPE_SECRET_KEY` | Stripe test secret key | Stripe dashboard → test keys |
| `DEV_STRIPE_WEBHOOK_SECRET` | Stripe test webhook secret | Stripe dashboard → webhooks |
| `DEV_SQUARE_ACCESS_TOKEN` | Square sandbox token | Square developer dashboard |
| `DEV_SQUARE_LOCATION_ID` | Square sandbox location ID | Square developer dashboard |
| `PROD_DB_PASSWORD` | Prod RDS database password | Make up a strong password |
| `PROD_SECRET_KEY` | Prod JWT signing secret | Any long random string |
| `PROD_STRIPE_SECRET_KEY` | Stripe live secret key | Stripe dashboard → live keys |
| `PROD_STRIPE_WEBHOOK_SECRET` | Stripe live webhook secret | Stripe dashboard → webhooks |
| `PROD_SQUARE_ACCESS_TOKEN` | Square production token | Square developer dashboard |
| `PROD_SQUARE_LOCATION_ID` | Square production location ID | Square developer dashboard |
| `PROD_ACM_CERT_ARN` | ACM TLS cert ARN for your domain | AWS Certificate Manager (optional) |

### Step 2 — Create GitHub Actions variables

Go to **Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Example value | Notes |
|---|---|---|
| `STORE_NAME` | `Phin and Beans` | Appears in browser tab, navbar, hero |
| `STORE_TAGLINE` | `Vietnamese-inspired coffee & tea, crafted with care.` | Hero section subtitle |
| `ECR_REPO_DEV` | `123456789.dkr.ecr.us-east-1.amazonaws.com/coffee-tea-dev-backend` | From `terraform output ecr_repo_url` in dev |
| `ECR_REPO_PROD` | `123456789.dkr.ecr.us-east-1.amazonaws.com/coffee-tea-prod-backend` | From `terraform output ecr_repo_url` in prod |
| `DEV_STORE_DOMAIN` | `dev.phinandbeans.com` | Added to backend CORS allowed origins |
| `PROD_STORE_DOMAIN` | `phinandbeans.com` | Added to backend CORS allowed origins |
| `PROD_DOMAIN_ALIASES` | `["phinandbeans.com"]` | CloudFront custom domain aliases |
| `DEV_PRIVATE_SUBNET_IDS` | `subnet-abc123,subnet-def456` | From `terraform output` in dev |
| `DEV_ECS_SG_ID` | `sg-abc123` | From `terraform output` in dev |
| `PROD_PRIVATE_SUBNET_IDS` | `subnet-ghi789,subnet-jkl012` | From `terraform output` in prod |
| `PROD_ECS_SG_ID` | `sg-def456` | From `terraform output` in prod |

### Step 3 — Create the prod environment with a manual approval gate

This is what makes deploying to production require a human to click approve:

1. Go to your repo → **Settings → Environments → New environment**
2. Name it exactly `prod`
3. Under **Environment protection rules**, enable **Required reviewers**
4. Add yourself (or your team) as a required reviewer
5. Save

The pipeline will pause before the prod deploy step and send you a notification to approve or reject it.

### Step 4 — Create the dev environment (optional but recommended)

1. Go to **Settings → Environments → New environment**
2. Name it `dev`
3. No required reviewers needed — dev deploys automatically

---

## After Setup — How the Pipeline Works

Once setup is complete, the pipeline runs automatically on **every pull request** and on **every push to `main` or `develop`**. You never need to manually deploy again.

```
PR opened / push to main or develop
         │
         ▼
┌─────────────────┐
│   1. Build      │  Build Docker image + React frontend
└────────┬────────┘
         │ passes
         ▼
┌─────────────────┐
│  2. Unit Tests  │  pytest against SQLite (fast, no AWS needed)
└────────┬────────┘
         │ passes
         ▼
┌─────────────────┐
│ 3. Deploy Dev   │  Terraform + ECS + migrations + S3/CloudFront
└────────┬────────┘
         │ stable
         ▼
┌─────────────────┐
│  4. E2E Tests   │  Playwright against live dev environment
└────────┬────────┘
         │ passes
         ▼
┌─────────────────────────────────────┐
│  5. Deploy Prod                     │  ← push to main only
│     (waits for manual approval)     │  ← requires reviewer to approve
└─────────────────────────────────────┘
```

### What each job does

#### Job 1 — Build

- Logs into Amazon ECR using the GitHub Actions IAM credentials
- Builds the backend Docker image from `backend/Dockerfile`, tagged with the Git commit SHA and `latest`, and pushes it to dev ECR. Uses the previous `latest` as a build cache so repeat builds are fast
- Builds the React frontend (`npm ci && npm run build`) with `VITE_STORE_NAME` and `VITE_STORE_TAGLINE` baked in at build time
- Uploads `frontend/dist/` as a workflow artifact so the deploy jobs can use it without rebuilding

#### Job 2 — Unit Tests

- Runs `pytest` with a SQLite in-memory database — no real Postgres or AWS needed
- Covers: health endpoint, user registration and login, duplicate email handling, wrong password rejection, menu listing and category filtering, deals spin endpoint, admin-only endpoint protection
- If any test fails, the pipeline stops here and nothing gets deployed

#### Job 3 — Deploy to Dev

Runs only after unit tests pass:

1. **Terraform apply** — provisions or updates the full AWS dev environment. On first run this creates everything (VPC, subnets, NAT gateway, RDS PostgreSQL, ECS Fargate cluster, ALB, S3 bucket, CloudFront, Secrets Manager). On every subsequent run it only changes what's different
2. **ECS rolling deploy** — tells ECS to replace old containers with the new image one at a time, waits until all containers are healthy before moving on
3. **Database migrations** — runs `alembic upgrade head` as a one-off Fargate task, so schema changes are applied before new backend code starts serving traffic
4. **Frontend deploy** — syncs `frontend/dist/` to S3. JS/CSS assets get a 1-year immutable cache header (their filenames include content hashes). `index.html` gets `no-cache` so browsers always fetch the latest. CloudFront is invalidated so the CDN serves fresh content immediately

#### Job 4 — E2E Tests

Runs against the live dev URLs output by Terraform:

| Test file | What it checks |
|---|---|
| `health.spec.ts` | Backend `/api/health` returns `status: ok` |
| `home.spec.ts` | Homepage loads, store name heading is visible, nav links are present |
| `menu.spec.ts` | Menu page loads items from the real API, category filter works |
| `auth.spec.ts` | Register a new user, log in, protected routes redirect unauthenticated users |

Playwright retries flaky tests up to 2 times. Screenshots and traces are saved on failure and uploaded as artifacts for 7 days.

#### Job 5 — Deploy to Prod

Only runs on pushes to `main` (not PRs) and only after E2E tests pass. GitHub pauses here and waits for a required reviewer to approve before continuing.

Once approved:

1. **Image promotion** — pulls the same Docker image that passed all tests (identified by the exact commit SHA), re-tags it for the prod ECR repo, and pushes. Prod runs the exact same binary that was tested — there is no rebuild
2. **Terraform apply** — provisions or updates prod infrastructure. Prod is configured differently from dev: `db.t3.small` with Multi-AZ failover, 2 running Fargate tasks, RDS deletion protection on, 14-day automated backups
3. **ECS rolling deploy + migrations** — same pattern as dev
4. **Frontend deploy to prod S3 + CloudFront invalidation** — same pattern as dev, targeting the prod bucket

### AWS Architecture

```
Users
  │
  ├── HTTPS ──→ CloudFront (CDN) ──→ S3 (React SPA + static assets)
  │
  └── API calls (/api/*)
         │
         ▼
    CloudFront
         │
         ▼
    ALB (port 80/443)
    [public subnets]
         │
         ▼
    ECS Fargate tasks        ←── ECR (Docker images)
    backend:8000, uvicorn
    [private subnets]
         │
         ├──→ RDS PostgreSQL
         │    [private subnets, Multi-AZ in prod]
         │
         ├──→ Secrets Manager
         │    (DB URL, JWT key, Stripe keys, Square tokens)
         │
         ├──→ Stripe API (payments)
         │
         └──→ Square API (POS sync)
```

All secrets are stored in AWS Secrets Manager and injected into containers at runtime. They never appear in Docker images, environment variable listings, or CloudWatch logs.

---

## Adding a New Store

1. Copy an existing store config:

```bash
cp stores/phin-and-beans.env stores/my-new-store.env
```

2. Edit the new file with the store's values:

```bash
STORE_NAME=My New Store
STORE_TAGLINE=Your tagline here.
STORE_DOMAIN=mynewstore.com

POSTGRES_DB=my_new_store
DYNAMODB_TABLE_MENU=my-new-store-menu
DYNAMODB_TABLE_DEALS=my-new-store-deals
```

3. Run locally:

```bash
docker compose --env-file stores/my-new-store.env up
```

For AWS, update the GitHub Actions variables and Terraform env files with the new store's values and push to trigger the pipeline.

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Create account + receive JWT |
| POST | /api/auth/login | Public | Login → JWT |
| GET | /api/menu/ | Public | List menu items (optional `?category=`) |
| GET | /api/menu/categories | Public | List available categories |
| GET | /api/menu/{id} | Public | Get single menu item |
| POST | /api/menu/ | Admin | Create menu item |
| PUT | /api/menu/{id} | Admin | Update menu item |
| DELETE | /api/menu/{id} | Admin | Delete menu item |
| POST | /api/deals/spin | User | Spin the wheel, receive deal code |
| GET | /api/deals/validate/{code} | User | Validate a deal code at checkout |
| POST | /api/deals/ | Admin | Create a deal |
| PATCH | /api/deals/{id}/toggle | Admin | Toggle deal active/inactive |
| POST | /api/orders/payment-intent | User | Create Stripe payment intent |
| POST | /api/orders/ | User | Place order |
| GET | /api/orders/my | User | My order history |
| GET | /api/orders/ | Admin | All orders |
| PATCH | /api/orders/{id}/status | Admin | Update order status |
| POST | /api/orders/webhook/stripe | Public (Stripe sig) | Stripe payment webhook |
| GET | /api/users/me | User | Get current user profile |
| GET | /api/users/ | Admin | List all users |
| POST | /api/users/{id}/make-admin | Admin | Promote user to admin |
| GET | /api/health | Public | Health check |

---

## Features

- Public menu with category filtering and per-drink customization (size, milk, shots, sweetness)
- Cart with quantity controls and persistent localStorage storage
- User registration and login with JWT auth
- Spin-to-win deals wheel with cryptographic randomness
- Deal code validation and automatic discount at checkout
- Order placement with Stripe payment intent flow
- Order status tracking: received → brewing → ready for pickup → completed
- Admin dashboard: live orders, status updates, menu management, deal creation
- Square POS sync on every order completion
- Multi-store support: swap stores by changing env vars, no code changes needed
