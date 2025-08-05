# Multi-stage build for Angular application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application with increased budget limits
RUN npm run build -- --configuration=production

# Production stage with nginx
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/dist/OEFAFront /usr/share/nginx/html

# Setup directories and permissions for OpenShift
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    mkdir -p /var/log/nginx /var/run/nginx && \
    chmod -R 777 /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html && \
    chmod -R 755 /etc/nginx

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create environment script that works with read-only filesystem
RUN echo '#!/bin/sh' > /docker-entrypoint.d/env.sh && \
    echo 'echo "Injecting environment variables..."' >> /docker-entrypoint.d/env.sh && \
    echo 'MAIN_JS_FILE=$(find /usr/share/nginx/html -name "main*.js" | head -1)' >> /docker-entrypoint.d/env.sh && \
    echo 'if [ -z "$MAIN_JS_FILE" ]; then' >> /docker-entrypoint.d/env.sh && \
    echo '    echo "Warning: main*.js file not found"' >> /docker-entrypoint.d/env.sh && \
    echo '    exit 0' >> /docker-entrypoint.d/env.sh && \
    echo 'fi' >> /docker-entrypoint.d/env.sh && \
    echo 'echo "Found main JS file: $MAIN_JS_FILE"' >> /docker-entrypoint.d/env.sh && \
    echo 'API_BASE_URL=${API_BASE_URL:-"https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe"}' >> /docker-entrypoint.d/env.sh && \
    echo 'FRONTEND_BASE_URL=${FRONTEND_BASE_URL:-"https://oefa-front.apps.okd-dev.oefa.gob.pe"}' >> /docker-entrypoint.d/env.sh && \
    echo 'echo "API_BASE_URL: $API_BASE_URL"' >> /docker-entrypoint.d/env.sh && \
    echo 'echo "FRONTEND_BASE_URL: $FRONTEND_BASE_URL"' >> /docker-entrypoint.d/env.sh && \
    echo 'cp "$MAIN_JS_FILE" "$MAIN_JS_FILE.tmp"' >> /docker-entrypoint.d/env.sh && \
    echo 'sed "s|__API_BASE_URL__|$API_BASE_URL|g; s|__FRONTEND_BASE_URL__|$FRONTEND_BASE_URL|g" "$MAIN_JS_FILE.tmp" > "$MAIN_JS_FILE"' >> /docker-entrypoint.d/env.sh && \
    echo 'rm -f "$MAIN_JS_FILE.tmp"' >> /docker-entrypoint.d/env.sh && \
    echo 'echo "Environment variables injected successfully"' >> /docker-entrypoint.d/env.sh && \
    chmod +x /docker-entrypoint.d/env.sh

# Expose port 9080
EXPOSE 9080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]