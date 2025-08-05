# OEFA Front - Sistema de Firma Digital

## Descripción General

OEFA Front es una plataforma web desarrollada en Angular 20 para la gestión de certificados digitales y firmas electrónicas del Organismo de Evaluación y Fiscalización Ambiental (OEFA). La plataforma permite a los administradores gestionar firmantes y certificados, mientras que los firmantes pueden activar sus cuentas y realizar operaciones de firma digital.

## Arquitectura del Sistema

### Tecnologías Utilizadas
- **Frontend**: Angular 20 con componentes standalone
- **Lenguaje**: TypeScript 5.8.2
- **Estilos**: CSS personalizado
- **HTTP Client**: Angular HttpClient para comunicación con APIs
- **Autenticación**: JWT (JSON Web Tokens)
- **Testing**: Jasmine y Karma

### Estructura del Proyecto
```
src/
├── app/
│   ├── core/                    # Servicios centrales y modelos
│   │   ├── guards/             # Guards de autenticación
│   │   ├── interceptors/       # Interceptores HTTP
│   │   ├── models/             # Modelos de datos
│   │   └── services/           # Servicios de negocio
│   ├── features/               # Componentes por funcionalidad
│   │   ├── auth/              # Autenticación
│   │   ├── certificates/      # Gestión de certificados
│   │   ├── dashboard/         # Panel de control
│   │   ├── signed-documents/  # Documentos firmados
│   │   └── users/             # Gestión de usuarios
│   └── shared/                # Componentes compartidos
       ├── components/         # Componentes reutilizables
       └── services/           # Servicios compartidos
```

## Funcionalidades del Sistema

### Para Administradores

#### 1. **Dashboard Administrativo** (`/dashboard`)
- **Estadísticas en tiempo real**:
  - Total de firmantes (activos/pendientes)
  - Estado de certificados (válidos/inválidos)
  - Documentos procesados (firmados/visados/completados)
- **Métricas de rendimiento**:
  - Tasa de éxito de documentos
  - Salud de certificados
  - Tasa de usuarios activos

#### 2. **Gestión de Firmantes** (`/users`)
- **Crear firmantes**:
  - Formulario con validación para nombre, apellido, email, DNI y cargo
  - Envío automático de credenciales por email
  - Validación de DNI (8 dígitos numéricos)
- **Listar y filtrar firmantes**:
  - Búsqueda global por nombre, apellido, email, DNI o cargo
  - Filtrado por estado (Activo/Pendiente)
  - Filtrado por rango de fechas
  - Ordenamiento por múltiples columnas
- **Gestión individual**:
  - Ver detalles completos del firmante
  - Editar email, DNI y cargo
  - Reenviar credenciales de acceso
  - Eliminar firmante del sistema
- **Paginación**: Control completo con opciones de elementos por página

#### 3. **Gestión de Certificados** (`/certificates`)
- **Subir certificados**:
  - Carga de archivos .p12 con contraseña
  - Asociación automática con firmantes
  - Validación y procesamiento automático
- **Listar certificados**:
  - Búsqueda por nombre de archivo, firmante, subject, issuer, número de serie
  - Filtrado por estado de validez
  - Filtrado por período de vigencia
  - Información detallada de cada certificado
- **Gestión de certificados**:
  - Ver detalles completos (subject, issuer, vigencia, etc.)
  - Eliminar certificados
  - Selección múltiple para operaciones en lote
  - Indicadores de vencimiento próximo

#### 4. **Documentos Firmados** (`/signed-documents`)
- **Visualización de documentos**:
  - Lista completa de documentos firmados y visados
  - Información del firmante asociado
  - Detalles de la firma (fecha, motivo, cargo)
  - Estado del documento (Firmado/Visado/Completado)
- **Filtros y búsqueda**:
  - Búsqueda por nombre de archivo, DNI, motivo, cargo o firmante
  - Filtrado por rango de fechas
  - Ordenamiento por múltiples campos
- **Gestión**:
  - Ver detalles completos del documento
  - Información de trazabilidad

### Para Firmantes

#### 1. **Activación de Cuenta** (`/firmante/verify/:token`)
- **Proceso de activación**:
  - Acceso mediante token único recibido por email
  - Configuración de PIN de 6 dígitos numéricos
  - Validación en tiempo real del formato
  - Confirmación de activación exitosa
- **Seguridad**:
  - Token de un solo uso
  - Validación de formato de PIN
  - Feedback inmediato de errores

#### 2. **Acceso al Sistema**
- Una vez activados, los firmantes pueden acceder al dashboard general
- Visualización de estadísticas relevantes a su perfil

## APIs y Servicios Backend

### Gateway Principal
- **Base URL**: `https://gateway-route-fmovil.apps.okd-dev.oefa.gob.pe`

### Servicios de Autenticación (`/auth/api/v1`)
- `POST /admin/login` - Login de administradores
- `POST /firmante/login` - Login de firmantes (DNI + PIN)
- `POST /firmante/activate` - Activación de firmantes
- `POST /refresh` - Renovación de tokens
- `POST /logout` - Cierre de sesión
- `GET /profile` - Perfil del usuario actual
- `POST /admin/create-firmante` - Crear nuevo firmante
- `POST /admin/resend-credentials` - Reenviar credenciales
- `GET /admin/users` - Listar usuarios
- `GET /admin/gestion/firmantes-stats` - Estadísticas de firmantes

