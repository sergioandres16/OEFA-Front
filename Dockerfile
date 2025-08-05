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

# Configure OpenShift compatible permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chgrp -R 0 /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx && \
    chmod -R g=u /var/cache/nginx /var/log/nginx /var/run/nginx /usr/share/nginx/html /etc/nginx && \
    chmod -R g+rwx /var/run/nginx && \
    touch /var/run/nginx.pid && \
    chgrp 0 /var/run/nginx.pid && \
    chmod g+rw /var/run/nginx.pid

# Copy custom nginx configuration to tmp
COPY nginx.conf /tmp/nginx.conf.template

# Create startup script
RUN echo '#!/bin/sh' > /startup.sh && \
    echo 'set -e' >> /startup.sh && \
    echo 'echo "Substituting environment variables..."' >> /startup.sh && \
    echo 'export BACKEND_PROXY_URL=${BACKEND_PROXY_URL:-"https://srvlb01.okd-dev.oefa.gob.pe"}' >> /startup.sh && \
    echo 'echo "BACKEND_PROXY_URL: $BACKEND_PROXY_URL"' >> /startup.sh && \
    echo 'envsubst "\$BACKEND_PROXY_URL" < /tmp/nginx.conf.template > /tmp/nginx.conf' >> /startup.sh && \
    echo 'cp /tmp/nginx.conf /etc/nginx/nginx.conf' >> /startup.sh && \
    echo 'echo "Starting nginx..."' >> /startup.sh && \
    echo 'exec nginx -g "daemon off;"' >> /startup.sh && \
    chmod +x /startup.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:9080/health || exit 1

EXPOSE 9080

# Run with random UID but gid=0 for OpenShift compatibility
USER 1001:0

CMD ["/startup.sh"]
