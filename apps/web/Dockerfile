# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Install dependencies
RUN npm ci --workspace=@arabic-meet/shared --workspace=@arabic-meet/web

# Build shared package first
RUN npm run build --workspace=@arabic-meet/shared

# Build web app
RUN npm run build --workspace=@arabic-meet/web

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built shared package
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built web app
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.js ./apps/web/

# Install production dependencies only
RUN npm ci --workspace=@arabic-meet/shared --workspace=@arabic-meet/web --omit=dev

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start", "--workspace=@arabic-meet/web"]
