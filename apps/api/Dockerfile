# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install dependencies
RUN npm ci --workspace=@arabic-meet/shared --workspace=@arabic-meet/api

# Build shared package first
RUN npm run build --workspace=@arabic-meet/shared

# Build API
RUN npm run build --workspace=@arabic-meet/api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built shared package
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built API
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN npm ci --workspace=@arabic-meet/shared --workspace=@arabic-meet/api --omit=dev

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:prod", "--workspace=@arabic-meet/api"]
