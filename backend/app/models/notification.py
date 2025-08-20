from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class NotificationType(str, enum.Enum):
    """Tipos de notificación"""
    EXCHANGE_REQUEST = "exchange_request"          # Nueva solicitud de intercambio
    EXCHANGE_ACCEPTED = "exchange_accepted"        # Intercambio aceptado
    EXCHANGE_REJECTED = "exchange_rejected"        # Intercambio rechazado
    EXCHANGE_CONFIRMED = "exchange_confirmed"      # Intercambio confirmado
    EXCHANGE_COMPLETED = "exchange_completed"      # Intercambio completado
    EXCHANGE_CANCELLED = "exchange_cancelled"      # Intercambio cancelado
    NEW_MESSAGE = "new_message"                    # Nuevo mensaje
    RATING_RECEIVED = "rating_received"            # Nueva calificación recibida
    ITEM_VIEWED = "item_viewed"                    # Objeto visualizado
    SYSTEM_ANNOUNCEMENT = "system_announcement"    # Anuncio del sistema
    ACCOUNT_UPDATE = "account_update"              # Actualización de cuenta
    SECURITY_ALERT = "security_alert"              # Alerta de seguridad

class NotificationPriority(str, enum.Enum):
    """Prioridades de notificación"""
    LOW = "low"          # Baja prioridad
    NORMAL = "normal"    # Prioridad normal
    HIGH = "high"        # Alta prioridad
    URGENT = "urgent"    # Urgente

