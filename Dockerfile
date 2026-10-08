# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build the Vite frontend application
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (use --no-frozen-lockfile to prevent mismatch errors)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

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

# Install production dependencies only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --no-frozen-lockfile

# Copy backend server code and built assets from Stage 1
COPY server ./server
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/server/data /app/server/uploads

# Expose common cloud ports
EXPOSE 10000 8080 5000

# Start unified full-stack server
CMD ["node", "server/index.js"]
