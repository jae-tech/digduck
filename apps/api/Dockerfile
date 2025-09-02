# Multi-stage build for production optimization
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./

# Copy API package.json for dependency resolution
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Copy packages if they exist
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy API source code
COPY apps/api/ ./apps/api/

# Build stage
FROM base AS builder

# Generate Prisma client
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Build the application
WORKDIR /app
RUN pnpm turbo run build --filter=api

# Production stage
FROM node:22-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/turbo.json ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist/
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/prisma ./apps/api/prisma/
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules/

# Install only production dependencies (if needed)
RUN pnpm install --prod --frozen-lockfile

# Copy startup script
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist/

# Switch to nodejs user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start the application
WORKDIR /app/apps/api
CMD ["dumb-init", "node", "dist/server.js"]
