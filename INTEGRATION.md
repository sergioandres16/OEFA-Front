# Frontend Integration Guide

Este documento explica cómo integrar el frontend en el chart principal de microservicios.

## Archivos a copiar al chart principal

### 1. Templates
Copiar los siguientes archivos a `templates/` del chart principal:
- `helm/oefa-front/templates/deployment.yaml` → `templates/frontend-deployment.yaml`
- `helm/oefa-front/templates/service.yaml` → `templates/frontend-service.yaml`
- `helm/oefa-front/templates/route.yaml` → `templates/frontend-route.yaml`

### 2. Configuración en values.yaml
Agregar la siguiente sección al `values.yaml` principal bajo `services:`:

```yaml
services:
  # ... otros servicios (postgres, eureka, gateway, etc.)
  
  frontend:
    image: harbor.oefa.gob.pe/fmovil/hectorvc2022/fmovil-frontend:v1.0.0
    port: 8080
    replicas: 2
    expose: true
    tls: true
    logLevel: INFO
    resources:
      requests:
        memory: 128Mi
        cpu: 100m
      limits:
        memory: 512Mi
        cpu: 500m
    # Environment URLs
    apiBaseUrl: "https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe"
    frontendBaseUrl: "https://oefa-front.apps.okd-dev.oefa.gob.pe"
    # Health check configuration
    healthCheck:
      path: /health
      livenessProbe:
        initialDelaySeconds: 30
        periodSeconds: 10
        timeoutSeconds: 5
        failureThreshold: 3
      readinessProbe:
        initialDelaySeconds: 5
        periodSeconds: 5
        timeoutSeconds: 3
        failureThreshold: 3
    # Route configuration
    route:
      host: "oefa-front.apps.okd-dev.oefa.gob.pe"
      annotations:
        haproxy.router.openshift.io/timeout: "60s"
        haproxy.router.openshift.io/rate-limit-connections: "true"
        haproxy.router.openshift.io/rate-limit-connections.concurrent-tcp: "100"
        haproxy.router.openshift.io/rate-limit-connections.rate-http: "1000"
        haproxy.router.openshift.io/rate-limit-connections.rate-tcp: "1000"
```

## Estructura final del chart principal

```
fmovil-microservices/
├── Chart.yaml
├── values.yaml (con configuración frontend integrada)
├── templates/
│   ├── postgres-deployment.yaml
│   ├── eureka-deployment.yaml
│   ├── gateway-deployment.yaml
│   ├── auth-deployment.yaml
│   ├── certificate-deployment.yaml
│   ├── signature-deployment.yaml
│   ├── notification-deployment.yaml
│   ├── frontend-deployment.yaml    # ← Nuevo
│   ├── frontend-service.yaml       # ← Nuevo
│   └── frontend-route.yaml         # ← Nuevo
```

## Características del frontend integrado

### ✅ **Consistente con microservicios:**
- Mismo namespace: `{{ .Values.global.namespace }}`
- Mismas labels: `app: fmovil-microservices`
- Misma configuración de seguridad
- Mismo patrón de networking

### ✅ **URLs configurables:**
- Backend API URL conecta al gateway
- Frontend URL configurable por ambiente
- Variables de entorno inyectadas inline

### ✅ **Health checks integrados:**
- Liveness y readiness probes configurables
- Path `/health` customizable

### ✅ **Route de OpenShift:**
- Misma configuración TLS que otros servicios
- Annotations personalizables
- Host configurable por ambiente

## Deployment

```bash
# Desplegar todo el stack incluyendo frontend
helm install fmovil-stack . \
  --namespace fmovil-microservices \
  --values values-dev.yaml
```

El frontend se desplegará automáticamente junto con todos los microservicios del backend.