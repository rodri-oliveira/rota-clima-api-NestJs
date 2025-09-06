# syntax=docker/dockerfile:1

# Build stage (Debian-based, OpenSSL 3)
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install OS deps for building native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy manifests and install deps
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy sources
COPY . .

# Build
RUN npm run build

# Generate Prisma Client (ensure engines are baked into node_modules for runtime)
RUN npx prisma generate

# Prune dev deps for runtime
RUN npm prune --omit=dev

# Runtime stage (Debian-based, OpenSSL 3)
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy built app and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:3000/health || exit 1

# Start
CMD ["npm", "run", "start:prod"]
