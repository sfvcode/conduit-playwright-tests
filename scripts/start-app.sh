#!/usr/bin/env bash
# Starts the Conduit app in production mode.
# One server on port 3001 serves both the website and the API (/api).
set -euo pipefail

# Load .env if it exists, so local settings are picked up.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ ! -d .app/backend ]; then
  echo "The app is not set up yet. Run: npm run app:setup" >&2
  exit 1
fi

export NODE_ENV=production
export PORT="${APP_PORT:-3001}"
export JWT_KEY="${JWT_KEY:-local-test-secret}"
export PROD_DB_HOSTNAME="${DB_HOST:-127.0.0.1}"
export PROD_DB_USERNAME="${DB_USER:-postgres}"
export PROD_DB_PASSWORD="${DB_PASSWORD:-postgres}"
export PROD_DB_NAME="${DB_NAME:-conduit}"
export PROD_DB_DIALECT=postgres

cd .app/backend
exec node index.js
