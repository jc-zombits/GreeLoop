from sqlalchemy import Column, String, Text, Boolean, DateTime, Float, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class ItemCondition(str, enum.Enum):
    """Estados de condición de un objeto"""
    NEW = "new"                    # Nuevo
    LIKE_NEW = "like_new"          # Como nuevo
    EXCELLENT = "excellent"        # Excelente
    GOOD = "good"                  # Bueno
    FAIR = "fair"                  # Regular
    POOR = "poor"                  # Malo

class ItemStatus(str, enum.Enum):
    """Estados de disponibilidad de un objeto"""
    AVAILABLE = "available"        # Disponible
    RESERVED = "reserved"          # Reservado
    EXCHANGED = "exchanged"        # Intercambiado
    INACTIVE = "inactive"          # Inactivo

class Item(Base):
    __tablename__ = "items"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Relaciones con otras tablas
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False, index=True)
    
    # Estado y condición
    condition = Column(Enum(ItemCondition), nullable=False, index=True)
    status = Column(Enum(ItemStatus), default=ItemStatus.AVAILABLE, nullable=False, index=True)
    
    # Valor estimado (opcional)
    estimated_value = Column(Float, nullable=True)
    currency = Column(String(3), default="USD", nullable=False)  # ISO 4217
    
    # Ubicación (heredada del usuario, pero puede ser específica)
    location_description = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Configuraciones de intercambio
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    allow_partial_exchange = Column(Boolean, default=False, nullable=False)
    requires_meetup = Column(Boolean, default=True, nullable=False)
    max_distance_km = Column(Integer, default=50, nullable=False)
    
    # Preferencias de intercambio
    preferred_categories = Column(Text, nullable=True)  # JSON string con IDs de categorías
    exchange_preferences = Column(Text, nullable=True)  # Descripción de lo que busca
    
    # Estadísticas y métricas
    views_count = Column(Integer, default=0, nullable=False)
    favorites_count = Column(Integer, default=0, nullable=False)
    exchange_requests_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_viewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    owner = relationship("User", back_populates="items")
    category = relationship("Category", back_populates="items")
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan")
    sent_exchanges = relationship(
        "Exchange", 
        foreign_keys="Exchange.requested_item_id", 
        back_populates="requested_item"
    )
    received_exchanges = relationship(
        "Exchange", 
        foreign_keys="Exchange.offered_item_id", 
        back_populates="offered_item"
    )
    
    def __repr__(self):
        return f"<Item(id={self.id}, title={self.title}, owner_id={self.owner_id})>"
    
    @property
    def main_image_url(self):
        """Obtener la URL de la imagen principal"""
        main_image = next((img for img in self.images if img.is_primary), None)
        if main_image:
            return main_image.image_url
        elif self.images:
            return self.images[0].image_url
        return None
    
    @property
    def condition_display(self):
        """Obtener el texto de condición para mostrar"""
        condition_map = {
            ItemCondition.NEW: "Nuevo",
            ItemCondition.LIKE_NEW: "Como nuevo",
            ItemCondition.EXCELLENT: "Excelente",
            ItemCondition.GOOD: "Bueno",
            ItemCondition.FAIR: "Regular",
            ItemCondition.POOR: "Malo"
        }
        return condition_map.get(self.condition, self.condition.value)
    
    @property
    def status_display(self):
        """Obtener el texto de estado para mostrar"""
        status_map = {
            ItemStatus.AVAILABLE: "Disponible",
            ItemStatus.RESERVED: "Reservado",
            ItemStatus.EXCHANGED: "Intercambiado",
            ItemStatus.INACTIVE: "Inactivo"
        }
        return status_map.get(self.status, self.status.value)
    
    def is_available_for_exchange(self) -> bool:
        """Verificar si el objeto está disponible para intercambio"""
        return (
            self.is_active and 
            self.status == ItemStatus.AVAILABLE and
            self.owner.can_exchange()
        )
    
    def increment_views(self):
        """Incrementar el contador de visualizaciones"""
        self.views_count += 1
        self.last_viewed_at = func.now()
    
    def can_be_viewed_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede ver este objeto"""
        if not self.is_active:
            return self.owner_id == user_id  # Solo el dueño puede ver objetos inactivos
        return True
    
    def can_be_edited_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede editar este objeto"""
        return self.owner_id == user_id
    
    def get_distance_to(self, latitude: float, longitude: float) -> float:
        """Calcular la distancia a una ubicación específica (en km)"""
        if not self.latitude or not self.longitude:
            return float('inf')
        
        # Fórmula de Haversine para calcular distancia entre dos puntos
        import math
        
        lat1, lon1 = math.radians(self.latitude), math.radians(self.longitude)
        lat2, lon2 = math.radians(latitude), math.radians(longitude)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radio de la Tierra en kilómetros
        r = 6371
        
        return c * r