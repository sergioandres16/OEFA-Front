# Multi-stage build for Angular application
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Production stage with nginx
FROM nginx:alpine

# Remove default nginx config and html
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built application
COPY --from=build /app/dist/OEFAFront /usr/share/nginx/html

# Setup directories with correct permissions for OpenShift
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chown -R nginx:root /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx && \
    chmod -R 775 /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chmod -R 775 /usr/share/nginx/html && \
    chmod -R 775 /etc/nginx

# Copy custom nginx configuration to a writable location
COPY nginx.conf /tmp/nginx.conf.template

# Create startup script in a writable location
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'set -e' >> /startup.sh && \
    echo 'echo "Substituting environment variables..."' >> /startup.sh && \
    echo 'export BACKEND_PROXY_URL=${BACKEND_PROXY_URL:-"https://srvlb01.okd-dev.oefa.gob.pe"}' >> /startup.sh && \
    echo 'echo "BACKEND_PROXY_URL: $BACKEND_PROXY_URL"' >> /startup.sh && \
    echo 'envsubst "\$BACKEND_PROXY_URL" < /tmp/nginx.conf.template > /tmp/nginx.conf' >> /startup.sh && \
    echo 'cp /tmp/nginx.conf /etc/nginx/nginx.conf' >> /startup.sh && \
    echo 'chmod 644 /etc/nginx/nginx.conf' >> /startup.sh && \
    echo 'echo "Starting nginx..."' >> /startup.sh && \
    echo 'exec nginx -g "daemon off;"' >> /startup.sh && \
    chmod +x /startup.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:9080/health || exit 1

EXPOSE 9080

# Important: Run as nginx user (UID 101)
USER 101

CMD ["/startup.sh"]
