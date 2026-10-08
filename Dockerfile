# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build the Vite frontend application
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code and build frontend bundle
COPY . .
RUN pnpm run build

# -------------------------------------------------------------
# Stage 2: Production runtime image
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy backend server code and built assets from Stage 1
COPY server ./server
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/server/data /app/server/uploads

# Expose cloud container port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start unified full-stack server
CMD ["node", "server/index.js"]
