# MVP Técnico - Trueque Verde 2.0

## Objetivo del MVP

Desarrollar una versión mínima viable de la plataforma de trueque sostenible que permita a los usuarios intercambiar objetos básicos con un sistema de reputación simple y funcionalidades geográficas básicas.

## Funcionalidades Core del MVP

### 1. Gestión de Usuarios

#### Registro y Autenticación
- [x] Registro con email y contraseña
- [x] Login con JWT
- [x] Verificación de email
- [x] Recuperación de contraseña
- [ ] Perfil básico de usuario
- [ ] Configuración de ubicación

#### Perfil de Usuario
- [ ] Información básica (nombre, foto, descripción)
- [ ] Ubicación (ciudad/región)
- [ ] Puntuación de reputación
- [ ] Historial de intercambios

### 2. Gestión de Objetos

#### Publicación de Objetos
- [ ] Crear publicación de objeto
- [ ] Subir hasta 5 fotos
- [ ] Categorización básica:
  - Ropa y accesorios
  - Hogar y decoración
  - Libros y medios
  - Deportes y ocio
  - Electrónicos
  - Otros
- [ ] Descripción del objeto
- [ ] Estado del objeto (nuevo, como nuevo, usado, necesita reparación)
- [ ] Disponibilidad (disponible, en negociación, intercambiado)

#### Búsqueda y Filtrado
- [ ] Búsqueda por texto
- [ ] Filtros por categoría
- [ ] Filtros por ubicación (radio de distancia)
- [ ] Filtros por estado del objeto
- [ ] Ordenamiento por fecha, distancia, popularidad

### 3. Sistema de Intercambios

#### Proceso de Intercambio
- [ ] Solicitar intercambio
- [ ] Proponer objeto a cambio
- [ ] Chat básico entre usuarios
- [ ] Aceptar/rechazar propuesta
- [ ] Confirmar intercambio completado
- [ ] Sistema de calificación post-intercambio

#### Estados del Intercambio
- Pendiente
- Aceptado
- En progreso
- Completado
- Cancelado

### 4. Sistema de Reputación Básico

#### Puntuación
- [ ] Calificación de 1-5 estrellas
- [ ] Comentarios opcionales
- [ ] Promedio de calificaciones
- [ ] Número total de intercambios

#### Badges Básicos
- [ ] Nuevo usuario
- [ ] Intercambiador activo (5+ intercambios)
- [ ] Intercambiador confiable (4.5+ estrellas)
- [ ] Eco-warrior (20+ intercambios)

### 5. Funcionalidades Geográficas

#### Mapa Básico
- [ ] Visualización de objetos en mapa
- [ ] Filtro por radio de distancia
- [ ] Geolocalización del usuario
- [ ] Marcadores por categoría

### 6. Notificaciones Básicas

#### Tipos de Notificación
- [ ] Nueva solicitud de intercambio
- [ ] Respuesta a solicitud
- [ ] Mensaje en chat
- [ ] Intercambio completado
- [ ] Recordatorio de calificación

## Funcionalidades Excluidas del MVP

### Para Versiones Futuras
- Sistema de recompensas verdes
- Integración con ONGs
- Servicios ecológicos (compostaje, reparaciones)
- Alimentos no perecederos
- Sistema de puntos/moneda virtual
- Notificaciones push móviles
- App móvil nativa
- Sistema de reportes avanzado
- Analytics avanzados
- Integración con redes sociales
- Sistema de favoritos/wishlist
- Recomendaciones personalizadas

## Especificaciones Técnicas del MVP

### Backend APIs Requeridas

#### Autenticación
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### Usuarios
```
GET /api/users/profile
PUT /api/users/profile
GET /api/users/{user_id}
PUT /api/users/location
```

#### Objetos
```
GET /api/items
POST /api/items
GET /api/items/{item_id}
PUT /api/items/{item_id}
DELETE /api/items/{item_id}
POST /api/items/{item_id}/images
```

#### Intercambios
```
GET /api/exchanges
POST /api/exchanges
GET /api/exchanges/{exchange_id}
PUT /api/exchanges/{exchange_id}/status
POST /api/exchanges/{exchange_id}/rating
```

#### Chat
```
GET /api/exchanges/{exchange_id}/messages
POST /api/exchanges/{exchange_id}/messages
```

### Frontend Páginas Requeridas

#### Públicas
- [ ] Landing page
- [ ] Login/Registro
- [ ] Recuperar contraseña

#### Privadas
- [ ] Dashboard/Home
- [ ] Explorar objetos
- [ ] Detalle de objeto
- [ ] Mis objetos
- [ ] Crear/editar objeto
- [ ] Mis intercambios
- [ ] Chat de intercambio
- [ ] Perfil de usuario
- [ ] Configuración

### Base de Datos MVP

#### Tablas Principales
- users
- items
- exchanges
- messages
- ratings
- categories
- item_images

## Criterios de Aceptación del MVP

### Funcionales
1. Un usuario puede registrarse y hacer login
2. Un usuario puede publicar un objeto con fotos
3. Un usuario puede buscar objetos por categoría y ubicación
4. Un usuario puede solicitar un intercambio
5. Los usuarios pueden chatear durante un intercambio
6. Los usuarios pueden completar un intercambio y calificarse
7. Los objetos se muestran en un mapa básico

### No Funcionales
1. Tiempo de respuesta < 2 segundos para búsquedas
2. Soporte para 100 usuarios concurrentes
3. Disponibilidad del 99% durante horarios de prueba
4. Interfaz responsive para móvil y desktop
5. Cumplimiento básico de GDPR para datos de usuario

## Timeline Estimado

### Fase 1: Backend Core (4 semanas)
- Configuración del proyecto
- Autenticación y usuarios
- CRUD de objetos
- APIs básicas

### Fase 2: Frontend Core (4 semanas)
- Configuración de Next.js
- Páginas de autenticación
- Dashboard y exploración
- Gestión de objetos

### Fase 3: Intercambios y Chat (3 semanas)
- Sistema de intercambios
- Chat básico
- Notificaciones

### Fase 4: Mapa y Reputación (2 semanas)
- Integración de mapas
- Sistema de calificaciones
- Funcionalidades geográficas

### Fase 5: Testing y Deploy (1 semana)
- Testing integral
- Deploy en staging
- Ajustes finales

**Total: 14 semanas**

## Métricas de Éxito del MVP

### Técnicas
- 0 errores críticos en producción
- Tiempo de carga < 3 segundos
- 99% uptime

### Producto
- 50+ usuarios registrados en primer mes
- 20+ objetos publicados
- 5+ intercambios completados
- Calificación promedio > 4.0 estrellas

### Negocio
- Feedback positivo de usuarios beta
- Identificación de próximas funcionalidades prioritarias
- Validación del modelo de intercambio sostenible