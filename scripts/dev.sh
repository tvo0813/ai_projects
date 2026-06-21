#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

STORE="$1"

if [[ -z "$STORE" ]]; then
  echo "Usage: ./scripts/dev.sh <store>"
  echo "  ./scripts/dev.sh phin-and-beans"
  echo "  ./scripts/dev.sh phin-drips"
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

echo "Starting $STORE..."
docker compose --env-file "$ENV_FILE" -p "$STORE" up --build -d

echo "Waiting for frontend to be ready on port $FRONTEND_PORT..."
until curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; do
  sleep 1
done

echo "$STORE is up at http://localhost:$FRONTEND_PORT"
echo "Starting ngrok tunnel..."
ngrok http "$FRONTEND_PORT"
