#!/usr/bin/env bash
# Downloads and builds the app under test (RealWorld "Conduit", React + Express).
# The app is pinned to one commit, so the tests always run against the same version.
set -euo pipefail

APP_REPO="https://github.com/TonyMckes/conduit-realworld-example-app.git"
APP_COMMIT="5e127d8569b300e0a21dc2c20ea680da4967b1aa"
APP_DIR=".app"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Cloning the Conduit app into $APP_DIR ..."
  git clone --quiet "$APP_REPO" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --quiet origin "$APP_COMMIT" || true
git checkout --quiet "$APP_COMMIT"

echo "Installing app dependencies ..."
npm ci --no-audit --no-fund

echo "Building the frontend ..."
npm run build -w frontend

echo "Done. Start the app with: npm run app:start"
