from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from pydantic import field_validator

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://greenloop_user:greenloop_password@localhost:5432/greenloop_db"
    TEST_DATABASE_URL: Optional[str] = None
    
    # Redis (opcional)
    REDIS_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "dev-jwt-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,webp"
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    @field_validator('ALLOWED_IMAGE_TYPES', mode='before')
    @classmethod
    def parse_image_types(cls, v):
        if isinstance(v, str):
            return [img_type.strip() for img_type in v.split(',')]
        return v
    
    # External APIs
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3009",
        "http://127.0.0.1:3009",
        "http://localhost:8000",
        "http://localhost:8080",
    ]
    
    @field_validator('BACKEND_CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Admin
    ADMIN_EMAILS: List[str] = [
        # Se deben sobreescribir vía entorno (.env)
        "jucampuca@gmail.com"
    ]
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Validaciones de configuración
if settings.ENVIRONMENT == "production":
    if settings.SECRET_KEY == "dev-secret-key-change-in-production":
        raise ValueError("SECRET_KEY must be changed in production")
    
    if settings.JWT_SECRET_KEY == "dev-jwt-secret-key":
        raise ValueError("JWT_SECRET_KEY must be changed in production")
    
    if settings.DEBUG:
        raise ValueError("DEBUG must be False in production")
    
    if "sqlite" in settings.DATABASE_URL.lower():
        raise ValueError("SQLite should not be used in production")