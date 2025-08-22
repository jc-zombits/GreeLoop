# Trueque Verde 2.0 - GreenLoop

## 🌱 Descripción del Proyecto

Trueque Verde 2.0 es una plataforma global de intercambio sostenible que facilita el trueque de objetos, ropa, alimentos no perecederos y servicios ecológicos. Nuestro objetivo es promover la economía circular, reducir el consumo innecesario y fortalecer las comunidades autosuficientes.

### 🎯 Impacto Esperado
- **Reducción del consumo innecesario**: Fomenta la reutilización de objetos
- **Comunidades autosuficientes**: Fortalece los lazos locales
- **Reducción de desechos**: Evita toneladas de residuos y emisiones
- **Economía circular**: Promueve un modelo económico sostenible

## 🚀 Características Principales

### MVP (Versión 1.0)
- ✅ **Gestión de usuarios** con autenticación JWT
- ✅ **Publicación de objetos** con categorización
- ✅ **Sistema de búsqueda** con filtros geográficos
- ✅ **Intercambios** con chat integrado
- ✅ **Sistema de reputación** básico
- ✅ **Mapa interactivo** para visualización
- ✅ **Notificaciones** en tiempo real
- ✅ **Comunidad** con posts y discusiones
- ✅ **Configuración de puertos** estable para desarrollo

### Funcionalidades Futuras
- 🔄 **Recompensas verdes** por frecuencia de intercambio
- 🤝 **Integración con ONGs** para donaciones
- 🛠️ **Servicios ecológicos** (compostaje, reparaciones)
- 📱 **App móvil nativa**
- 🎯 **Recomendaciones personalizadas**

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI (Python)
- **Base de Datos**: PostgreSQL
- **ORM**: SQLAlchemy + Alembic
- **Cache**: Redis
- **Tareas Asíncronas**: Celery
- **Autenticación**: JWT + OAuth2

### Frontend
- **Framework**: React + Next.js
- **HTTP Client**: Axios
- **Estilos**: TailwindCSS + Ant Design
- **Estado**: Redux Toolkit
- **Mapas**: Leaflet/React-Leaflet

### DevOps
- **Contenedores**: Docker + Docker Compose
- **Base de Datos**: PostgreSQL 15
- **Cache**: Redis 7

## 📁 Estructura del Proyecto

```
greenloop/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   ├── core/           # Configuración y seguridad
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Esquemas Pydantic
│   │   ├── services/       # Lógica de negocio
│   │   └── utils/          # Utilidades
│   ├── alembic/            # Migraciones de BD
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # App Next.js
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas Next.js
│   │   ├── store/          # Redux store
│   │   ├── services/       # APIs y servicios
│   │   └── types/          # Tipos TypeScript
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentación técnica
│   ├── ARQUITECTURA_TECNICA.md
│   ├── MVP_TECNICO.md
│   ├── FLUJO_APLICACION.md
│   ├── DISEÑO_BASE_DATOS.md
│   └── ESPECIFICACIONES_TECNICAS.md
├── docker-compose.yml      # Orquestación de servicios
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/greenloop.git
cd greenloop
```

### 2. Configurar Variables de Entorno
```bash
# Backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus configuraciones

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Editar frontend/.env.local con tus configuraciones
```

### 3. Iniciar con Docker Compose
```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# O en modo detached
docker-compose up -d --build
```

### 4. Ejecutar Migraciones
```bash
# Ejecutar migraciones de base de datos
docker-compose exec backend alembic upgrade head

# Opcional: Cargar datos de prueba
docker-compose exec backend python scripts/seed_data.py
```

### 5. Acceder a la Aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentación API**: http://localhost:8000/docs

### 🌟 Nuevas Funcionalidades

