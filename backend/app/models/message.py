from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class MessageType(str, enum.Enum):
    """Tipos de mensaje"""
    TEXT = "text"                  # Mensaje de texto
    IMAGE = "image"                # Imagen
    SYSTEM = "system"              # Mensaje del sistema
    EXCHANGE_UPDATE = "exchange_update"  # Actualización de intercambio

class Message(Base):
    __tablename__ = "messages"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Participantes
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Relación con intercambio (opcional)
    exchange_id = Column(UUID(as_uuid=True), ForeignKey("exchanges.id"), nullable=True, index=True)
    
    # Contenido del mensaje
    message_type = Column(Enum(MessageType), default=MessageType.TEXT, nullable=False)
    content = Column(Text, nullable=False)
    
    # Metadatos adicionales
    message_metadata = Column(Text, nullable=True)  # JSON string para datos adicionales
    
    # Estado del mensaje
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    is_deleted_by_sender = Column(Boolean, default=False, nullable=False)
    is_deleted_by_receiver = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
    exchange = relationship("Exchange", back_populates="messages")
    
    def __repr__(self):
        return f"<Message(id={self.id}, sender_id={self.sender_id}, receiver_id={self.receiver_id})>"
    
    @property
    def is_system_message(self) -> bool:
        """Verificar si es un mensaje del sistema"""
        return self.message_type in [MessageType.SYSTEM, MessageType.EXCHANGE_UPDATE]
    
    @property
    def is_deleted(self) -> bool:
        """Verificar si el mensaje está eliminado"""
        return self.is_deleted_by_sender and self.is_deleted_by_receiver
    
    def can_be_accessed_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede acceder a este mensaje"""
        return user_id in [self.sender_id, self.receiver_id]
    
    def can_be_deleted_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede eliminar este mensaje"""
        # Los usuarios pueden eliminar mensajes que enviaron o recibieron
        return user_id in [self.sender_id, self.receiver_id]
    
    def is_visible_to(self, user_id: UUID) -> bool:
        """Verificar si el mensaje es visible para un usuario"""
        if user_id == self.sender_id:
            return not self.is_deleted_by_sender
        elif user_id == self.receiver_id:
            return not self.is_deleted_by_receiver
        return False
    
    def mark_as_read(self, user_id: UUID):
        """Marcar el mensaje como leído por un usuario específico"""
        if user_id == self.receiver_id and not self.is_read:
            self.is_read = True
            self.read_at = func.now()
    
    def delete_for_user(self, user_id: UUID):
        """Eliminar el mensaje para un usuario específico"""
        if user_id == self.sender_id:
            self.is_deleted_by_sender = True
        elif user_id == self.receiver_id:
            self.is_deleted_by_receiver = True
    
    def get_conversation_partner(self, current_user_id: UUID) -> UUID:
        """Obtener el ID del otro participante en la conversación"""
        if current_user_id == self.sender_id:
            return self.receiver_id
        elif current_user_id == self.receiver_id:
            return self.sender_id
        else:
            raise ValueError("El usuario no participa en esta conversación")
    
    @classmethod
    def create_system_message(
        cls,
        receiver_id: UUID,
        content: str,
        exchange_id: UUID = None,
        message_metadata: str = None
    ):
        """Crear un mensaje del sistema"""
        return cls(
            sender_id=None,  # Los mensajes del sistema no tienen remitente
            receiver_id=receiver_id,
            exchange_id=exchange_id,
            message_type=MessageType.SYSTEM,
            content=content,
            message_metadata=message_metadata
        )
    
    @classmethod
    def create_exchange_update_message(
        cls,
        receiver_id: UUID,
        exchange_id: UUID,
        content: str,
        message_metadata: str = None
    ):
        """Crear un mensaje de actualización de intercambio"""
        return cls(
            sender_id=None,
            receiver_id=receiver_id,
            exchange_id=exchange_id,
            message_type=MessageType.EXCHANGE_UPDATE,
            content=content,
            message_metadata=message_metadata
        )
    
    def to_dict(self, current_user_id: UUID = None) -> dict:
        """Convertir el mensaje a diccionario para API"""
        result = {
            "id": str(self.id),
            "sender_id": str(self.sender_id) if self.sender_id else None,
            "receiver_id": str(self.receiver_id),
            "exchange_id": str(self.exchange_id) if self.exchange_id else None,
            "message_type": self.message_type.value,
            "content": self.content,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None
        }
        
        # Incluir información de eliminación solo para el usuario actual
        if current_user_id:
            if current_user_id == self.sender_id:
                result["is_deleted"] = self.is_deleted_by_sender
            elif current_user_id == self.receiver_id:
                result["is_deleted"] = self.is_deleted_by_receiver
        
        return result
    
    @classmethod
    def get_conversation_messages(
        cls,
        db_session,
        user1_id: UUID,
        user2_id: UUID,
        exchange_id: UUID = None,
        limit: int = 50,
        offset: int = 0
    ):
        """Obtener mensajes de una conversación entre dos usuarios"""
        query = db_session.query(cls).filter(
            (
                (cls.sender_id == user1_id) & (cls.receiver_id == user2_id) |
                (cls.sender_id == user2_id) & (cls.receiver_id == user1_id)
            )
        )
        
        if exchange_id:
            query = query.filter(cls.exchange_id == exchange_id)
        
        return query.order_by(cls.created_at.desc()).offset(offset).limit(limit).all()
    
    @classmethod
    def mark_conversation_as_read(
        cls,
        db_session,
        user_id: UUID,
        other_user_id: UUID,
        exchange_id: UUID = None
    ):
        """Marcar todos los mensajes de una conversación como leídos"""
        query = db_session.query(cls).filter(
            cls.sender_id == other_user_id,
            cls.receiver_id == user_id,
            cls.is_read == False
        )
        
        if exchange_id:
            query = query.filter(cls.exchange_id == exchange_id)
        
        query.update({
            "is_read": True,
            "read_at": func.now()
        })
        
        db_session.commit()