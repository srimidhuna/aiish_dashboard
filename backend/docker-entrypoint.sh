#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# docker-entrypoint.sh
#
# Runs before the NestJS application starts.
#   1. Applies Prisma migrations (prisma migrate deploy).
#      - On success: logs and continues to start the app.
#      - On failure: logs the error and exits non-zero so Docker marks the
#        container as failed. The backend WILL NOT start in a broken state.
#   2. Starts the compiled NestJS application.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "[entrypoint] Running Prisma migrations..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied successfully."
else
  echo "[entrypoint] ERROR: Prisma migration failed. Aborting startup." >&2
  exit 1
fi

echo "[entrypoint] Seeding master/demo data (idempotent)..."
if node dist/prisma/seed.js; then
  echo "[entrypoint] Seed completed successfully."
else
  echo "[entrypoint] ERROR: Seed failed. Aborting startup." >&2
  exit 1
fi

echo "[entrypoint] Starting AIISH backend..."
exec node dist/main
