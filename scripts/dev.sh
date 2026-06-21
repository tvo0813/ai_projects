#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

STORE=""
EXPOSE=false
CLEAN=false

for arg in "$@"; do
  case "$arg" in
    --expose) EXPOSE=true ;;
    --clean)  CLEAN=true ;;
    -*) echo "Unknown flag: $arg"; exit 1 ;;
    *) STORE="$arg" ;;
  esac
done

if [[ -z "$STORE" ]]; then
  echo "Usage: ./scripts/dev.sh <store> [--expose] [--clean]"
  echo "  ./scripts/dev.sh phin-and-beans"
  echo "  ./scripts/dev.sh phin-drips"
  echo "  ./scripts/dev.sh phin-and-beans --expose"
  echo "  ./scripts/dev.sh phin-and-beans --clean   # removes volumes, fixes node_modules errors"
  exit 1
fi

case "$STORE" in
  phin-and-beans)
    ENV_FILE="stores/phin-and-beans.env"
    FRONTEND_PORT=5173
    ;;
  phin-drips)
    ENV_FILE="stores/phin-drips.env"
    FRONTEND_PORT=5174
    ;;
  *)
    echo "Unknown store: $STORE"
    echo "Available stores: phin-and-beans, phin-drips"
    exit 1
    ;;
esac

echo "Tearing down $STORE..."
if [[ "$CLEAN" == true ]]; then
  echo "(--clean) Stopping and removing all containers with 'phin' in the name..."
  docker ps -aq --filter "name=phin" | xargs -r docker rm -f
  echo "(--clean) Removing all volumes with 'phin' in the name..."
  docker volume ls -q | grep phin | xargs -r docker volume rm
  echo "(--clean) Pruning anonymous volumes (stale node_modules)..."
  docker volume ls -q | grep -v '[a-z]' | xargs -r docker volume rm
  docker compose -p "$STORE" down -v
else
  docker compose -p "$STORE" down
fi

echo "Starting $STORE..."
docker compose --env-file "$ENV_FILE" -p "$STORE" up --build -d

echo "Waiting for frontend to be ready on port $FRONTEND_PORT..."
until curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; do
  sleep 1
done

echo "$STORE is up at http://localhost:$FRONTEND_PORT"

if [[ "$EXPOSE" == true ]]; then
  echo "Starting ngrok tunnel..."
  ngrok http "$FRONTEND_PORT"
else
  echo "Tip: run with --expose to share publicly via ngrok"
fi
