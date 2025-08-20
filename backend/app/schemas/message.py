from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ..models.message import MessageType

# Esquema base para mensaje
class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    message_type: MessageType = MessageType.TEXT
    
    @validator('content')
    def validate_content(cls, v):
        return v.strip()

# Esquema para crear mensaje
class MessageCreate(MessageBase):
    receiver_id: UUID
    exchange_id: Optional[UUID] = None
    reply_to_id: Optional[UUID] = None
    metadata: Optional[dict] = {}

# Esquema para respuesta de mensaje
class MessageResponse(MessageBase):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    exchange_id: Optional[UUID]
    reply_to_id: Optional[UUID]
    
    # Estado del mensaje
    is_read: bool
    is_deleted_by_sender: bool
    is_deleted_by_receiver: bool
    
    # Metadatos
    metadata: Optional[dict]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    read_at: Optional[datetime]
    
    # Información del remitente
    sender: dict  # Información básica del usuario
    
    # Información del receptor
    receiver: dict  # Información básica del usuario
    
    # Mensaje al que responde (si aplica)
    reply_to: Optional[dict] = None
    
    # Información del intercambio (si aplica)
    exchange: Optional[dict] = None
    
    class Config:
        from_attributes = True

# Esquema para lista de mensajes (versión simplificada)
class MessageListItem(BaseModel):
    id: UUID
    content: str
    message_type: MessageType
    sender_id: UUID
    sender_username: str
    sender_avatar: Optional[str]
    is_read: bool
    created_at: datetime
    
    # Información del mensaje al que responde
    reply_to_content: Optional[str] = None
    
    class Config:
        from_attributes = True

# Esquema para conversación
class ConversationResponse(BaseModel):
    conversation_id: str  # Combinación de user IDs
    other_user: dict  # Información del otro usuario
    exchange: Optional[dict] = None  # Información del intercambio si existe
    
    # Último mensaje
    last_message: Optional[MessageListItem]
    
    # Estadísticas
    total_messages: int
    unread_count: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Esquema para lista de conversaciones
class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    unread_conversations: int
    total_unread_messages: int

# Esquema para búsqueda de mensajes
class MessageSearchParams(BaseModel):
    query: Optional[str] = Field(None, max_length=200)
    conversation_with: Optional[UUID] = None
    exchange_id: Optional[UUID] = None
    message_type: Optional[MessageType] = None
    unread_only: bool = False
    
    # Filtros de fecha
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    
    # Ordenamiento
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|updated_at)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=100)