#### Sección de Comunidad
- **Posts de comunidad**: Los usuarios pueden crear posts para compartir experiencias, consejos y discusiones sobre sostenibilidad
- **Interacción social**: Sistema de posts con autor, fecha y contenido
- **Navegación integrada**: Acceso directo desde el navbar principal
- **Membresía contextual**: Botones dinámicos según estado de autenticación:
  - Usuarios no logueados: "Crear cuenta gratis"
  - Usuarios logueados no miembros: "Unirme a la comunidad" (funcional)
  - Usuarios miembros: "Miembro activo" (estado confirmado)
- **Persistencia de membresía**: Estado de membresía almacenado en localStorage
- **API endpoints**: `/api/v1/community/posts` para gestión completa de posts

#### Mejoras Técnicas
- **Puertos estables**: Frontend siempre en puerto 3000, backend en puerto 8000
- **Proxy configurado**: Redirección automática de `/api/*` al backend
- **Experiencia de usuario mejorada**: URLs consistentes y predecibles

## 🧪 Desarrollo Local

### Backend (FastAPI)
```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

## 📊 Base de Datos

### Entidades Principales
- **Users**: Usuarios de la plataforma
- **Items**: Objetos para intercambio
- **Categories**: Categorías de objetos
- **Exchanges**: Intercambios entre usuarios
- **Messages**: Chat de intercambios
- **Ratings**: Sistema de calificaciones
- **Notifications**: Notificaciones del sistema
- **CommunityPosts**: Posts de la comunidad para discusiones

### Migraciones
```bash
# Crear nueva migración
docker-compose exec backend alembic revision --autogenerate -m "Descripción"

# Aplicar migraciones
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1
```

## 🧪 Testing

### Backend
```bash
# Ejecutar tests
docker-compose exec backend pytest

# Con coverage
docker-compose exec backend pytest --cov=app

# Tests específicos
docker-compose exec backend pytest tests/test_auth.py
```

### Frontend
```bash
# Ejecutar tests
docker-compose exec frontend npm test

# Tests en modo watch
docker-compose exec frontend npm run test:watch
```

## 📚 Documentación

- **[Arquitectura Técnica](docs/ARQUITECTURA_TECNICA.md)**: Diseño del sistema y patrones
- **[MVP Técnico](docs/MVP_TECNICO.md)**: Funcionalidades del producto mínimo viable
- **[Flujo de Aplicación](docs/FLUJO_APLICACION.md)**: User journeys y procesos
- **[Diseño de Base de Datos](docs/DISEÑO_BASE_DATOS.md)**: Esquemas y relaciones
- **[Especificaciones Técnicas](docs/ESPECIFICACIONES_TECNICAS.md)**: APIs y componentes

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código
- **Backend**: Seguir PEP 8 para Python
- **Frontend**: Usar ESLint y Prettier
- **Commits**: Usar Conventional Commits
- **Branches**: `feature/`, `bugfix/`, `hotfix/`

## 📝 Roadmap

### Fase 1: MVP (14 semanas)
- [x] Configuración inicial del proyecto
- [x] Backend core (autenticación, usuarios, objetos)
- [x] Frontend core (páginas principales, componentes)
- [x] Sistema de intercambios y chat
- [ ] Integración de mapas
- [ ] Testing y deploy

### Fase 2: Mejoras (8 semanas)
- [ ] Sistema de recompensas
- [ ] Integración con ONGs
- [ ] Servicios ecológicos
- [ ] App móvil
- [ ] Analytics avanzados

### Fase 3: Escalabilidad (6 semanas)
- [ ] Microservicios
- [ ] Kubernetes
- [ ] CI/CD avanzado
- [ ] Monitoreo y alertas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: Juan Camilo Cardona Pizarro
- **Arquitecto de Software**: Juan Camilo Cardona Pizarro
- **DevOps Engineer**: Juan Camilo Cardona Pizarro

## 📞 Contacto

- **Email**: jucampuca@gmail.com
- **LinkedIn**: [Tu LinkedIn]
- **GitHub**: https://github.com/jucampuca

---

**¡Juntos construyamos un futuro más sostenible! 🌍♻️**
