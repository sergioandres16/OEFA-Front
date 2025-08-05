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

# Remove default nginx config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built application from build stage
COPY --from=build /app/dist/OEFAFront /usr/share/nginx/html

# Setup directories and permissions for OpenShift
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp && \
    mkdir -p /var/log/nginx /var/run/nginx && \
    chmod -R 777 /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html && \
    chmod -R 755 /etc/nginx

# Copy custom nginx configuration as template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Create startup script for environment variable substitution
RUN echo '#!/bin/sh' > /usr/local/bin/start-nginx.sh && \
    echo 'set -e' >> /usr/local/bin/start-nginx.sh && \
    echo 'echo "Substituting environment variables in nginx config..."' >> /usr/local/bin/start-nginx.sh && \
    echo 'export BACKEND_PROXY_URL=${BACKEND_PROXY_URL:-"https://srvlb01.okd-dev.oefa.gob.pe"}' >> /usr/local/bin/start-nginx.sh && \
    echo 'echo "BACKEND_PROXY_URL: $BACKEND_PROXY_URL"' >> /usr/local/bin/start-nginx.sh && \
    echo 'envsubst "\$BACKEND_PROXY_URL" < /etc/nginx/nginx.conf.template > /tmp/nginx.conf' >> /usr/local/bin/start-nginx.sh && \
    echo 'cp /tmp/nginx.conf /etc/nginx/nginx.conf' >> /usr/local/bin/start-nginx.sh && \
    echo 'echo "Starting nginx..."' >> /usr/local/bin/start-nginx.sh && \
    echo 'exec nginx -g "daemon off;"' >> /usr/local/bin/start-nginx.sh && \
    chmod +x /usr/local/bin/start-nginx.sh

# Expose port 9080
EXPOSE 9080

# Start nginx with environment variable substitution
CMD ["/usr/local/bin/start-nginx.sh"]