# Esquema para respuesta de búsqueda de mensajes
class MessageSearchResponse(BaseModel):
    messages: List[MessageListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Información de búsqueda
    search_query: Optional[str]
    highlighted_results: List[dict] = []  # Resultados con texto resaltado

# Esquema para marcar mensajes como leídos
class MarkMessagesReadRequest(BaseModel):
    message_ids: Optional[List[UUID]] = None
    conversation_with: Optional[UUID] = None
    mark_all: bool = False
    
    @validator('message_ids')
    def validate_message_ids(cls, v, values):
        if not values.get('mark_all') and not values.get('conversation_with') and not v:
            raise ValueError('Debe especificar message_ids, conversation_with o mark_all')
        return v

# Esquema para eliminar mensajes
class DeleteMessagesRequest(BaseModel):
    message_ids: List[UUID] = Field(..., min_items=1)
    delete_for_both: bool = False  # Solo para administradores
    
    @validator('message_ids')
    def validate_message_ids(cls, v):
        if len(v) > 50:
            raise ValueError('No se pueden eliminar más de 50 mensajes a la vez')
        return v

# Esquema para respuesta de eliminación
class DeleteMessagesResponse(BaseModel):
    deleted_count: int
    message: str

# Esquema para estadísticas de mensajes del usuario
class UserMessageStats(BaseModel):
    total_messages_sent: int
    total_messages_received: int
    total_conversations: int
    unread_messages: int
    
    # Estadísticas por tipo
    text_messages: int
    image_messages: int
    system_messages: int
    
    # Estadísticas de tiempo
    messages_today: int
    messages_this_week: int
    messages_this_month: int
    
    # Tiempo de respuesta promedio (en minutos)
    average_response_time_minutes: Optional[float]
    
    class Config:
        from_attributes = True

# Esquema para configuración de mensajes
class MessageSettings(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    sound_notifications: bool = True
    
    # Configuraciones de privacidad
    allow_messages_from_strangers: bool = True
    require_exchange_to_message: bool = False
    
    # Configuraciones de filtrado
    block_inappropriate_content: bool = True
    auto_delete_old_messages_days: Optional[int] = Field(None, ge=30, le=365)
    
    class Config:
        from_attributes = True

# Esquema para actualizar configuración de mensajes
class MessageSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sound_notifications: Optional[bool] = None
    allow_messages_from_strangers: Optional[bool] = None
    require_exchange_to_message: Optional[bool] = None
    block_inappropriate_content: Optional[bool] = None
    auto_delete_old_messages_days: Optional[int] = Field(None, ge=30, le=365)

# Esquema para reportar mensaje
class MessageReportRequest(BaseModel):
    message_id: UUID
    reason: str = Field(..., pattern="^(spam|harassment|inappropriate|fraud|other)$")
    description: Optional[str] = Field(None, max_length=500)
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para bloquear usuario
class BlockUserRequest(BaseModel):
    user_id: UUID
    reason: Optional[str] = Field(None, max_length=200)
    
    @validator('reason')
    def validate_reason(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para lista de usuarios bloqueados
class BlockedUserResponse(BaseModel):
    user_id: UUID
    username: str
    avatar_url: Optional[str]
    blocked_at: datetime
    reason: Optional[str]
    
    class Config:
        from_attributes = True

class BlockedUsersListResponse(BaseModel):
    blocked_users: List[BlockedUserResponse]
    total: int

# Esquema para mensaje de sistema
class SystemMessageCreate(BaseModel):
    recipient_id: UUID
    title: str = Field(..., max_length=200)
    content: str = Field(..., max_length=1000)
    message_type: MessageType = MessageType.SYSTEM
    metadata: Optional[dict] = {}
    
    @validator('title')
    def validate_title(cls, v):
        return v.strip()
    
    @validator('content')
    def validate_content(cls, v):
        return v.strip()

# Esquema para mensaje de actualización de intercambio
class ExchangeUpdateMessageCreate(BaseModel):
    exchange_id: UUID
    update_type: str = Field(..., pattern="^(status_change|meeting_scheduled|meeting_confirmed|completed|cancelled)$")
    details: dict = {}

# Esquema para subir imagen en mensaje
class MessageImageUploadResponse(BaseModel):
    image_url: str
    thumbnail_url: str
    filename: str
    file_size: int
    width: int
    height: int
    
    class Config:
        from_attributes = True

# Esquema para exportar conversación
class ConversationExportRequest(BaseModel):
    conversation_with: UUID
    format: str = Field(default="json", pattern="^(json|txt|pdf)$")
    include_metadata: bool = False
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class ConversationExportResponse(BaseModel):
    download_url: str
    filename: str
    format: str
    expires_at: datetime
    message_count: int
    file_size: int

# Esquema para métricas de mensajes (admin)
class MessageMetrics(BaseModel):
    total_messages: int
    messages_today: int
    messages_this_week: int
    messages_this_month: int
    
    # Métricas por tipo
    text_messages_percentage: float
    image_messages_percentage: float
    system_messages_percentage: float
    
    # Métricas de actividad
    active_conversations: int
    average_messages_per_conversation: float
    average_response_time_hours: float
    
    # Top usuarios por mensajes
    top_message_senders: List[dict]
    
    class Config:
        from_attributes = True