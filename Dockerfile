# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CALENDAR_API_KEY
ARG VITE_GOOGLE_CALENDAR_CLIENT_ID
ARG VITE_GOOGLE_CALENDAR_CLIENT_SECRET
ARG VITE_DEBUG_CALENDAR
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_OPENAI_API_KEY
ARG NODE_ENV=production

# Set environment variables
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CALENDAR_API_KEY=$VITE_GOOGLE_CALENDAR_API_KEY
ENV VITE_GOOGLE_CALENDAR_CLIENT_ID=$VITE_GOOGLE_CALENDAR_CLIENT_ID
ENV VITE_GOOGLE_CALENDAR_CLIENT_SECRET=$VITE_GOOGLE_CALENDAR_CLIENT_SECRET
ENV VITE_DEBUG_CALENDAR=$VITE_DEBUG_CALENDAR
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Install security updates and wget for health check
RUN apk update && apk upgrade && apk add --no-cache ca-certificates wget curl

# Copy build files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx site if exists
RUN rm -f /etc/nginx/conf.d/default.conf.dpkg-old || true

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
