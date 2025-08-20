from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class ItemImage(Base):
    __tablename__ = "item_images"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    
    # Información de la imagen
    image_url = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)  # Tamaño en bytes
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    # Configuración
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    alt_text = Column(String(255), nullable=True)  # Texto alternativo para accesibilidad
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    item = relationship("Item", back_populates="images")
    
    def __repr__(self):
        return f"<ItemImage(id={self.id}, item_id={self.item_id}, is_primary={self.is_primary})>"
    
    @property
    def aspect_ratio(self):
        """Calcular la relación de aspecto de la imagen"""
        if self.width and self.height and self.height != 0:
            return self.width / self.height
        return None
    
    @property
    def file_size_mb(self):
        """Obtener el tamaño del archivo en MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None
    
    def get_thumbnail_url(self, size: str = "medium") -> str:
        """Generar URL de thumbnail basada en el tamaño solicitado"""
        # En el futuro, esto podría generar URLs de diferentes tamaños
        # Por ahora, retorna la URL original
        size_map = {
            "small": "_thumb_small",
            "medium": "_thumb_medium", 
            "large": "_thumb_large"
        }
        
        if size in size_map:
            # Insertar el sufijo antes de la extensión
            parts = self.image_url.rsplit('.', 1)
            if len(parts) == 2:
                return f"{parts[0]}{size_map[size]}.{parts[1]}"
        
        return self.image_url
    
    @classmethod
    def set_primary_image(cls, db_session, item_id: UUID, image_id: UUID):
        """Establecer una imagen como principal y quitar el flag de las demás"""
        # Quitar el flag primary de todas las imágenes del item
        db_session.query(cls).filter(
            cls.item_id == item_id
        ).update({"is_primary": False})
        
        # Establecer la imagen especificada como principal
        db_session.query(cls).filter(
            cls.id == image_id,
            cls.item_id == item_id
        ).update({"is_primary": True})
        
        db_session.commit()
    
    @classmethod
    def reorder_images(cls, db_session, item_id: UUID, image_orders: list):
        """Reordenar las imágenes de un item"""
        for order, image_id in enumerate(image_orders):
            db_session.query(cls).filter(
                cls.id == image_id,
                cls.item_id == item_id
            ).update({"sort_order": order})
        
        db_session.commit()
    
    def is_valid_image_format(self) -> bool:
        """Verificar si el formato de imagen es válido"""
        if not self.image_url:
            return False
        
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        return any(self.image_url.lower().endswith(ext) for ext in valid_extensions)
    
    def get_image_info(self) -> dict:
        """Obtener información completa de la imagen"""
        return {
            "id": str(self.id),
            "url": self.image_url,
            "is_primary": self.is_primary,
            "sort_order": self.sort_order,
            "alt_text": self.alt_text,
            "width": self.width,
            "height": self.height,
            "file_size_mb": self.file_size_mb,
            "aspect_ratio": self.aspect_ratio,
            "thumbnails": {
                "small": self.get_thumbnail_url("small"),
                "medium": self.get_thumbnail_url("medium"),
                "large": self.get_thumbnail_url("large")
            }
        }