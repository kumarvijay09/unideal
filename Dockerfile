# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build the Vite frontend application
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies using standard npm (avoids Corepack/pnpm lockfile network errors)
COPY package.json ./
RUN npm install

# Copy source code (excluding node_modules via .dockerignore)
COPY . .

# Build production bundle
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production runtime image
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package.json ./
RUN npm install --omit=dev

# Copy backend server code and built assets from Stage 1
COPY server ./server
COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/server/data /app/server/uploads

# Expose cloud container ports
EXPOSE 10000 8080 5000

# Start unified full-stack server
CMD ["node", "server/index.js"]
