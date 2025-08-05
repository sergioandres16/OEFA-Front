#!/bin/bash

# Iniciar sesión en Harbor
docker login harbor.oefa.gob.pe

# Definir nombres e imagenes
IMAGES=(
  auth-service
  certificate-service
  signature-service
)

ORIGIN_USER=hectorvc2022
TARGET_REGISTRY=harbor.oefa.gob.pe/fmovil
ORIGIN_TAG=1
TARGET_TAG=v1.0.0

# Procesar cada imagen
for IMAGE in "${IMAGES[@]}"; do
  echo "Procesando $IMAGE..."
  docker pull ${ORIGIN_USER}/${IMAGE}:${ORIGIN_TAG}
  docker tag ${ORIGIN_USER}/${IMAGE}:${ORIGIN_TAG} ${TARGET_REGISTRY}/hub.docker.com/${ORIGIN_USER}/${IMAGE}:${TARGET_TAG}
  docker push ${TARGET_REGISTRY}/hub.docker.com/${ORIGIN_USER}/${IMAGE}:${TARGET_TAG}
done

echo "Todas las imágenes han sido retageadas y subidas correctamente."
