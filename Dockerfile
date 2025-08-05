# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production --output-path=/app/dist

# Stage 2: Nginx with OpenShift optimizations
FROM nginx:1.25-alpine

# Remove default configs
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built Angular app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Crear directorio de config temporal (con permisos para user 1001)
RUN mkdir -p /tmp/nginx /var/run/nginx && \
    chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx /tmp/nginx && \
    chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx /tmp/nginx && \
    chmod -R 775 /usr/share/nginx/html /tmp/nginx && \
    touch /var/run/nginx/nginx.pid && \
    chmod 664 /var/run/nginx/nginx.pid && \
    chmod g+rwx /var/run/nginx


# Health check
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:9080/health || exit 1

EXPOSE 9080

# Run as non-root user (OpenShift compatible)
USER 1001

# Generar config dinámico desde template y arrancar Nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_PROXY_URL}' < /etc/nginx/templates/default.conf.template > /tmp/nginx/default.conf && exec nginx -c /tmp/nginx/default.conf"]
