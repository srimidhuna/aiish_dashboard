# ─────────────────────────────────────────────────────────────────────────────
# AIISH Frontend — Dockerfile
# Base: node:22-alpine  (pinned per spec: Node.js 22 LTS)
#
# Runs the Vite development server (npm run dev).
# For production, swap CMD to: npm run build && npm run preview
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer cache friendly)
COPY package*.json ./
RUN npm ci

# Copy source — docker-compose also bind-mounts ./frontend:/app for hot-reload
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
