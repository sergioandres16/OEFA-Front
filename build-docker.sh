#!/bin/bash

# Docker build script for OEFA Front Angular application
# Usage: ./build-docker.sh [TAG] [REGISTRY]

set -e

# Default values
DEFAULT_TAG="v1.0.0"
DEFAULT_REGISTRY="harbor.oefa.gob.pe/fmovil/hub.docker.com/hectorvc2022"
IMAGE_NAME="fmovil-frontend"

# Parse arguments
TAG=${1:-$DEFAULT_TAG}
REGISTRY=${2:-$DEFAULT_REGISTRY}
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "=============================================="
echo "Building Docker image for OEFA Front"
echo "=============================================="
echo "Image: ${FULL_IMAGE_NAME}"
echo "Date: $(date)"
echo "=============================================="

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running or not accessible"
    exit 1
fi

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t "${FULL_IMAGE_NAME}" .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"

    # Show image size
    echo "📊 Image size:"
    docker images "${FULL_IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

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
    echo "Build completed successfully!"
    echo "Image: ${FULL_IMAGE_NAME}"
    echo "=============================================="

else
    echo "❌ Docker build failed"
    exit 1
fi
