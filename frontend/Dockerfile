# Multi-stage build for CCPM Frontend
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install security updates
RUN apk upgrade

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .

# Build production assets
RUN npm run build

# Production stage with optimized Nginx
FROM nginx:1.25-alpine AS production

# Install security updates and curl for health checks
RUN apk upgrade && \
    apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S frontend -u 1001 -G nginx-group

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application with proper ownership
COPY --from=builder --chown=frontend:nginx-group /app/dist /usr/share/nginx/html

# Copy nginx template for runtime configuration
COPY nginx.template /etc/nginx/templates/default.conf.template

# Create health check script
RUN echo '#!/bin/sh\ncurl -f http://localhost:80/ || exit 1' > /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh && \
    chown frontend:nginx-group /usr/local/bin/health-check.sh

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R frontend:nginx-group /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /var/run

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 80

# Enhanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Set production environment
ENV NODE_ENV=production

# Start nginx
CMD ["nginx", "-g", "daemon off;"]