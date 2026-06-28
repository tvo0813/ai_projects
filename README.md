# Coffee Tea App

Multi-store Vietnamese-inspired coffee & tea shop platform. One codebase, multiple independent store deployments — each with its own domain and menu. Store identity is injected entirely through environment variables.

**Active stores:** Phin and Beans (`phin-and-beans`) · Phin Drips (`phin-drips`)

> **Current state:** Public-facing showcase/menu site. No auth, login, admin, or database deployed. Customers browse the menu, view deals, find locations, order via Grab Food, and chat with a menu AI assistant.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Framer Motion |
| Backend | Python FastAPI + Uvicorn |
| Data | Per-store CSVs in `backend/menus/<slug>/` |
| Payments | Stripe (configured, not in active UI) |
| POS Sync | Square (configured, not in active UI) |
| Maps | Google Maps Embed API (keyed) with legacy fallback |
| Menu Chatbot | Ollama (`llama3.2:1b`) — runs locally in Docker, no API costs |
| Backend Hosting | Render (free tier, per-store Docker service) |
| Frontend Hosting | GitHub Pages (free static deploy, `VITE_STATIC_MODE=true`) |
| CI/CD | GitHub Actions (per-store path-filtered workflows) |

---

## Table of Contents

1. [Local Development](#local-development)
2. [Makefile Commands](#makefile-commands)
3. [Multi-Store System](#multi-store-system)
4. [Pages & Features](#pages--features)
5. [Frontend Design System](#frontend-design-system)
6. [GitHub Pages (Free Static Deploy)](#github-pages-free-static-deploy)
7. [Backend Deployment (Render)](#backend-deployment-render)
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
make restart STORE=phin-and-beans   # rebuild + restart
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
make up-all      # spin up both stores
make down-all    # stop both stores
make clean-all   # full teardown both stores
make ps-all      # container status both stores
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
| `DYNAMODB_TABLE_MENU` / `DYNAMODB_TABLE_DEALS` | DynamoDB tables (prod only) |
| `OLLAMA_MODEL` | Ollama model name (default: `llama3.2:1b`) |
| `FRONTEND_PORT` / `BACKEND_PORT` | Docker port offsets |

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
└── phin-drips/prod/      VPC: 10.3.0.0/16
```

Shared state: S3 `coffee-tea-app-tfstate` + DynamoDB lock `coffee-tea-app-tfstate-lock`.

---

## Pages & Features

| Route | Page | Description |
|---|---|---|
| `/` | Home | Full-screen hero (coffee beans bg + canvas particle system + mouse-parallax floating beans + animated blobs), scrolling marquee tape, Vietnam origin story with live auto-brewing phin SVG, 4 pillars (glassmorphism cards), AI chatbot, horizontal drag-to-scroll signature drinks gallery, CTA band |
| `/menu` | Menu | Section browse (Signature, Coffee, Matcha, Latte, Tea, Hot Drinks); sticky amber-underline category nav; 3D magnetic cards with mouse-tracking tilt + specular glare; click for detail modal |
| `/deals` | Deals | Active deals from `deals.csv` with SVG icons, per-badge color tokens (Daily/Weekly/Birthday/Loyalty), expiry dates |
| `/locations` | Locations | Google Maps embed (legacy fallback when API key absent) + address, hours, phone with SVG icon rows |
| `/careers` | Careers | Benefits, 3-step apply process, email CTA |
| `/privacy` | Privacy Policy | Loaded from `frontend/public/privacy-policy.txt` |

### Menu Chatbot

AI assistant powered by Ollama (`llama3.2:1b`) running locally in Docker. In static/GitHub Pages mode it shows an offline card instead. Rules:
- Menu items and drink selection only
- Always lists 3+ drinks with prices when recommending
- Oat milk available as dairy-free substitute for extra charge

---

## Frontend Design System

The frontend uses a **Dark Luxury Espresso** design — deep espresso backgrounds, amber gold accents, glassmorphism cards, and animated SVGs across every page.

### Typography

| Role | Font |
|---|---|
| Display / headings | Cormorant Garamond (italic, weight 300–700) |
| Body / UI / labels | Jost (weight 300–700) |

### CSS Design Tokens (`frontend/src/index.css`)

```css
/* Dark Luxury Espresso — used site-wide */
--espresso:        #0E0806;   /* page background */
--espresso-mid:    #160D09;   /* section alternates, page headers */
--espresso-light:  #2E1710;
--espresso-card:   #1A0E0A;   /* modals */
--amber:           #C8A96E;   /* primary accent, CTAs */
--amber-light:     #E8D5A3;
--amber-dark:      #9E7A3F;
--cream-warm:      #F5EDD6;   /* headings, body text on dark */
--glass-bg:        rgba(255,255,255,0.035);   /* glassmorphism cards */
--glass-border:    rgba(255,255,255,0.07);

/* Green palette (retained for light-mode form/input elements) */
--green:        #00704A;
--green-dark:   #1E3932;
--cream:        #F2F0EB;
```

### Key Components

| Component | Location | What it does |
|---|---|---|
| `Navbar.tsx` | `components/layout/` | Scroll-aware frosted-glass dark bar; background deepens past 30px scroll; spring-animated logo; AnimatePresence mobile drawer |
| `Footer.tsx` | `components/layout/` | 4-column dark luxury footer: brand, Explore links, Legal links, pull-quote |
| `ChatBot.tsx` | `components/` | Live AI chat (Ollama) with dark glass UI, or offline card in static mode |
| `MenuCard.tsx` | `components/menu/` | 3D tilt + amber specular glare on mouse move; dark espresso detail modal |
| `PhinBrewTimer.tsx` | `components/` | Standalone auto-brew timer (available but not placed on any page) |
| `MagneticCursor` | inlined in `Home.tsx` | Custom dot + ring cursor with spring lag and scale-on-hover |
| `ScrollProgress` | inlined in `Home.tsx` | Amber gradient progress bar fixed at top of viewport |
| `AutoPhin` | inlined in `Home.tsx` | SVG phin filter that auto-drips and fills a glass on a 12s loop |
| `DragGallery` | inlined in `Home.tsx` | Horizontal mouse-drag scrollable signature drinks track |
| `MarqueeStrip` | inlined in `Home.tsx` | Infinite scrolling label tape; pauses on hover |
| `AnimatedCounter` | inlined in `Home.tsx` | IntersectionObserver-triggered count-up numbers |
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

### Workflow

GitHub Pages deployment is handled inside the per-store CI/CD workflow — there is no separate `gh-pages.yml`. The `deploy-frontend` job in `ci-cd-phin-drips.yml` owns the active Pages deploy.

**Currently deploying:** Phin Drips

### Setup (one-time)

1. Go to your repo → **Settings → Pages → Source → GitHub Actions**
2. Push to `main` — the `deploy-frontend` job fires automatically after tests pass

Your site: `https://<your-username>.github.io/<repo-name>`

### Switch which store deploys to GitHub Pages

GitHub Pages supports only one active deployment per repo. To swap stores:

1. In `ci-cd-phin-drips.yml` — comment out the `deploy-frontend` job
2. In `ci-cd-phin-and-beans.yml` — uncomment the `deploy-frontend` job

The `env` block at the top of each file already has the correct store values, so no other changes are needed.

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

## Backend Deployment (Render)

Each store's FastAPI backend runs as a separate free Render service, deployed automatically on push to `main`.

### How it works

```
push to main
  └── ci-cd-<store>.yml
        ├── unit tests pass?
        │
        ▼ (both deploy jobs wait for tests)
        ├── deploy-frontend  → CSV → JSON → Vite static build → GitHub Pages
        └── deploy-backend   → push env vars to Render → trigger Render deploy
```

The frontend on GitHub Pages uses `VITE_STATIC_MODE=true` and reads from bundled JSON files — it never calls the backend. The Render backend is live and ready for when you connect a live frontend.

### One-time setup per store

**Step 1 — Create a Render service**

1. Go to [render.com](https://render.com) → sign up with GitHub
2. **New → Web Service** → connect your repo
3. Configure:

| Field | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | `Docker` |
| Branch | `main` |
| Auto-Deploy | off (GitHub Actions handles this) |

4. Copy the **Deploy Hook URL** from Settings → Deploy Hook
5. Copy the **Service ID** (`srv-xxxxxxxx`) from the service URL

**Step 2 — Add GitHub Secrets**

Go to repo → **Settings → Secrets → Actions**:

These secrets live inside their GitHub environment (e.g. `phin_drips`), so the same name is reused per environment — no store suffix needed.

| Secret | Value |
|---|---|
| `RENDER_API_KEY` | Render → Account Settings → API Keys (add to each environment) |
| `RENDER_SERVICE_ID` | `srv-xxxxxxxx` from the Render service URL |
| `RENDER_DEPLOY_HOOK` | Deploy hook URL from Render service settings |
| `COFFEE_SHOP_SECRET_KEY` | Any random string (used by FastAPI internals) |

**Step 3 — Push to `main`**

```bash
git push origin main
```

The workflow pushes all env vars to Render via the API, then triggers the deploy. Render builds the Docker image and starts the service.

> **Note:** Render free tier spins down after 15 min of inactivity — first request after idle has a ~30s cold start. Fine for a demo/portfolio site.

---

## What the CI/CD Pipeline Does Automatically

Two workflow files — one per store, path-filtered. Each only triggers when files relevant to that store change.

```
push to main (or PR)
    │
    └─ unit-test           pytest (backend)

    ▼ (push to main only, after tests pass)
    ├─ deploy-frontend     CSV → JSON → Vite static build → GitHub Pages
    └─ deploy-backend      push env vars to Render → trigger Render deploy
```

Both `deploy-frontend` and `deploy-backend` run in parallel after tests pass — they don't wait for each other.

**Workflow files:**
- `.github/workflows/ci-cd-phin-drips.yml` — active; runs tests, deploys frontend to GitHub Pages + backend to Render
- `.github/workflows/ci-cd-phin-and-beans.yml` — disabled (`workflow_dispatch` only); `deploy-frontend` job is commented out until PAB is ready to go live

---

## GitHub Secrets Reference

**Shared (one for all stores):**

| Secret | Used by |
|---|---|
| `RENDER_API_KEY` | All store CI/CD workflows — Render account API key |
| `COFFEE_SHOP_SECRET_KEY` | All store CI/CD workflows — FastAPI internal secret |

**Per-environment (same secret names, different values per GitHub environment):**

| Secret | Where to add |
|---|---|
| `RENDER_API_KEY` | `phin_drips` environment + `phin_and_beans` environment |
| `RENDER_SERVICE_ID` | `phin_drips` environment (phin-drips srv-xxx) · `phin_and_beans` environment (PAB srv-xxx) |
| `RENDER_DEPLOY_HOOK` | `phin_drips` environment · `phin_and_beans` environment |
| `COFFEE_SHOP_SECRET_KEY` | Both environments |

**GitHub Pages (optional — only needed to override default store):**

| Variable | Purpose |
|---|---|
| `VITE_STORE_SLUG` | Which store to deploy to GitHub Pages |
| `VITE_STORE_NAME` | Store display name |
| `VITE_STORE_TAGLINE` | Store tagline |
| `VITE_GRAB_URL` | Grab Food order link |

---

## Deployment Troubleshooting

### Render

**Deploy triggered but service still running old code** — check Render dashboard logs; the free tier may be cold-starting (~30s). Wait for the build to complete under the "Deploys" tab.

**`curl: (22)` in GitHub Actions deploy step** — `RENDER_API_KEY`, `RENDER_SERVICE_ID_*`, or `RENDER_DEPLOY_HOOK_*` secret is wrong or missing. Verify all three are set in repo Settings → Secrets.

**Env vars not updated on Render** — the `PUT /env-vars` call replaces all env vars; if it fails the deploy still triggers with old vars. Check the "Push env vars" step output in the Actions log.

**Service crashes on startup** — check Render logs. Most likely a missing env var — `STORE_SLUG` must match a directory under `backend/menus/`.

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
4. Create a Render service for the new store (see [Backend Deployment](#backend-deployment-render))
5. Copy workflow: `cp .github/workflows/ci-cd-phin-drips.yml .github/workflows/ci-cd-<slug>.yml` — update the `env` block and all store-specific secret names
6. Add GitHub secrets: `RENDER_SERVICE_ID_<SLUG>`, `RENDER_DEPLOY_HOOK_<SLUG>`
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
