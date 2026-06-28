#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

STORE=""
EXPOSE=false
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --store=*) STORE="${arg#--store=}" ;;
    --expose)  EXPOSE=true ;;
    --clean)   CLEAN=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

if [[ -z "$STORE" && "$CLEAN" == false && "$EXPOSE" == false ]]; then
  echo "Usage: ./scripts/dev.sh [--store=<store>] [--clean] [--expose]"
  echo ""
  echo "  --store=<store>   Store to deploy (phin-and-beans, phin-drips)"
  echo "  --clean           Tear down store containers/volumes, or all Docker if no --store"
  echo "  --expose          Expose frontend via ngrok tunnel after deploy"
  echo ""
  echo "Examples:"
  echo "  ./scripts/dev.sh --store=phin-and-beans"
  echo "  ./scripts/dev.sh --store=phin-and-beans --clean --expose"
  echo "  ./scripts/dev.sh --clean                          # wipes ALL docker containers + volumes"
  exit 0
fi

# Resolve store config
if [[ -n "$STORE" ]]; then
  case "$STORE" in
    phin-and-beans) ENV_FILE="stores/phin-and-beans.env"; FRONTEND_PORT=5173 ;;
    phin-drips)     ENV_FILE="stores/phin-drips.env";     FRONTEND_PORT=5174 ;;
    *)
      echo "Unknown store: $STORE"
      echo "Available stores: phin-and-beans, phin-drips"
      exit 1
      ;;
  esac
fi

# ── 1. Clean ──────────────────────────────────────────────────────────────────
if [[ "$CLEAN" == true ]]; then
  if [[ -n "$STORE" ]]; then
    echo "Cleaning up $STORE..."
    docker ps -aq --filter "name=$STORE" | xargs -r docker rm -f
    docker volume ls -q | grep "$STORE" | xargs -r docker volume rm
    docker volume ls -q | grep -v '[a-z]' | xargs -r docker volume rm
    docker compose -p "$STORE" down -v
    echo "$STORE cleaned."
  else
    echo "Cleaning all Docker containers, volumes, and networks..."
    docker ps -aq | xargs -r docker rm -f
    docker volume ls -q | xargs -r docker volume rm
    docker network ls --filter type=custom -q | xargs -r docker network rm
    echo "All Docker resources cleaned."
  fi
fi

# ── 2. Deploy ─────────────────────────────────────────────────────────────────
if [[ -n "$STORE" ]]; then
  echo "Starting $STORE..."
  docker compose --env-file "$ENV_FILE" -p "$STORE" up --build -d

  echo "Waiting for frontend on port $FRONTEND_PORT..."
  until curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; do
    sleep 1
  done
  echo "$STORE is up at http://localhost:$FRONTEND_PORT"
fi

# ── 3. Expose ─────────────────────────────────────────────────────────────────
if [[ "$EXPOSE" == true ]]; then
  if [[ -z "$STORE" ]]; then
    echo "Error: --expose requires --store=<store>"
    exit 1
  fi
  echo "Starting ngrok tunnel on port $FRONTEND_PORT..."
  ngrok http "$FRONTEND_PORT"
fi
