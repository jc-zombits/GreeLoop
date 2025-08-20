from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ..models.notification import NotificationType, NotificationPriority

# Esquema base para notificación
class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    
    # URLs y acciones
    action_url: Optional[str] = Field(None, max_length=500)
    action_text: Optional[str] = Field(None, max_length=100)
    
    # Metadatos
    metadata: Optional[dict] = {}
    
    # Referencias a entidades
    related_user_id: Optional[UUID] = None
    related_item_id: Optional[UUID] = None
    related_exchange_id: Optional[UUID] = None
    
    @validator('title')
    def validate_title(cls, v):
        return v.strip()
    
    @validator('message')
    def validate_message(cls, v):
        return v.strip()
    
    @validator('action_text')
    def validate_action_text(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para crear notificación
class NotificationCreate(NotificationBase):
    user_id: UUID

# Esquema para crear notificación masiva
class BulkNotificationCreate(BaseModel):
    user_ids: List[UUID] = Field(..., min_items=1, max_items=1000)
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    
    # URLs y acciones
    action_url: Optional[str] = Field(None, max_length=500)
    action_text: Optional[str] = Field(None, max_length=100)
    
    # Configuración de entrega
    send_email: bool = False
    send_push: bool = True
    send_sms: bool = False
    
    # Programación
    schedule_for: Optional[datetime] = None
    
    @validator('title')
    def validate_title(cls, v):
        return v.strip()
    
    @validator('message')
    def validate_message(cls, v):
        return v.strip()
    
    @validator('schedule_for')
    def validate_schedule(cls, v):
        if v and v <= datetime.now():
            raise ValueError('La fecha de programación debe ser en el futuro')
        return v

# Esquema para respuesta de notificación
class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    
    # Estado
    is_read: bool
    is_deleted: bool
    
    # Configuración de entrega
    email_sent: bool
    push_sent: bool
    sms_sent: bool
    
    # Estado de entrega
    email_delivered: Optional[bool]
    push_delivered: Optional[bool]
    sms_delivered: Optional[bool]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    read_at: Optional[datetime]
    expires_at: Optional[datetime]
    
    # Información relacionada
    related_user: Optional[dict] = None
    related_item: Optional[dict] = None
    related_exchange: Optional[dict] = None
    
    # Propiedades calculadas
    is_expired: bool
    priority_display: str
    type_display: str
    time_ago: str
    
    class Config:
        from_attributes = True

# Esquema para lista de notificaciones (versión simplificada)
class NotificationListItem(BaseModel):
    id: UUID
    title: str
    message: str
    notification_type: NotificationType
    priority: NotificationPriority
    
    # Estado
    is_read: bool
    
    # URLs y acciones
    action_url: Optional[str]
    action_text: Optional[str]
    
    # Timestamps
    created_at: datetime
    
    # Propiedades calculadas
    priority_display: str
    type_display: str
    time_ago: str
    
    class Config:
        from_attributes = True

# Esquema para búsqueda de notificaciones
class NotificationSearchParams(BaseModel):
    notification_type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    is_read: Optional[bool] = None
    is_expired: Optional[bool] = None
    
    # Filtros de entidades relacionadas
    related_user_id: Optional[UUID] = None
    related_item_id: Optional[UUID] = None
    related_exchange_id: Optional[UUID] = None
    
    # Filtros de fecha
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    
    # Ordenamiento
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|priority|notification_type)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