class Notification(Base):
    __tablename__ = "notifications"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Tipo y prioridad
    notification_type = Column(Enum(NotificationType), nullable=False, index=True)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL, nullable=False)
    
    # Contenido
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Enlaces y acciones
    action_url = Column(String(500), nullable=True)  # URL a la que dirigir al usuario
    action_text = Column(String(100), nullable=True)  # Texto del botón de acción
    
    # Metadatos adicionales
    notification_metadata = Column(Text, nullable=True)  # JSON string para datos adicionales
    
    # Referencias a otras entidades
    related_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Usuario relacionado
    related_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=True)  # Objeto relacionado
    related_exchange_id = Column(UUID(as_uuid=True), ForeignKey("exchanges.id"), nullable=True)  # Intercambio relacionado
    
    # Estado
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Configuración de entrega
    send_email = Column(Boolean, default=False, nullable=False)
    send_push = Column(Boolean, default=True, nullable=False)
    send_sms = Column(Boolean, default=False, nullable=False)
    
    # Estado de entrega
    email_sent = Column(Boolean, default=False, nullable=False)
    push_sent = Column(Boolean, default=False, nullable=False)
    sms_sent = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Fecha de expiración
    
    # Relaciones
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    related_user = relationship("User", foreign_keys=[related_user_id])
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.notification_type})>"
    
    @property
    def is_expired(self) -> bool:
        """Verificar si la notificación ha expirado"""
        if self.expires_at is None:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @property
    def priority_display(self) -> str:
        """Obtener el texto de prioridad para mostrar"""
        priority_map = {
            NotificationPriority.LOW: "Baja",
            NotificationPriority.NORMAL: "Normal",
            NotificationPriority.HIGH: "Alta",
            NotificationPriority.URGENT: "Urgente"
        }
        return priority_map.get(self.priority, self.priority.value)
    
    @property
    def type_display(self) -> str:
        """Obtener el texto del tipo para mostrar"""
        type_map = {
            NotificationType.EXCHANGE_REQUEST: "Solicitud de intercambio",
            NotificationType.EXCHANGE_ACCEPTED: "Intercambio aceptado",
            NotificationType.EXCHANGE_REJECTED: "Intercambio rechazado",
            NotificationType.EXCHANGE_CONFIRMED: "Intercambio confirmado",
            NotificationType.EXCHANGE_COMPLETED: "Intercambio completado",
            NotificationType.EXCHANGE_CANCELLED: "Intercambio cancelado",
            NotificationType.NEW_MESSAGE: "Nuevo mensaje",
            NotificationType.RATING_RECEIVED: "Nueva calificación",
            NotificationType.ITEM_VIEWED: "Objeto visualizado",
            NotificationType.SYSTEM_ANNOUNCEMENT: "Anuncio del sistema",
            NotificationType.ACCOUNT_UPDATE: "Actualización de cuenta",
            NotificationType.SECURITY_ALERT: "Alerta de seguridad"
        }
        return type_map.get(self.notification_type, self.notification_type.value)
    
    def mark_as_read(self):
        """Marcar la notificación como leída"""
        if not self.is_read:
            self.is_read = True
            self.read_at = func.now()
    
    def soft_delete(self):
        """Eliminar la notificación de forma suave"""
        self.is_deleted = True
    
    def can_be_accessed_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede acceder a esta notificación"""
        return self.user_id == user_id
    
    @classmethod
    def create_exchange_notification(
        cls,
        user_id: UUID,
        notification_type: NotificationType,
        exchange_id: UUID,
        related_user_id: UUID = None,
        custom_message: str = None
    ):
        """Crear una notificación relacionada con intercambio"""
        
        # Mensajes por defecto según el tipo
        default_messages = {
            NotificationType.EXCHANGE_REQUEST: {
                "title": "Nueva solicitud de intercambio",
                "message": "Tienes una nueva solicitud de intercambio para uno de tus objetos.",
                "action_text": "Ver solicitud"
            },
            NotificationType.EXCHANGE_ACCEPTED: {
                "title": "¡Intercambio aceptado!",
                "message": "Tu solicitud de intercambio ha sido aceptada.",
                "action_text": "Ver intercambio"
            },
            NotificationType.EXCHANGE_REJECTED: {
                "title": "Intercambio rechazado",
                "message": "Tu solicitud de intercambio ha sido rechazada.",
                "action_text": "Ver detalles"
            },
            NotificationType.EXCHANGE_CONFIRMED: {
                "title": "Intercambio confirmado",
                "message": "El intercambio ha sido confirmado por ambas partes.",
                "action_text": "Ver intercambio"
            },
            NotificationType.EXCHANGE_COMPLETED: {
                "title": "¡Intercambio completado!",
                "message": "El intercambio se ha completado exitosamente.",
                "action_text": "Calificar"
            },
            NotificationType.EXCHANGE_CANCELLED: {
                "title": "Intercambio cancelado",
                "message": "El intercambio ha sido cancelado.",
                "action_text": "Ver detalles"
            }
        }
        
        config = default_messages.get(notification_type, {
            "title": "Actualización de intercambio",
            "message": custom_message or "Hay una actualización en tu intercambio.",
            "action_text": "Ver intercambio"
        })
        
        return cls(
            user_id=user_id,
            notification_type=notification_type,
            title=config["title"],
            message=custom_message or config["message"],
            action_url=f"/exchanges/{exchange_id}",
            action_text=config["action_text"],
            related_user_id=related_user_id,
            related_exchange_id=exchange_id,
            priority=NotificationPriority.HIGH if notification_type in [
                NotificationType.EXCHANGE_REQUEST,
                NotificationType.EXCHANGE_ACCEPTED,
                NotificationType.EXCHANGE_CONFIRMED
            ] else NotificationPriority.NORMAL
        )
    
    @classmethod
    def create_message_notification(
        cls,
        user_id: UUID,
        sender_id: UUID,
        sender_name: str,
        exchange_id: UUID = None
    ):
        """Crear una notificación de nuevo mensaje"""
        return cls(
            user_id=user_id,
            notification_type=NotificationType.NEW_MESSAGE,
            title="Nuevo mensaje",
            message=f"Tienes un nuevo mensaje de {sender_name}.",
            action_url=f"/messages/{sender_id}" + (f"?exchange={exchange_id}" if exchange_id else ""),
            action_text="Leer mensaje",
            related_user_id=sender_id,
            related_exchange_id=exchange_id,
            priority=NotificationPriority.NORMAL
        )
    
    @classmethod
    def create_rating_notification(
        cls,
        user_id: UUID,
        rater_id: UUID,
        rater_name: str,
        rating: float,
        exchange_id: UUID
    ):
        """Crear una notificación de nueva calificación"""
        stars = "⭐" * round(rating)
        return cls(
            user_id=user_id,
            notification_type=NotificationType.RATING_RECEIVED,
            title="Nueva calificación recibida",
            message=f"{rater_name} te ha calificado con {stars} ({rating}/5).",
            action_url=f"/profile/ratings",
            action_text="Ver calificaciones",
            related_user_id=rater_id,
            related_exchange_id=exchange_id,
            priority=NotificationPriority.NORMAL
        )
    
    @classmethod
    def create_system_notification(
        cls,
        user_id: UUID,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        action_url: str = None,
        action_text: str = None
    ):
        """Crear una notificación del sistema"""
        return cls(
            user_id=user_id,
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            title=title,
            message=message,
            action_url=action_url,
            action_text=action_text,
            priority=priority
        )
    
    def to_dict(self) -> dict:
        """Convertir la notificación a diccionario para API"""
        return {
            "id": str(self.id),
            "type": self.notification_type.value,
            "type_display": self.type_display,
            "priority": self.priority.value,
            "priority_display": self.priority_display,
            "title": self.title,
            "message": self.message,
            "action_url": self.action_url,
            "action_text": self.action_text,
            "is_read": self.is_read,
            "is_expired": self.is_expired,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "related_user_id": str(self.related_user_id) if self.related_user_id else None,
            "related_item_id": str(self.related_item_id) if self.related_item_id else None,
            "related_exchange_id": str(self.related_exchange_id) if self.related_exchange_id else None
        }