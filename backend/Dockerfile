# ─────────────────────────────────────────────────────────────────────────────
# AIISH Backend — Dockerfile
# Base: node:22-alpine  (pinned per spec: Node.js 22 LTS)
#
# Build strategy:
#   Stage 1 (builder) — install all deps and compile TypeScript
#   Stage 2 (runner)  — copy compiled output + prod deps only
#
# Entrypoint:
#   1. Run `prisma migrate deploy` — applies any pending migrations.
#      If migration fails the script exits non-zero, container stops, and
#      Docker will NOT start the application. This prevents a partially-
#      migrated database from serving traffic.
#   2. Run the compiled NestJS application.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# openssl is required by the Prisma engines (both for `prisma generate` at
# build time and the query engine at runtime).
RUN apk add --no-cache openssl

# Copy package files first (layer-cache friendly)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDeps needed to compile TS)
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install wget for healthcheck (alpine doesn't include it by default) and
# openssl, which the Prisma query engine needs to detect libssl at runtime.
RUN apk add --no-cache wget openssl

# Copy package files and install PRODUCTION deps only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and Prisma schema + generated client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy the entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE ${PORT:-3001}

ENTRYPOINT ["./docker-entrypoint.sh"]
