# Mapa de Flujo de la Aplicación - Trueque Verde 2.0

## Flujos Principales de Usuario

### 1. Flujo de Registro y Onboarding

```mermaid
flowchart TD
    A[Landing Page] --> B{¿Usuario registrado?}
    B -->|No| C[Página de Registro]
    B -->|Sí| D[Login]
    C --> E[Formulario de Registro]
    E --> F[Verificación de Email]
    F --> G[Configuración de Perfil]
    G --> H[Configuración de Ubicación]
    H --> I[Tutorial de Bienvenida]
    I --> J[Dashboard Principal]
    D --> K[Formulario de Login]
    K --> L{¿Credenciales válidas?}
    L -->|Sí| J
    L -->|No| M[Error de Login]
    M --> K
```

### 2. Flujo de Publicación de Objetos

```mermaid
flowchart TD
    A[Dashboard] --> B["Botón 'Publicar Objeto'"]
    B --> C[Formulario de Objeto]
    C --> D[Seleccionar Categoría]
    D --> E[Agregar Título y Descripción]
    E --> F[Subir Fotos]
    F --> G[Seleccionar Estado]
    G --> H[Configurar Ubicación]
    H --> I[Vista Previa]
    I --> J{¿Confirmar publicación?}
    J -->|Sí| K[Guardar Objeto]
    J -->|No| C
    K --> L[Objeto Publicado]
    L --> M[Notificación de Éxito]
    M --> N[Ver Objeto en Lista]
```

### 3. Flujo de Búsqueda y Exploración

```mermaid
flowchart TD
    A[Dashboard] --> B[Explorar Objetos]
    B --> C[Vista de Lista/Mapa]
    C --> D[Aplicar Filtros]
    D --> E{¿Tipo de vista?}
    E -->|Lista| F[Lista de Objetos]
    E -->|Mapa| G[Mapa con Marcadores]
    F --> H[Seleccionar Objeto]
    G --> H
    H --> I[Detalle del Objeto]
    I --> J{¿Interesado?}
    J -->|Sí| K["Botón 'Solicitar Intercambio'"]
    J -->|No| L[Volver a Búsqueda]
    K --> M[Seleccionar Objeto Propio]
    M --> N[Enviar Solicitud]
    N --> O[Notificación Enviada]
    L --> C
```

### 3.1. Flujo de Exploración de Eventos ✅ **IMPLEMENTADO**

```mermaid
flowchart TD
    A[Dashboard] --> B[Explorar Eventos]
    B --> C[Lista de Eventos]
    C --> D[Aplicar Filtros]
    D --> E[Filtrar por Categoría]
    E --> F[Filtrar por Tipo]
    F --> G[Buscar por Texto]
    G --> H[Ver Eventos Filtrados]
    H --> I[Seleccionar Evento]
    I --> J[Ver Detalle del Evento]
    J --> K{¿Interesado?}
    K -->|Sí| L[Registrarse al Evento]
    K -->|No| M[Volver a Lista]
    L --> N[Confirmación de Registro]
    M --> C
```

### 3.2. Flujo de Creación de Eventos ✅ **IMPLEMENTADO**

```mermaid
flowchart TD
    A[Dashboard] --> B["Botón 'Crear Evento'"]
    B --> C[Formulario de Evento]
    C --> D[Información Básica]
    D --> E[Título y Descripción]
    E --> F[Fecha y Hora]
    F --> G[Ubicación]
    G --> H[Categoría]
    H --> I[Capacidad y Precio]
    I --> J[Tipo de Evento]
    J --> K[Vista Previa]
    K --> L{¿Confirmar creación?}
    L -->|Sí| M[Guardar Evento]
    L -->|No| C
    M --> N[Evento Creado]
    N --> O[Notificación de Éxito]
    O --> P[Ver en Lista de Eventos]
```

### 4. Flujo de Intercambio Completo

```mermaid
flowchart TD
    A[Solicitud de Intercambio] --> B[Notificación al Propietario]
    B --> C[Revisar Solicitud]
    C --> D{¿Aceptar intercambio?}
    D -->|No| E[Rechazar Solicitud]
    D -->|Sí| F[Aceptar Solicitud]
    E --> G[Notificar Rechazo]
    F --> H[Abrir Chat]
    H --> I[Coordinar Encuentro]
    I --> J[Intercambio Físico]
    J --> K[Confirmar Intercambio]
    K --> L[Ambos Confirman]
    L --> M[Calificar Usuario]
    M --> N[Intercambio Completado]
    N --> O[Actualizar Reputación]
    G --> P[Fin del Proceso]
    O --> P
```

### 5. Flujo de Chat y Comunicación

```mermaid
flowchart TD
    A[Intercambio Aceptado] --> B[Abrir Chat]
    B --> C[Interfaz de Chat]
    C --> D[Escribir Mensaje]
    D --> E[Enviar Mensaje]
    E --> F[Notificación al Receptor]
    F --> G[Receptor Lee Mensaje]
    G --> H{¿Responder?}
    H -->|Sí| I[Escribir Respuesta]
    H -->|No| J[Marcar como Leído]
    I --> E
    J --> K{¿Intercambio listo?}
    K -->|Sí| L[Confirmar Intercambio]
    K -->|No| C
    L --> M[Proceso de Calificación]
```

