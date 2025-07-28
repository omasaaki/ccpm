# Multi-stage build for CCPM Backend
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies and security updates
RUN apk add --no-cache python3 make g++ dumb-init openssl openssl-dev && \
    apk upgrade

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci --legacy-peer-deps
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl openssl-dev

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Set Prisma binary target for Alpine Linux
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query_engine-linux-musl
ENV PRISMA_MIGRATION_ENGINE_BINARY=/app/node_modules/.prisma/client/migration_engine-linux-musl
ENV PRISMA_INTROSPECTION_ENGINE_BINARY=/app/node_modules/.prisma/client/introspection_engine-linux-musl
ENV PRISMA_FMT_BINARY=/app/node_modules/.prisma/client/prisma-fmt-linux-musl

# Copy source and build
COPY . .

# Generate Prisma client for Alpine Linux
RUN npx prisma generate

# Build application
RUN npm run build && \
    npm prune --production --legacy-peer-deps

# Production stage
FROM node:18-alpine AS production

# Install security updates and dumb-init
RUN apk add --no-cache dumb-init openssl openssl-dev && \
    apk upgrade

# Set Prisma binary targets for Alpine Linux
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/.prisma/client/query_engine-linux-musl
ENV PRISMA_MIGRATION_ENGINE_BINARY=/app/node_modules/.prisma/client/migration_engine-linux-musl
ENV PRISMA_INTROSPECTION_ENGINE_BINARY=/app/node_modules/.prisma/client/introspection_engine-linux-musl
ENV PRISMA_FMT_BINARY=/app/node_modules/.prisma/client/prisma-fmt-linux-musl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma
COPY --from=builder --chown=backend:nodejs /app/package*.json ./

# Create optimized health check script
RUN echo 'const http = require("http"); \
const options = { hostname: "localhost", port: 3001, path: "/health", timeout: 2000 }; \
const req = http.request(options, (res) => { \
  process.exit(res.statusCode === 200 ? 0 : 1); \
}); \
req.on("error", () => process.exit(1)); \
req.on("timeout", () => process.exit(1)); \
req.end();' > healthcheck.js && \
chown backend:nodejs healthcheck.js

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3001

# Enhanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node healthcheck.js

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]