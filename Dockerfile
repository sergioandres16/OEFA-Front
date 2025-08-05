# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production --output-path=/app/dist --base-href=/fmovil/frontend/
# Stage 2: Nginx with OpenShift optimizations
FROM nginx:1.25-alpine
# Remove default configs
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
# Copy built Angular app
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy simplified nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY server.conf.template /etc/nginx/templates/default.conf.template
# Configure OpenShift-compatible permissions
RUN mkdir -p /var/run/nginx /etc/nginx/conf.d && \
    chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx /etc/nginx/conf.d /etc/nginx/templates && \
    chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx /etc/nginx/conf.d /etc/nginx/templates && \
    chmod -R 775 /usr/share/nginx/html /etc/nginx/conf.d /etc/nginx/templates && \
    touch /var/run/nginx/nginx.pid && \
    chmod 664 /var/run/nginx/nginx.pid && \
    chmod g+rwx /var/run/nginx
# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:9080/health || exit 1
EXPOSE 9080
# Run as non-root user (OpenShift compatible)
USER 1001
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_PROXY_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
