from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class ContributionStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DeliveryMethod(str, enum.Enum):
    PICKUP = "pickup"  # Recogida en empresa
    DELIVERY = "delivery"  # Entrega a domicilio
    SHIPPING = "shipping"  # Envío por paquetería
    DIGITAL = "digital"  # Transferencia digital (dinero)
    ON_SITE = "on_site"  # En las instalaciones (mano de obra)

class Contribution(Base):
    __tablename__ = "contributions"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Relaciones
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("contribution_categories.id"), nullable=False)
    
    # Detalles de la contribución
    quantity = Column(String(100), nullable=True)  # Ej: "100 kg", "5 horas", "$1000"
    estimated_value = Column(Float, nullable=True)  # Valor estimado en moneda local
    currency = Column(String(3), default="EUR", nullable=False)  # ISO 4217
    
    # Información de entrega/destinación
    destination = Column(Text, nullable=True)  # A quién va dirigida la donación
    delivery_method = Column(Enum(DeliveryMethod), nullable=False)
    delivery_address = Column(Text, nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    
    # Fechas y disponibilidad
    available_from = Column(DateTime(timezone=True), nullable=True)
    available_until = Column(DateTime(timezone=True), nullable=True)
    
    # Estado y metadatos
    status = Column(Enum(ContributionStatus), default=ContributionStatus.DRAFT, nullable=False)
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_pattern = Column(String(50), nullable=True)  # Ej: "monthly", "weekly"
    
    # Campos de seguimiento
    views_count = Column(Integer, default=0, nullable=False)
    interested_count = Column(Integer, default=0, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    company = relationship("Company", back_populates="contributions")
    category = relationship("ContributionCategory", back_populates="contributions")
    images = relationship("ContributionImage", back_populates="contribution", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Contribution(id={self.id}, title='{self.title}', company_id={self.company_id})>"