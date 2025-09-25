from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class ContributionImage(Base):
    __tablename__ = "contribution_images"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    contribution_id = Column(UUID(as_uuid=True), ForeignKey("contributions.id"), nullable=False)
    
    # Información de la imagen
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)  # Tamaño en bytes
    mime_type = Column(String(100), nullable=True)
    
    # Metadatos de la imagen
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    
    # Metadatos del sistema
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relaciones
    contribution = relationship("Contribution", back_populates="images")
    
    def __repr__(self):
        return f"<ContributionImage(id={self.id}, filename='{self.filename}', contribution_id={self.contribution_id})>"