#!/bin/bash
# Docker build script for OEFA Front Angular application (Sin volúmenes)
# Usage: ./build-sin-volumenes.sh [TAG] [REGISTRY] [--debug]
set -e
# Default values
DEFAULT_TAG="v1.0.0"
DEFAULT_REGISTRY="harbor.oefa.gob.pe/fmovil/hub.docker.com/hectorvc2022"
IMAGE_NAME="fmovil-frontend"
# Parse arguments
TAG=${1:-$DEFAULT_TAG}
REGISTRY=${2:-$DEFAULT_REGISTRY}
DEBUG_MODE=${3:-""}
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"
echo "=============================================="
echo "Building Docker image for OEFA Front (Sin volúmenes)"
echo "=============================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Date: $(date)"
echo "Debug mode: ${DEBUG_MODE}"
echo "=============================================="
# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running or not accessible"
    exit 1
fi
# Verificar que existen los archivos necesarios
if [ ! -f "nginx-sin-volumenes.conf" ]; then
    echo "❌ Error: nginx-sin-volumenes.conf not found"
    exit 1
fi
if [ ! -f "Dockerfile-sin-volumenes" ]; then
    echo "❌ Error: Dockerfile-sin-volumenes not found"
    exit 1
fi
# Build the Docker image
echo "🔨 Building Docker image (sin volúmenes)..."
docker build -f "Dockerfile-sin-volumenes" -t "${FULL_IMAGE_NAME}" .
if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"
    # Show image size
    echo "📊 Image size:"
    docker images "${FULL_IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
    # Test container locally if debug mode
    if [[ "$DEBUG_MODE" == "--debug" ]]; then
        echo "🧪 Testing container locally..."
        docker run --rm -d --name test-frontend-no-volumes \
            -p 9080:9080 \
            -e BACKEND_PROXY_URL="http://localhost:8080" \
            "${FULL_IMAGE_NAME}"

        sleep 5

        echo "🔍 Health check:"
        if curl -f http://localhost:9080/health; then
            echo "✅ Container is healthy"
        else
            echo "❌ Container health check failed"
            echo "📋 Container logs:"
            docker logs test-frontend-no-volumes
        fi

        echo "🔍 Checking nginx configuration:"
        docker exec test-frontend-no-volumes cat /etc/nginx/conf.d/default.conf | head -10

        echo "🔍 Checking permissions:"
        docker exec test-frontend-no-volumes ls -la /etc/nginx/conf.d/

        docker stop test-frontend-no-volumes
    fi
    # Ask if user wants to push the image
    read -p "🚀 Do you want to push the image to registry? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📤 Pushing image to registry..."
        docker push "${FULL_IMAGE_NAME}"
        if [ $? -eq 0 ]; then
            echo "✅ Image pushed successfully to registry"
        else
            echo "❌ Failed to push image to registry"
            exit 1
        fi
    fi
    echo
    echo "=============================================="
    echo "Build completed successfully (sin volúmenes)!"
    echo "Image: ${FULL_IMAGE_NAME}"
    echo "=============================================="
    echo
    echo "📋 Next steps:"
    echo "1. Update your deployment to use: ${FULL_IMAGE_NAME}"
    echo "2. Apply the deployment: kubectl apply -f deployment-sin-volumenes.yaml"
    echo "3. Monitor the pods: kubectl get pods -n fmovil -l app=fmovil-frontend"
else
    echo "❌ Docker build failed"
    exit 1
fi
