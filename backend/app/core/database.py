from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
from sqlalchemy import text
import os
import asyncio

from .config import settings

# Crear el engine async de SQLAlchemy
if "sqlite" in settings.DATABASE_URL:
    # Para SQLite (desarrollo)
    engine = create_async_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=settings.DEBUG
    )
else:
    # Para PostgreSQL (producción)
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=settings.DEBUG
    )

# Crear AsyncSessionLocal class
AsyncSessionLocal = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Crear Base class
Base = declarative_base()

# Dependency para obtener la sesión async de base de datos
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Función async para crear todas las tablas
async def create_tables():
    """Crear todas las tablas en la base de datos"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Función async para eliminar todas las tablas (útil para testing)
async def drop_tables():
    """Eliminar todas las tablas de la base de datos"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# Función async para verificar la conexión a la base de datos
async def check_database_connection():
    """Verificar si la conexión a la base de datos está funcionando"""
    try:
        # Intentar hacer una consulta simple
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Error de conexión a la base de datos: {e}")
        return False