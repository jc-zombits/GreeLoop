from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime, timedelta, timezone

from app.core.database import Base

class CompanySession(Base):
    __tablename__ = "company_sessions"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    
    # Tokens
    access_token = Column(String(500), nullable=False, unique=True, index=True)
    refresh_token = Column(String(500), nullable=False, unique=True, index=True)
    
    # Información del dispositivo/navegador
    device_info = Column(Text, nullable=True)  # JSON string con info del dispositivo
    user_agent = Column(String(500), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 puede ser hasta 45 caracteres
    
    # Información de ubicación (opcional)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Estado de la sesión
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    company = relationship("Company", back_populates="sessions")
    
    @property
    def is_expired(self):
        """Verificar si la sesión ha expirado"""
        return datetime.now(timezone.utc) > self.expires_at
    
    @property
    def time_until_expiry_hours(self):
        """Calcular tiempo hasta expiración en horas"""
        if self.is_expired:
            return 0
        
        delta = self.expires_at - datetime.now(timezone.utc)
        return round(delta.total_seconds() / 3600, 1)  # Convertir a horas con 1 decimal
    
    @property
    def device_name(self):
        """Obtener nombre del dispositivo desde user_agent"""
        if not self.user_agent:
            return None
            
        # Lógica simple para extraer dispositivo del user agent
        if "iPhone" in self.user_agent:
            return "iPhone"
        elif "iPad" in self.user_agent:
            return "iPad"
        elif "Android" in self.user_agent:
            return "Android Device"
        elif "Windows" in self.user_agent:
            return "Windows PC"
        elif "Macintosh" in self.user_agent:
            return "Mac"
        elif "Linux" in self.user_agent:
            return "Linux PC"
        else:
            return "Unknown Device"
    
    @property
    def location_display(self):
        """Mostrar ubicación formateada"""
        if self.city and self.country:
            return f"{self.city}, {self.country}"
        elif self.country:
            return self.country
        else:
            return None
    
    @classmethod
    def create_session(cls, company_id, access_token, refresh_token, user_agent=None, ip_address=None):
        """Crear una nueva sesión"""
        # Calcular fecha de expiración (30 días)
        expires_at = datetime.now(timezone.utc) + timedelta(days=30)
        
        return cls(
            company_id=company_id,
            access_token=access_token,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at,
            is_active=True,
            is_revoked=False
        )