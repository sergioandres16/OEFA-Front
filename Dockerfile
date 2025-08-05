# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build -- --configuration=production --output-path=/app/dist

# Stage 2: Nginx optimized for OpenShift
FROM nginx:1.25-alpine

# Create directories and set ownership
RUN mkdir -p /var/run/nginx && \
    rm -rf /usr/share/nginx/html/* && \
    rm -f /etc/nginx/conf.d/default.conf

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy base nginx.conf (without env vars)
COPY nginx.conf /etc/nginx/nginx.conf

# OpenShift: ensure group 0 access
RUN chgrp -R 0 /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chmod -R g=u /usr/share/nginx/html /var/cache/nginx /var/log/nginx /var/run/nginx && \
    chmod 775 /usr/share/nginx/html && \
    touch /var/run/nginx/nginx.pid && \
    chmod 664 /var/run/nginx/nginx.pid && \
    chmod g+rwx /var/run/nginx

# Expose port
EXPOSE 9080

# Run as non-root user (OpenShift compatible)
USER 1001

# Default command
CMD ["nginx", "-g", "daemon off;"]
