# Multi-stage build for Angular application
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application with production configuration
RUN npm run build -- --configuration=production

# Production stage with nginx
FROM nginx:alpine

# Remove default nginx config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built application from build stage
COPY --from=build /app/dist/OEFAFront /usr/share/nginx/html

# Setup directories with correct permissions for OpenShift
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R g+rwx /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:root /var/cache/nginx /var/log/nginx /var/run && \
    chmod -R g+rw /usr/share/nginx/html && \
    chown -R nginx:root /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'set -e' >> /startup.sh && \
    echo 'echo "Substituting environment variables in nginx config..."' >> /startup.sh && \
    echo 'export BACKEND_PROXY_URL=${BACKEND_PROXY_URL:-"https://srvlb01.okd-dev.oefa.gob.pe"}' >> /startup.sh && \
    echo 'echo "BACKEND_PROXY_URL: $BACKEND_PROXY_URL"' >> /startup.sh && \
    echo 'envsubst "\$BACKEND_PROXY_URL" < /etc/nginx/nginx.conf.template > /tmp/nginx.conf' >> /startup.sh && \
    echo 'cat /tmp/nginx.conf > /etc/nginx/nginx.conf' >> /startup.sh && \
    echo 'echo "Starting nginx..."' >> /startup.sh && \
    echo 'exec nginx -g "daemon off;"' >> /startup.sh && \
    chmod +x /startup.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:9080/health || exit 1

# Expose port 9080
EXPOSE 9080

# Run as nginx user for security
USER nginx

# Start nginx with environment variable substitution
CMD ["/startup.sh"]
