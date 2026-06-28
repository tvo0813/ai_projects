STORES := phin-and-beans phin-drips

# Port map per store
port-phin-and-beans := 5173
port-phin-drips     := 5174

backend-port-phin-and-beans := 8000
backend-port-phin-drips     := 8001

.DEFAULT_GOAL := help

# ── Help ──────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  Coffee & Tea App — Dev Commands"
	@echo ""
	@echo "  Per-store  (STORE= phin-and-beans | phin-drips)"
	@echo "  ──────────────────────────────────────────────────────────"
	@echo "  make up    STORE=phin-and-beans    Start store (build if needed)"
	@echo "  make down  STORE=phin-drips        Stop store, remove containers"
	@echo "  make build STORE=phin-drips        Rebuild images without starting"
	@echo "  make restart STORE=phin-and-beans  Rebuild + restart store"
	@echo "  make logs  STORE=phin-drips        Tail all logs"
	@echo "  make logs-web STORE=phin-drips     Tail frontend logs only"
	@echo "  make logs-api STORE=phin-drips     Tail backend logs only"
	@echo "  make expose STORE=phin-and-beans   ngrok tunnel on frontend port"
	@echo "  make ps    STORE=phin-and-beans    Show running containers"
	@echo "  make clean STORE=phin-and-beans    Stop + remove containers & volumes"
	@echo ""
	@echo "  All-stores"
	@echo "  ──────────────────────────────────────────────────────────"
	@echo "  make up-all                        Start all 3 stores"
	@echo "  make down-all                      Stop all 3 stores"
	@echo "  make clean-all                     Full teardown of all stores"
	@echo "  make ps-all                        Show containers for all stores"
	@echo ""
	@echo "  Utilities"
	@echo "  ──────────────────────────────────────────────────────────"
	@echo "  make nuke                          Remove ALL Docker containers, volumes, networks"
	@echo "  make prune                         docker system prune (reclaim disk)"
	@echo "  make open   STORE=phin-and-beans   Open store in browser"
	@echo "  make status                        Show ports + health for all stores"
	@echo ""
	@echo "  GitHub Pages (static, no backend)"
	@echo "  ──────────────────────────────────────────────────────────"
	@echo "  make static-data                   Generate JSON from all store CSVs"
	@echo "  make static-build [STORE=slug]     Full static build for GitHub Pages"
	@echo "  make static-preview [STORE=slug]   Build + preview locally at :4173"
	@echo ""

# ── Guard: require STORE ──────────────────────────────────────────────────────
_require-store:
ifndef STORE
	$(error STORE is required. Usage: make <target> STORE=<phin-and-beans|phin-drips>)
endif
ifeq ($(filter $(STORE),$(STORES)),)
	$(error Unknown STORE "$(STORE)". Valid: $(STORES))
endif

# ── Per-store helpers ─────────────────────────────────────────────────────────
_env     = stores/$(1).env
_project = $(1)
_fport   = $(port-$(1))
_bport   = $(backend-port-$(1))

# ── up ────────────────────────────────────────────────────────────────────────
.PHONY: up
up: _require-store
	@echo "▶  Starting $(STORE)..."
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) up --build -d
	@echo "✓  $(STORE) is up"
	@echo "   Frontend → http://localhost:$(call _fport,$(STORE))"
	@echo "   API      → http://localhost:$(call _bport,$(STORE))"
	@echo "   Swagger  → http://localhost:$(call _bport,$(STORE))/api/docs"

# ── down ──────────────────────────────────────────────────────────────────────
.PHONY: down
down: _require-store
	@echo "■  Stopping $(STORE)..."
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) down
	@echo "✓  $(STORE) stopped."

# ── build ─────────────────────────────────────────────────────────────────────
.PHONY: build
build: _require-store
	@echo "🔨 Building $(STORE) images..."
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) build
	@echo "✓  Build complete."

# ── restart ───────────────────────────────────────────────────────────────────
.PHONY: restart
restart: _require-store
	@echo "↺  Restarting $(STORE)..."
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) down
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) up --build -d
	@echo "✓  $(STORE) restarted → http://localhost:$(call _fport,$(STORE))"

# ── logs ──────────────────────────────────────────────────────────────────────
.PHONY: logs
logs: _require-store
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) logs -f

.PHONY: logs-web
logs-web: _require-store
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) logs -f coffee-tea-web

.PHONY: logs-api
logs-api: _require-store
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) logs -f coffee-tea-api

# ── ps ────────────────────────────────────────────────────────────────────────
.PHONY: ps
ps: _require-store
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) ps

# ── clean ─────────────────────────────────────────────────────────────────────
.PHONY: clean
clean: _require-store
	@echo "🗑  Cleaning $(STORE) containers and volumes..."
	docker compose --env-file $(call _env,$(STORE)) -p $(call _project,$(STORE)) down -v --remove-orphans
	@echo "✓  $(STORE) cleaned."

