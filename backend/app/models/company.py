from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Información de la empresa
    company_name = Column(String(100), nullable=False)
    tax_id = Column(String(50), nullable=True)  # NIT o identificación fiscal
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)  # Pequeña, Mediana, Grande
    website = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    
    # Información de contacto principal
    contact_name = Column(String(100), nullable=True)
    contact_position = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    
    # Ubicación
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Estado de la cuenta
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)  # Verificación de empresa
    email_verified = Column(Boolean, default=False, nullable=False)
    phone_verified = Column(Boolean, default=False, nullable=False)
    
    # Tipo de colaboración
    collaboration_type = Column(String(50), nullable=True)  # Patrocinador, Desarrollador, Recolector, etc.
    
    # Reputación y estadísticas
    reputation_score = Column(Float, default=0.0, nullable=False)
    total_exchanges = Column(Integer, default=0, nullable=False)
    successful_exchanges = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    sessions = relationship("CompanySession", back_populates="company", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="company", cascade="all, delete-orphan")
    
    @property
    def full_name(self):
        return self.company_name