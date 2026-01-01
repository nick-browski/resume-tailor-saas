FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/documents-api/package.json ./apps/documents-api/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY apps/documents-api ./apps/documents-api

# Build the service
WORKDIR /app/apps/documents-api
RUN pnpm build

FROM node:18-alpine

WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/documents-api/package.json ./apps/documents-api/

# Install production dependencies
RUN corepack enable pnpm && pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/apps/documents-api/dist ./apps/documents-api/dist

WORKDIR /app/apps/documents-api

EXPOSE 8080

CMD ["node", "dist/index.js"]

