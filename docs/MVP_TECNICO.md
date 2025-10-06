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

### 5. Gestión de Eventos ✅ **IMPLEMENTADO**

#### Creación de Eventos
- [x] Formulario completo de creación de eventos
- [x] Información básica (título, descripción, organizador)
- [x] Categorización de eventos:
  - Conferencia
  - Congreso
  - Seminario
  - Reunión
  - Ponencia
  - Concurso
  - Exposición
  - Encuentro
- [x] Gestión de fecha y hora
- [x] Modalidad (presencial/virtual)
- [x] Gestión de ubicación/enlace virtual
- [x] Configuración de capacidad máxima
- [x] Sistema de precios (gratuito/de pago)
- [x] Selector de moneda (COP/USD)
- [x] Sistema de etiquetas (tags)
- [x] Validaciones de formulario
- [x] Estados de carga y feedback

#### Visualización y Gestión de Eventos
- [x] Página de listado de eventos
- [x] Sistema de búsqueda por texto
- [x] Filtros por categoría de evento
- [x] Filtros por modalidad (presencial/virtual)
- [x] Filtros por precio (gratuito/de pago)
- [x] Ordenamiento por fecha y relevancia
- [x] Cards responsivas con información completa
- [x] Indicadores visuales por tipo de evento
- [x] Estados vacíos informativos
- [x] Navegación fluida entre páginas
- [x] Persistencia en localStorage
- [x] Actualización en tiempo real

#### Componentes UI Desarrollados
- [x] Componente Textarea reutilizable
- [x] Mejoras en contraste y accesibilidad
- [x] Diseño responsive optimizado
- [x] Validación de campos numéricos
- [x] Manejo de estados de error

### 6. Funcionalidades Geográficas

#### Mapa Básico
- [ ] Visualización de objetos en mapa
- [ ] Filtro por radio de distancia
- [ ] Geolocalización del usuario
- [ ] Marcadores por categoría

### 7. Notificaciones Básicas

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

#### Eventos
```
GET /api/events
POST /api/events
GET /api/events/{event_id}
PUT /api/events/{event_id}
DELETE /api/events/{event_id}
GET /api/events/categories
POST /api/events/{event_id}/register
DELETE /api/events/{event_id}/register
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
- [x] Explorar eventos ✅ **IMPLEMENTADO**
- [x] Crear evento ✅ **IMPLEMENTADO**
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
- events ✅ **IMPLEMENTADO (localStorage)**
- exchanges
- messages
- ratings
- categories
- item_images

## Criterios de Aceptación del MVP

### Funcionales
1. Un usuario puede registrarse y hacer login
2. Un usuario puede publicar un objeto con fotos
3. ✅ **Un usuario puede crear eventos con información completa** ✅ **IMPLEMENTADO**
4. ✅ **Un usuario puede explorar y filtrar eventos** ✅ **IMPLEMENTADO**
5. Un usuario puede buscar objetos por categoría y ubicación
6. Un usuario puede solicitar un intercambio
7. Los usuarios pueden chatear durante un intercambio
8. Los usuarios pueden completar un intercambio y calificarse
9. Los objetos se muestran en un mapa básico

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