## Flujos Secundarios

### 6. Flujo de Gestión de Perfil

```mermaid
flowchart TD
    A[Dashboard] --> B[Ir a Perfil]
    B --> C[Ver Información Personal]
    C --> D{¿Editar perfil?}
    D -->|Sí| E[Formulario de Edición]
    D -->|No| F[Ver Historial]
    E --> G[Actualizar Datos]
    G --> H[Guardar Cambios]
    H --> I[Confirmación]
    F --> J[Ver Intercambios Pasados]
    J --> K[Ver Calificaciones]
    I --> C
    K --> C
```

### 7. Flujo de Notificaciones

```mermaid
flowchart TD
    A[Evento del Sistema] --> B{¿Tipo de evento?}
    B -->|Nueva Solicitud| C[Notificación de Solicitud]
    B -->|Mensaje| D[Notificación de Mensaje]
    B -->|Intercambio| E[Notificación de Estado]
    C --> F[Mostrar en Dashboard]
    D --> F
    E --> F
    F --> G[Usuario Ve Notificación]
    G --> H{¿Hacer clic?}
    H -->|Sí| I[Ir a Sección Relevante]
    H -->|No| J[Marcar como Vista]
    I --> K[Realizar Acción]
    J --> L[Mantener en Lista]
```

## Estados de los Objetos

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Disponible : Publicar
    Disponible --> EnNegociacion : Solicitud Recibida
    EnNegociacion --> Disponible : Rechazar/Cancelar
    EnNegociacion --> Intercambiado : Completar Intercambio
    Intercambiado --> [*]
    Disponible --> Pausado : Pausar Publicación
    Pausado --> Disponible : Reactivar
    Pausado --> [*] : Eliminar
    Disponible --> [*] : Eliminar
```

## Estados de los Intercambios

```mermaid
stateDiagram-v2
    [*] --> Solicitado
    Solicitado --> Aceptado : Aceptar
    Solicitado --> Rechazado : Rechazar
    Aceptado --> EnProgreso : Iniciar Chat
    EnProgreso --> Completado : Ambos Confirman
    EnProgreso --> Cancelado : Cancelar
    Completado --> Calificado : Calificar
    Calificado --> [*]
    Rechazado --> [*]
    Cancelado --> [*]
```

## Flujos de Error y Recuperación

### 8. Flujo de Manejo de Errores

```mermaid
flowchart TD
    A[Acción del Usuario] --> B{¿Error ocurrido?}
    B -->|No| C[Acción Exitosa]
    B -->|Sí| D{¿Tipo de error?}
    D -->|Validación| E[Mostrar Error de Validación]
    D -->|Red| F[Mostrar Error de Conexión]
    D -->|Servidor| G[Mostrar Error del Servidor]
    D -->|Autorización| H[Redirigir a Login]
    E --> I[Permitir Corrección]
    F --> J[Botón Reintentar]
    G --> K[Contactar Soporte]
    H --> L[Proceso de Login]
    I --> A
    J --> A
    C --> M[Continuar Flujo]
```

## Navegación Principal

### Estructura de Navegación

```
├── Dashboard (Home)
│   ├── Resumen de actividad
│   ├── Objetos destacados
│   └── Notificaciones recientes
│
├── Explorar
│   ├── Lista de objetos
│   ├── Vista de mapa
│   ├── Filtros y búsqueda
│   └── Eventos ✅ **IMPLEMENTADO**
│       ├── Lista de eventos
│       ├── Filtros por categoría y tipo
│       ├── Búsqueda de eventos
│       └── Crear nuevo evento ✅ **IMPLEMENTADO**
│
├── Mis Objetos
│   ├── Objetos publicados
│   ├── Crear nuevo objeto
│   └── Gestionar publicaciones
│
├── Mis Intercambios
│   ├── Intercambios activos
│   ├── Historial
│   └── Chats
│
├── Perfil
│   ├── Información personal
│   ├── Reputación
│   ├── Configuración
│   └── Historial de actividad
│
└── Notificaciones
    ├── Nuevas solicitudes
    ├── Mensajes
    └── Actualizaciones del sistema
```

## Responsive Design - Flujos Móviles

### Adaptaciones para Móvil

1. **Navegación**: Menú hamburguesa con navegación por pestañas
2. **Búsqueda**: Filtros colapsables y búsqueda por voz
3. **Mapa**: Vista de mapa optimizada para touch
4. **Chat**: Interfaz de chat nativa móvil
5. **Fotos**: Cámara integrada para captura directa
6. **Ubicación**: GPS automático para localización

## Métricas y Analytics por Flujo

### Puntos de Medición

1. **Registro**: Tasa de conversión de landing a registro completo
2. **Publicación**: Tiempo promedio para publicar primer objeto
3. **Búsqueda**: Patrones de búsqueda y filtros más usados
4. **Intercambio**: Tasa de conversión de solicitud a intercambio completado
5. **Retención**: Frecuencia de uso y tiempo en la aplicación

### KPIs por Flujo

- **Onboarding**: % usuarios que completan configuración inicial
- **Publicación**: Promedio de objetos por usuario activo
- **Intercambio**: Tiempo promedio desde solicitud hasta completado
- **Satisfacción**: Calificación promedio de intercambios
- **Engagement**: Sesiones por usuario por semana