### Servicios de Certificados (`/certificates/api/v1`)
- `GET /list` - Listar todos los certificados
- `GET /{id}` - Obtener certificado por ID
- `GET /user/{userId}` - Certificados de un usuario
- `POST /upload` - Subir nuevo certificado
- `DELETE /{id}` - Eliminar certificado
- `GET /stats` - Estadísticas de certificados
- `GET /expiring-soon` - Certificados próximos a vencer

### Servicios de Documentos Firmados (`/signatures/api/v1`)
- `GET /admin/signed` - Documentos firmados
- `GET /admin/visado` - Documentos visados
- `GET /user/{userId}` - Documentos de un usuario
- `GET /dni/{dni}` - Documentos por DNI
- `GET /{documentId}` - Detalle de documento
- `GET /admin/stats` - Estadísticas de documentos

## Autenticación y Seguridad

### Sistema de Autenticación
- **JWT Tokens**: Access tokens y refresh tokens
- **Roles de usuario**:
  - `ROLE_ADMIN`: Acceso completo al sistema
  - `ROLE_FIRMANTE`: Acceso limitado para firmantes
- **Guards de protección**:
  - `AuthGuard`: Protege rutas que requieren autenticación
  - `AdminGuard`: Protege rutas exclusivas de administradores
  - `NoAuthGuard`: Previene acceso a login si ya está autenticado

### Interceptores HTTP
- **AuthInterceptor**: Añade automáticamente el token JWT a las peticiones
- **ErrorInterceptor**: Manejo centralizado de errores HTTP

### Estados de Usuario
- **ACTIVO**: Usuario operativo
- **PENDIENTE**: Requiere activación
- **INACTIVO**: Temporalmente deshabilitado
- **ELIMINADO**: Usuario eliminado del sistema

## Características Técnicas

### Componentes Standalone
- Todos los componentes utilizan la nueva arquitectura standalone de Angular
- Importación explícita de dependencias
- Mejor tree-shaking y optimización

### Gestión de Estado
- Uso de BehaviorSubjects para estado reactivo
- Servicios con observables para comunicación entre componentes
- LocalStorage para persistencia de sesión

### UI/UX
- Diseño responsivo adaptado a diferentes dispositivos
- Notificaciones en tiempo real para feedback del usuario
- Modales para operaciones CRUD
- Tablas con paginación, filtrado y ordenamiento
- Indicadores de carga y estado

### Validación de Formularios
- Validación reactiva con Angular Forms
- Mensajes de error personalizados en español
- Validación en tiempo real
- Feedback visual de estados de campo

## Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18+)
- Angular CLI 20+
- NPM o Yarn

### Instalación
```bash
# Clonar el repositorio
git clone [repository-url]

# Navegar al directorio
cd OEFAFront

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
```

### Scripts Disponibles
- `npm start` - Servidor de desarrollo (puerto 4200)
- `npm run build` - Build de producción
- `npm run watch` - Build con watch mode
- `npm test` - Ejecutar tests unitarios

### Configuración de Ambiente
Las URLs de los servicios backend están configuradas directamente en los servicios. Para diferentes ambientes, actualizar las constantes `API_URL` in:
- `auth.service.ts`
- `certificate.service.ts`
- `user.service.ts`
- `signed-documents.service.ts`
- `dashboard.component.ts`

## Flujo de Trabajo

### Para Administradores
1. **Login** → Acceso con email y contraseña
2. **Dashboard** → Visualización de métricas generales
3. **Gestión de Firmantes** → Crear, editar, eliminar firmantes
4. **Gestión de Certificados** → Subir, validar, gestionar certificados
5. **Monitoreo** → Revisar documentos firmados y estadísticas

### Para Firmantes
1. **Recepción de Email** → Invitación con token de activación
2. **Activación** → Configuración de PIN de acceso
3. **Acceso al Sistema** → Login con DNI y PIN
4. **Operaciones de Firma** → Utilización del sistema para firmar documentos

## Mantenimiento y Monitoreo

### Logs y Debugging
- Console logging para desarrollo
- Manejo de errores HTTP con feedback al usuario
- Estados de carga para mejor UX

### Performance
- Lazy loading de componentes
- Paginación para listas grandes
- Optimización de imágenes y recursos
- Componentes standalone para mejor tree-shaking

### Consideraciones de Producción
- Configurar variables de entorno para URLs de API
- Implementar SSL/HTTPS en todas las comunicaciones
- Configurar políticas CORS apropiadas
- Implementar logging centralizado
- Configurar monitoring de aplicación

## Soporte y Contacto

Para soporte técnico o consultas sobre el sistema, contactar al equipo de desarrollo de OEFA.

---

**Versión**: 0.0.0  
**Última actualización**: 2025  
**Desarrollado para**: Organismo de Evaluación y Fiscalización Ambiental (OEFA)