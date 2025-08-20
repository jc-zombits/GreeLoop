from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Información personal
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
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
    email_verified = Column(Boolean, default=False, nullable=False)
    phone_verified = Column(Boolean, default=False, nullable=False)
    
    # Reputación y estadísticas
    reputation_score = Column(Float, default=0.0, nullable=False)
    total_exchanges = Column(Integer, default=0, nullable=False)
    successful_exchanges = Column(Integer, default=0, nullable=False)
    
    # Configuraciones de privacidad
    show_phone = Column(Boolean, default=False, nullable=False)
    show_email = Column(Boolean, default=False, nullable=False)
    show_location = Column(Boolean, default=True, nullable=False)
    
    # Configuraciones de notificaciones
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    sms_notifications = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    sent_exchanges = relationship(
        "Exchange", 
        foreign_keys="Exchange.requester_id", 
        back_populates="requester",
        cascade="all, delete-orphan"
    )
    received_exchanges = relationship(
        "Exchange", 
        foreign_keys="Exchange.owner_id", 
        back_populates="owner",
        cascade="all, delete-orphan"
    )
    sent_messages = relationship(
        "Message", 
        foreign_keys="Message.sender_id", 
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    received_messages = relationship(
        "Message", 
        foreign_keys="Message.receiver_id", 
        back_populates="receiver",
        cascade="all, delete-orphan"
    )
    given_ratings = relationship(
        "Rating", 
        foreign_keys="Rating.rater_id", 
        back_populates="rater",
        cascade="all, delete-orphan"
    )
    received_ratings = relationship(
        "Rating", 
        foreign_keys="Rating.rated_id", 
        back_populates="rated",
        cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", 
        foreign_keys="Notification.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    sessions = relationship(
        "UserSession", 
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
    
    @property
    def full_name(self):
        """Obtener el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def success_rate(self):
        """Calcular la tasa de éxito de intercambios"""
        if self.total_exchanges == 0:
            return 0.0
        return (self.successful_exchanges / self.total_exchanges) * 100
    
    def update_reputation(self, new_rating: float):
        """Actualizar la puntuación de reputación con una nueva calificación"""
        # Algoritmo simple de promedio ponderado
        # En el futuro se puede implementar un algoritmo más sofisticado
        total_ratings = len(self.received_ratings)
        if total_ratings == 0:
            self.reputation_score = new_rating
        else:
            current_total = self.reputation_score * (total_ratings - 1)
            self.reputation_score = (current_total + new_rating) / total_ratings
    
    def can_exchange(self) -> bool:
        """Verificar si el usuario puede realizar intercambios"""
        return (
            self.is_active and 
            self.email_verified and 
            self.reputation_score >= -2.0  # Umbral mínimo de reputación
        )