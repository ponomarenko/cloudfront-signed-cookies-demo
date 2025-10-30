FROM node:20.11.0-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy API package files
COPY apps/api/package*.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/
COPY apps/api/nest-cli.json ./apps/api/

# Install dependencies
RUN npm ci --workspace=apps/api

# Copy source code
COPY apps/api/src ./apps/api/src
COPY libs ./libs

# Build
RUN npm run build:api

# Production stage
FROM node:20.11.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace=apps/api --omit=dev

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Create secrets directory
RUN mkdir -p apps/api/secrets

EXPOSE 3000

CMD ["node", "apps/api/dist/main"]