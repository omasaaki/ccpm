# Frontend Dockerfile for CCPM
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Development stage
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production

# Create nginx user
RUN addgroup -g 1001 -S nginx-group
RUN adduser -S frontend -u 1001 -G nginx-group

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder --chown=frontend:nginx-group /app/dist /usr/share/nginx/html

# Copy nginx template for environment variables
COPY nginx.template /etc/nginx/templates/default.conf.template

# Switch to non-root user
USER frontend

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]