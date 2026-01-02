FROM node:18-slim AS builder

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/generate-api/package.json ./apps/generate-api/

# Install dependencies
RUN corepack enable pnpm && corepack prepare pnpm@10.15.1 --activate && pnpm install --frozen-lockfile

# Copy source code
COPY apps/generate-api ./apps/generate-api

# Build the service
WORKDIR /app/apps/generate-api
RUN pnpm build

FROM node:18-slim

WORKDIR /app

# Install system dependencies for Playwright (Debian-based images work better)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/generate-api/package.json ./apps/generate-api/

# Install production dependencies (including Playwright)
RUN corepack enable pnpm && corepack prepare pnpm@10.15.1 --activate && pnpm install --prod --frozen-lockfile

# Install Playwright browsers
WORKDIR /app/apps/generate-api
RUN PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright pnpm exec playwright install chromium --only-shell

# Set environment variables for Playwright
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy built files from builder
COPY --from=builder /app/apps/generate-api/dist ./dist

EXPOSE 8081

CMD ["node", "dist/index.js"]

