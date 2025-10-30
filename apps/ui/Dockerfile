FROM node:20.11.0-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy UI package files
COPY apps/ui/package*.json ./apps/ui/
COPY apps/ui/tsconfig.json ./apps/ui/
COPY apps/ui/angular.json ./apps/ui/

# Install dependencies
RUN npm ci --workspace=apps/ui

# Copy source code
COPY apps/ui/src ./apps/ui/src
COPY apps/ui/public ./apps/ui/public
COPY libs ./libs

# Build
RUN npm run build:ui

# Production stage with Nginx
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/apps/ui/dist/ui/browser /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]