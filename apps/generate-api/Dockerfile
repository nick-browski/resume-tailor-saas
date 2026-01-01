FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/generate-api/package.json ./apps/generate-api/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY apps/generate-api ./apps/generate-api

# Build the service
WORKDIR /app/apps/generate-api
RUN pnpm build

FROM node:18-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/generate-api/package.json ./apps/generate-api/

# Install production dependencies
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/apps/generate-api/dist ./apps/generate-api/dist

WORKDIR /app/apps/generate-api

EXPOSE 8081

CMD ["node", "dist/index.js"]

