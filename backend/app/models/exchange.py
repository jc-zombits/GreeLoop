from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class ExchangeStatus(str, enum.Enum):
    """Estados de un intercambio"""
    PENDING = "pending"            # Pendiente (recién creado)
    ACCEPTED = "accepted"          # Aceptado por el dueño
    REJECTED = "rejected"          # Rechazado por el dueño
    COUNTER_OFFERED = "counter_offered"  # Contraoferta realizada
    CONFIRMED = "confirmed"        # Confirmado por ambas partes
    IN_PROGRESS = "in_progress"    # En progreso (intercambio físico)
    COMPLETED = "completed"        # Completado exitosamente
    CANCELLED = "cancelled"        # Cancelado por cualquier parte
    DISPUTED = "disputed"          # En disputa

class Exchange(Base):
    __tablename__ = "exchanges"
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Participantes del intercambio
    requester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Objetos involucrados
    requested_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False, index=True)
    offered_item_id = Column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=True, index=True)
    
    # Estado del intercambio
    status = Column(Enum(ExchangeStatus), default=ExchangeStatus.PENDING, nullable=False, index=True)
    
    # Mensajes y notas
    initial_message = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    completion_notes = Column(Text, nullable=True)
    
    # Información del encuentro
    meeting_location = Column(String(500), nullable=True)
    meeting_datetime = Column(DateTime(timezone=True), nullable=True)
    meeting_confirmed_by_requester = Column(Boolean, default=False, nullable=False)
    meeting_confirmed_by_owner = Column(Boolean, default=False, nullable=False)
    
    # Confirmaciones de finalización
    completed_by_requester = Column(Boolean, default=False, nullable=False)
    completed_by_owner = Column(Boolean, default=False, nullable=False)
    
    # Información adicional
    requires_additional_payment = Column(Boolean, default=False, nullable=False)
    additional_payment_amount = Column(String(50), nullable=True)
    additional_payment_description = Column(Text, nullable=True)
    
    # Timestamps importantes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relaciones
    requester = relationship("User", foreign_keys=[requester_id], back_populates="sent_exchanges")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="received_exchanges")
    requested_item = relationship("Item", foreign_keys=[requested_item_id], back_populates="sent_exchanges")
    offered_item = relationship("Item", foreign_keys=[offered_item_id], back_populates="received_exchanges")
    messages = relationship("Message", back_populates="exchange", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="exchange", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Exchange(id={self.id}, status={self.status}, requester_id={self.requester_id})>"
    
    @property
    def status_display(self):
        """Obtener el texto de estado para mostrar"""
        status_map = {
            ExchangeStatus.PENDING: "Pendiente",
            ExchangeStatus.ACCEPTED: "Aceptado",
            ExchangeStatus.REJECTED: "Rechazado",
            ExchangeStatus.COUNTER_OFFERED: "Contraoferta",
            ExchangeStatus.CONFIRMED: "Confirmado",
            ExchangeStatus.IN_PROGRESS: "En progreso",
            ExchangeStatus.COMPLETED: "Completado",
            ExchangeStatus.CANCELLED: "Cancelado",
            ExchangeStatus.DISPUTED: "En disputa"
        }
        return status_map.get(self.status, self.status.value)
    
    @property
    def is_active(self) -> bool:
        """Verificar si el intercambio está activo (no finalizado)"""
        inactive_statuses = {
            ExchangeStatus.REJECTED,
            ExchangeStatus.COMPLETED,
            ExchangeStatus.CANCELLED
        }
        return self.status not in inactive_statuses
    
    @property
    def can_be_cancelled(self) -> bool:
        """Verificar si el intercambio puede ser cancelado"""
        cancellable_statuses = {
            ExchangeStatus.PENDING,
            ExchangeStatus.ACCEPTED,
            ExchangeStatus.COUNTER_OFFERED,
            ExchangeStatus.CONFIRMED
        }
        return self.status in cancellable_statuses
    
    @property
    def requires_meeting_confirmation(self) -> bool:
        """Verificar si requiere confirmación de encuentro"""
        return (
            self.status == ExchangeStatus.CONFIRMED and
            self.meeting_datetime is not None and
            (not self.meeting_confirmed_by_requester or not self.meeting_confirmed_by_owner)
        )
    
    @property
    def is_meeting_confirmed(self) -> bool:
        """Verificar si el encuentro está confirmado por ambas partes"""
        return self.meeting_confirmed_by_requester and self.meeting_confirmed_by_owner
    
    @property
    def is_completed_by_both(self) -> bool:
        """Verificar si está marcado como completado por ambas partes"""
        return self.completed_by_requester and self.completed_by_owner
    
    def can_be_accessed_by(self, user_id: UUID) -> bool:
        """Verificar si un usuario puede acceder a este intercambio"""
        return user_id in [self.requester_id, self.owner_id]
    
    def get_other_user_id(self, current_user_id: UUID) -> UUID:
        """Obtener el ID del otro usuario en el intercambio"""
        if current_user_id == self.requester_id:
            return self.owner_id
        elif current_user_id == self.owner_id:
            return self.requester_id
        else:
            raise ValueError("El usuario no participa en este intercambio")
    
    def update_status(self, new_status: ExchangeStatus, user_id: UUID = None):
        """Actualizar el estado del intercambio con timestamps apropiados"""
        self.status = new_status
        now = func.now()
        
        if new_status == ExchangeStatus.ACCEPTED:
            self.accepted_at = now
        elif new_status == ExchangeStatus.REJECTED:
            self.rejected_at = now
        elif new_status == ExchangeStatus.CONFIRMED:
            self.confirmed_at = now
        elif new_status == ExchangeStatus.COMPLETED:
            self.completed_at = now
        elif new_status == ExchangeStatus.CANCELLED:
            self.cancelled_at = now
    
    def confirm_meeting(self, user_id: UUID):
        """Confirmar el encuentro por parte de un usuario"""
        if user_id == self.requester_id:
            self.meeting_confirmed_by_requester = True
        elif user_id == self.owner_id:
            self.meeting_confirmed_by_owner = True
        
        # Si ambos han confirmado, cambiar estado
        if self.is_meeting_confirmed and self.status == ExchangeStatus.CONFIRMED:
            self.update_status(ExchangeStatus.IN_PROGRESS)
    
    def mark_completed(self, user_id: UUID):
        """Marcar como completado por parte de un usuario"""
        if user_id == self.requester_id:
            self.completed_by_requester = True
        elif user_id == self.owner_id:
            self.completed_by_owner = True
        
        # Si ambos han marcado como completado, finalizar intercambio
        if self.is_completed_by_both:
            self.update_status(ExchangeStatus.COMPLETED)
    
    def get_timeline(self) -> list:
        """Obtener la línea de tiempo del intercambio"""
        timeline = []
        
        timeline.append({
            "event": "created",
            "timestamp": self.created_at,
            "description": "Intercambio solicitado"
        })
        
        if self.accepted_at:
            timeline.append({
                "event": "accepted",
                "timestamp": self.accepted_at,
                "description": "Intercambio aceptado"
            })
        
        if self.rejected_at:
            timeline.append({
                "event": "rejected",
                "timestamp": self.rejected_at,
                "description": "Intercambio rechazado"
            })
        
        if self.confirmed_at:
            timeline.append({
                "event": "confirmed",
                "timestamp": self.confirmed_at,
                "description": "Intercambio confirmado"
            })
        
        if self.completed_at:
            timeline.append({
                "event": "completed",
                "timestamp": self.completed_at,
                "description": "Intercambio completado"
            })
        
        if self.cancelled_at:
            timeline.append({
                "event": "cancelled",
                "timestamp": self.cancelled_at,
                "description": "Intercambio cancelado"
            })
        
        return sorted(timeline, key=lambda x: x["timestamp"])