# ── expose ────────────────────────────────────────────────────────────────────
.PHONY: expose
expose: _require-store
	@echo "🌐 Opening ngrok tunnel for $(STORE) on port $(call _fport,$(STORE))..."
	ngrok http $(call _fport,$(STORE))

# ── open ──────────────────────────────────────────────────────────────────────
.PHONY: open
open: _require-store
	@open http://localhost:$(call _fport,$(STORE)) 2>/dev/null || \
	 xdg-open http://localhost:$(call _fport,$(STORE)) 2>/dev/null || \
	 echo "Open http://localhost:$(call _fport,$(STORE)) in your browser"

# ── All-stores targets ────────────────────────────────────────────────────────
.PHONY: up-all
up-all:
	@for store in $(STORES); do \
		echo "▶  Starting $$store..."; \
		docker compose --env-file stores/$$store.env -p $$store up --build -d; \
	done
	@echo ""
	@echo "✓  All stores running:"
	@echo "   Phin and Beans → http://localhost:5173"
	@echo "   Phin Drips     → http://localhost:5174"

.PHONY: down-all
down-all:
	@for store in $(STORES); do \
		echo "■  Stopping $$store..."; \
		docker compose --env-file stores/$$store.env -p $$store down; \
	done
	@echo "✓  All stores stopped."

.PHONY: clean-all
clean-all:
	@for store in $(STORES); do \
		echo "🗑  Cleaning $$store..."; \
		docker compose --env-file stores/$$store.env -p $$store down -v --remove-orphans; \
	done
	@echo "✓  All stores cleaned."

.PHONY: ps-all
ps-all:
	@for store in $(STORES); do \
		echo "── $$store ──"; \
		docker compose --env-file stores/$$store.env -p $$store ps 2>/dev/null || true; \
		echo ""; \
	done

# ── status ────────────────────────────────────────────────────────────────────
.PHONY: status
status:
	@echo ""
	@echo "  Store            Frontend                  Backend"
	@echo "  ──────────────── ──────────────────────── ────────────────────────"
	@for store in $(STORES); do \
		fport=$$(grep FRONTEND_PORT stores/$$store.env | cut -d= -f2); \
		bport=$$(grep BACKEND_PORT  stores/$$store.env | cut -d= -f2); \
		fstatus=$$(curl -s -o /dev/null -w "%{http_code}" --max-time 1 http://localhost:$$fport 2>/dev/null || echo "off"); \
		bstatus=$$(curl -s -o /dev/null -w "%{http_code}" --max-time 1 http://localhost:$$bport/api/menu/ 2>/dev/null || echo "off"); \
		ficon="✗"; bicon="✗"; \
		[ "$$fstatus" != "off" ] && ficon="✓"; \
		[ "$$bstatus" != "off" ] && bicon="✓"; \
		printf "  %-16s $$ficon  http://localhost:$$fport     $$bicon  http://localhost:$$bport\n" "$$store"; \
	done
	@echo ""

# ── nuke ──────────────────────────────────────────────────────────────────────
.PHONY: nuke
nuke:
	@echo "⚠  This will remove ALL Docker containers, volumes, and networks."
	@read -p "   Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker ps -aq  | xargs -r docker rm -f
	docker volume ls -q | xargs -r docker volume rm
	docker network ls --filter type=custom -q | xargs -r docker network rm
	@echo "✓  All Docker resources removed."

# ── prune ─────────────────────────────────────────────────────────────────────
.PHONY: prune
prune:
	docker system prune -f
	@echo "✓  Docker system pruned."

# ── GitHub Pages / static build ───────────────────────────────────────────────
# Generate static JSON from all store CSVs (no backend needed)
.PHONY: static-data
static-data:
	@echo "📦 Generating static JSON data..."
	node scripts/generate-static-data.js
	@echo "✓  Data written to frontend/public/data/"

# Build for GitHub Pages (VITE_STATIC_MODE=true, no backend)
.PHONY: static-build
static-build: static-data
	@echo "🔨 Building static site for $(or $(STORE),phin-and-beans)..."
	cd frontend && \
	  VITE_STATIC_MODE=true \
	  VITE_STORE_SLUG=$(or $(STORE),phin-and-beans) \
	  VITE_STORE_NAME="$(or $(STORE_NAME),Phin and Beans)" \
	  VITE_STORE_TAGLINE="$(or $(STORE_TAGLINE),Vietnamese-inspired coffee & tea, crafted with care.)" \
	  VITE_GRAB_URL="$(or $(GRAB_URL),)" \
	  npm run build
	cp frontend/dist/index.html frontend/dist/404.html
	@echo "✓  Static build in frontend/dist/ (ready for GitHub Pages)"

# Preview the static build locallyy
.PHONY: static-preview
static-preview: static-build
	@echo "🌐 Previewing static build at http://localhost:4173 ..."
	cd frontend && npm run preview