# Esquema para respuesta de búsqueda de notificaciones
class NotificationSearchResponse(BaseModel):
    notifications: List[NotificationListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Estadísticas
    unread_count: int
    high_priority_count: int
    expired_count: int

# Esquema para marcar notificaciones como leídas
class MarkNotificationsReadRequest(BaseModel):
    notification_ids: Optional[List[UUID]] = None
    mark_all: bool = False
    notification_type: Optional[NotificationType] = None
    
    @validator('notification_ids')
    def validate_notification_ids(cls, v, values):
        if not values.get('mark_all') and not values.get('notification_type') and not v:
            raise ValueError('Debe especificar notification_ids, notification_type o mark_all')
        return v

# Esquema para eliminar notificaciones
class DeleteNotificationsRequest(BaseModel):
    notification_ids: Optional[List[UUID]] = None
    delete_all_read: bool = False
    delete_expired: bool = False
    older_than_days: Optional[int] = Field(None, ge=1, le=365)
    
    @validator('notification_ids')
    def validate_request(cls, v, values):
        if not any([v, values.get('delete_all_read'), values.get('delete_expired'), values.get('older_than_days')]):
            raise ValueError('Debe especificar al menos un criterio de eliminación')
        return v

# Esquema para respuesta de eliminación
class DeleteNotificationsResponse(BaseModel):
    deleted_count: int
    message: str

# Esquema para estadísticas de notificaciones del usuario
class UserNotificationStats(BaseModel):
    total_notifications: int
    unread_notifications: int
    read_notifications: int
    
    # Por tipo
    exchange_notifications: int
    message_notifications: int
    rating_notifications: int
    system_notifications: int
    
    # Por prioridad
    high_priority_notifications: int
    normal_priority_notifications: int
    low_priority_notifications: int
    
    # Estadísticas de tiempo
    notifications_today: int
    notifications_this_week: int
    notifications_this_month: int
    
    # Estadísticas de entrega
    email_delivery_rate: Optional[float]
    push_delivery_rate: Optional[float]
    
    class Config:
        from_attributes = True

# Esquema para configuración de notificaciones
class NotificationSettings(BaseModel):
    # Configuraciones generales
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    
    # Configuraciones por tipo
    exchange_notifications: bool = True
    message_notifications: bool = True
    rating_notifications: bool = True
    system_notifications: bool = True
    marketing_notifications: bool = False
    
    # Configuraciones de horario
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM
    quiet_hours_end: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM
    
    # Configuraciones de frecuencia
    digest_frequency: str = Field(default="daily", pattern="^(never|daily|weekly)$")
    max_notifications_per_day: int = Field(default=50, ge=1, le=200)
    
    class Config:
        from_attributes = True

# Esquema para actualizar configuración de notificaciones
class NotificationSettingsUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None
    
    exchange_notifications: Optional[bool] = None
    message_notifications: Optional[bool] = None
    rating_notifications: Optional[bool] = None
    system_notifications: Optional[bool] = None
    marketing_notifications: Optional[bool] = None
    
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    quiet_hours_end: Optional[str] = Field(None, pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    
    digest_frequency: Optional[str] = Field(None, pattern="^(never|daily|weekly)$")
    max_notifications_per_day: Optional[int] = Field(None, ge=1, le=200)

# Esquema para suscripción push
class PushSubscriptionRequest(BaseModel):
    endpoint: str = Field(..., max_length=500)
    keys: dict = Field(..., description="Claves de suscripción push")
    device_info: Optional[dict] = {}
    
    @validator('keys')
    def validate_keys(cls, v):
        required_keys = ['p256dh', 'auth']
        if not all(key in v for key in required_keys):
            raise ValueError('Las claves deben incluir p256dh y auth')
        return v

# Esquema para respuesta de suscripción
class PushSubscriptionResponse(BaseModel):
    subscription_id: UUID
    message: str
    expires_at: Optional[datetime]

# Esquema para plantilla de notificación
class NotificationTemplate(BaseModel):
    id: UUID
    name: str
    notification_type: NotificationType
    title_template: str
    message_template: str
    
    # Variables disponibles
    available_variables: List[str]
    
    # Configuración
    is_active: bool
    priority: NotificationPriority
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Esquema para crear plantilla de notificación
class NotificationTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    notification_type: NotificationType
    title_template: str = Field(..., min_length=1, max_length=200)
    message_template: str = Field(..., min_length=1, max_length=1000)
    priority: NotificationPriority = NotificationPriority.NORMAL
    
    @validator('name')
    def validate_name(cls, v):
        return v.strip()

# Esquema para métricas de notificaciones (admin)
class NotificationMetrics(BaseModel):
    total_notifications: int
    notifications_today: int
    notifications_this_week: int
    notifications_this_month: int
    
    # Métricas por tipo
    type_distribution: dict  # {"exchange": count, "message": count, ...}
    
    # Métricas de entrega
    email_delivery_rate: float
    push_delivery_rate: float
    sms_delivery_rate: float
    
    # Métricas de engagement
    read_rate: float
    click_through_rate: float
    
    # Usuarios más activos
    top_notification_receivers: List[dict]
    
    # Tendencias
    notification_trends: dict  # Tendencias por día/semana
    
    class Config:
        from_attributes = True

# Esquema para resumen de notificaciones
class NotificationDigest(BaseModel):
    user_id: UUID
    digest_type: str  # "daily", "weekly"
    period_start: datetime
    period_end: datetime
    
    # Resumen de actividad
    total_notifications: int
    unread_notifications: int
    
    # Notificaciones por tipo
    exchange_updates: List[dict]
    new_messages: List[dict]
    new_ratings: List[dict]
    system_updates: List[dict]
    
    # Estadísticas del período
    new_exchanges: int
    completed_exchanges: int
    new_items_in_area: int
    
    class Config:
        from_attributes = True

# Esquema para programar notificación
class ScheduledNotificationCreate(BaseModel):
    user_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    
    # Programación
    scheduled_for: datetime
    timezone: str = Field(default="UTC", max_length=50)
    
    # Configuración de entrega
    send_email: bool = False
    send_push: bool = True
    send_sms: bool = False
    
    @validator('scheduled_for')
    def validate_schedule(cls, v):
        if v <= datetime.now():
            raise ValueError('La fecha de programación debe ser en el futuro')
        return v

# Esquema para respuesta de notificación programada
class ScheduledNotificationResponse(BaseModel):
    id: UUID
    scheduled_for: datetime
    status: str  # "pending", "sent", "failed", "cancelled"
    created_at: datetime
    sent_at: Optional[datetime]
    
    class Config:
        from_attributes = True