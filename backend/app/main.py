from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from .core.config import settings
from .core.database import engine, create_tables, check_database_connection, Base
from . import models  # Importar modelos para registrar tablas antes de crear
from .api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Startup
    print("🚀 Iniciando GreenLoop API...")
    
    # Verificar conexión a la base de datos
    if await check_database_connection():
        print("✅ Conexión a la base de datos establecida")
        
        # Crear tablas
        await create_tables()
        print("✅ Tablas de la base de datos creadas/verificadas")
    else:
        print("❌ Error al conectar con la base de datos")
    
    yield
    
    # Shutdown
    print("🛑 Cerrando GreenLoop API...")

# Crear la aplicación FastAPI
app = FastAPI(
    title="GreenLoop API",
    description="API para la plataforma de intercambio sostenible GreenLoop",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS if settings.ENVIRONMENT == "production" else [
        "http://localhost:3000",  # Frontend Next.js
        "http://127.0.0.1:3000",
        "http://localhost:3009",  # Frontend Next.js en puerto fijo
        "http://127.0.0.1:3009",
        "http://localhost:8000",  # Docs
        "http://localhost:8080",  # Desarrollo adicional
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de uploads si no existe
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Servir archivos estáticos (imágenes subidas)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Incluir routers de la API
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Endpoint raíz de la API"""
    return {
        "message": "Bienvenido a GreenLoop API",
        "description": "Plataforma de intercambio sostenible",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "active",
        "environment": settings.ENVIRONMENT
    }

@app.get("/health")
async def health_check():
    """Endpoint para verificar el estado de la API"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
