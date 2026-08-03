# Mukurtham Matrimony Backend — Production Dockerfile
# Multi-stage build for minimal, secure production image

# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and install all deps (including devDeps for TS build)
COPY package*.json ./
RUN npm ci

# Copy source and Prisma schema
COPY . .
COPY ../database/prisma ./prisma

# Generate Prisma client and compile TypeScript
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN npm run build

# ============================================================
# Stage 2: Production Runner
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/infrastructure ./infrastructure

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs
USER expressjs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

CMD ["node", "dist/app.js"]
