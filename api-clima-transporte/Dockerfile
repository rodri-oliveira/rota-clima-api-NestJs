# syntax=docker/dockerfile:1

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install OS deps (optional)
RUN apk add --no-cache python3 make g++

# Copy manifests and install deps
COPY package*.json ./
RUN npm ci --omit=dev=false

# Copy sources
COPY . .

# Build
RUN npm run build

# Prune dev deps for runtime
RUN npm prune --omit=dev

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app and node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 3000

# Healthcheck (simple)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/health || exit 1

# Start
CMD ["npm", "run", "start:prod"]
