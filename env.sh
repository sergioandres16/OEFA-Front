#!/bin/sh

# Replace environment variables in the main JavaScript file
# This script runs at container startup to inject environment variables

echo "Injecting environment variables..."

# Find the main JavaScript file
MAIN_JS_FILE=$(find /usr/share/nginx/html -name "main*.js" | head -1)

if [ -z "$MAIN_JS_FILE" ]; then
    echo "Warning: main*.js file not found"
    exit 0
fi

echo "Found main JS file: $MAIN_JS_FILE"

# Replace placeholders with environment variables
# Default values if environment variables are not set
API_BASE_URL=${API_BASE_URL:-"https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe"}
FRONTEND_BASE_URL=${FRONTEND_BASE_URL:-"https://oefa-front.apps.okd-dev.oefa.gob.pe"}

echo "API_BASE_URL: $API_BASE_URL"
echo "FRONTEND_BASE_URL: $FRONTEND_BASE_URL"

# Replace the placeholders in the JavaScript file
sed -i "s|__API_BASE_URL__|$API_BASE_URL|g" "$MAIN_JS_FILE"
sed -i "s|__FRONTEND_BASE_URL__|$FRONTEND_BASE_URL|g" "$MAIN_JS_FILE"

echo "Environment variables injected successfully"