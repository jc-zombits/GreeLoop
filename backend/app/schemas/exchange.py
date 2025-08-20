from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from ..models.exchange import ExchangeStatus

# Esquema base para intercambio
class ExchangeBase(BaseModel):
    requester_item_id: UUID
    owner_item_id: UUID
    message: Optional[str] = Field(None, max_length=1000)
    proposed_cash_difference: Optional[Decimal] = Field(None, decimal_places=2)
    
    @validator('message')
    def validate_message(cls, v):
        if v:
            return v.strip()
        return v
    
    @validator('proposed_cash_difference')
    def validate_cash_difference(cls, v):
        if v is not None and v < 0:
            raise ValueError('La diferencia en efectivo no puede ser negativa')
        return v

# Esquema para crear intercambio
class ExchangeCreate(ExchangeBase):
    pass

# Esquema para actualizar intercambio
class ExchangeUpdate(BaseModel):
    message: Optional[str] = Field(None, max_length=1000)
    proposed_cash_difference: Optional[Decimal] = Field(None, decimal_places=2)
    
    @validator('message')
    def validate_message(cls, v):
        if v:
            return v.strip()
        return v
    
    @validator('proposed_cash_difference')
    def validate_cash_difference(cls, v):
        if v is not None and v < 0:
            raise ValueError('La diferencia en efectivo no puede ser negativa')
        return v

# Esquema para responder a un intercambio
class ExchangeResponse(BaseModel):
    action: str = Field(..., pattern="^(accept|reject|counter)$")
    message: Optional[str] = Field(None, max_length=1000)
    counter_cash_difference: Optional[Decimal] = Field(None, decimal_places=2)
    
    @validator('message')
    def validate_message(cls, v):
        if v:
            return v.strip()
        return v
    
    @validator('counter_cash_difference')
    def validate_counter_cash(cls, v, values):
        if values.get('action') == 'counter' and v is None:
            raise ValueError('Se requiere una contraoferta de efectivo para una contrapropuesta')
        if v is not None and v < 0:
            raise ValueError('La diferencia en efectivo no puede ser negativa')
        return v

# Esquema para información de encuentro
class MeetingInfoUpdate(BaseModel):
    meeting_date: datetime
    meeting_location: str = Field(..., min_length=5, max_length=200)
    meeting_notes: Optional[str] = Field(None, max_length=500)
    
    @validator('meeting_date')
    def validate_meeting_date(cls, v):
        if v <= datetime.now():
            raise ValueError('La fecha del encuentro debe ser en el futuro')
        return v
    
    @validator('meeting_location')
    def validate_location(cls, v):
        return v.strip()
    
    @validator('meeting_notes')
    def validate_notes(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para confirmar encuentro
class MeetingConfirmation(BaseModel):
    confirmation_code: Optional[str] = Field(None, min_length=4, max_length=10)
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('notes')
    def validate_notes(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para finalizar intercambio
class ExchangeCompletion(BaseModel):
    completed: bool
    completion_notes: Optional[str] = Field(None, max_length=500)
    
    @validator('completion_notes')
    def validate_notes(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para cancelar intercambio
class ExchangeCancellation(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)
    
    @validator('reason')
    def validate_reason(cls, v):
        return v.strip()

# Esquema para información de ítem en intercambio
class ExchangeItemInfo(BaseModel):
    id: UUID
    title: str
    condition: str
    estimated_value: Optional[Decimal]
    primary_image_url: Optional[str]
    owner_id: UUID
    owner_username: str
    owner_rating: Optional[float]
    
    class Config:
        from_attributes = True

# Esquema para respuesta de intercambio
class ExchangeDetailResponse(BaseModel):
    id: UUID
    status: ExchangeStatus
    requester_id: UUID
    owner_id: UUID
    
    # Información de ítems
    requester_item: ExchangeItemInfo
    owner_item: ExchangeItemInfo
    
    # Detalles del intercambio
    initial_message: Optional[str]
    proposed_cash_difference: Optional[Decimal]
    final_cash_difference: Optional[Decimal]
    
    # Información del encuentro
    meeting_date: Optional[datetime]
    meeting_location: Optional[str]
    meeting_notes: Optional[str]
    requester_meeting_confirmed: bool
    owner_meeting_confirmed: bool
    
    # Finalización
    requester_completed: bool
    owner_completed: bool
    completion_notes: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    accepted_at: Optional[datetime]
    meeting_confirmed_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    
    # Estado calculado
    status_display: str
    can_cancel: bool
    can_confirm_meeting: bool
    can_complete: bool
    days_since_created: int
    
    class Config:
        from_attributes = True

# Esquema para lista de intercambios (versión simplificada)
class ExchangeListItem(BaseModel):
    id: UUID
    status: ExchangeStatus
    
    # Información básica de ítems
    requester_item_title: str
    requester_item_image: Optional[str]
    owner_item_title: str
    owner_item_image: Optional[str]
    
    # Información de usuarios
    other_user_id: UUID  # El otro usuario en el intercambio
    other_user_username: str
    other_user_rating: Optional[float]
    
    # Detalles importantes
    proposed_cash_difference: Optional[Decimal]
    meeting_date: Optional[datetime]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Estado calculado
    status_display: str
    requires_action: bool  # Si el usuario actual necesita tomar alguna acción
    days_since_created: int
    
    class Config:
        from_attributes = True

# Esquema para búsqueda de intercambios
class ExchangeSearchParams(BaseModel):
    status: Optional[ExchangeStatus] = None
    user_role: Optional[str] = Field(None, pattern="^(requester|owner|any)$")
    item_id: Optional[UUID] = None
    other_user_id: Optional[UUID] = None
    
    # Filtros de fecha
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    meeting_date_after: Optional[datetime] = None
    meeting_date_before: Optional[datetime] = None
    
    # Filtros de estado
    requires_action: Optional[bool] = None
    has_meeting_scheduled: Optional[bool] = None
    
    # Ordenamiento
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|updated_at|meeting_date|status)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

# Esquema para respuesta de búsqueda de intercambios
class ExchangeSearchResponse(BaseModel):
    exchanges: List[ExchangeListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Estadísticas adicionales
    status_counts: dict  # Conteo por estado
    pending_actions: int  # Intercambios que requieren acción del usuario

# Esquema para estadísticas de intercambios del usuario
class UserExchangeStats(BaseModel):
    total_exchanges: int
    completed_exchanges: int
    pending_exchanges: int
    cancelled_exchanges: int
    
    # Como solicitante
    as_requester_total: int
    as_requester_completed: int
    as_requester_success_rate: float
    
    # Como propietario
    as_owner_total: int
    as_owner_completed: int
    as_owner_success_rate: float
    
    # Estadísticas de tiempo
    average_completion_days: Optional[float]
    fastest_completion_days: Optional[int]
    
    # Estadísticas de valor
    total_value_exchanged: Optional[Decimal]
    average_exchange_value: Optional[Decimal]
    
    class Config:
        from_attributes = True

# Esquema para línea de tiempo del intercambio
class ExchangeTimelineEvent(BaseModel):
    id: UUID
    event_type: str
    title: str
    description: str
    user_id: Optional[UUID]
    user_username: Optional[str]
    created_at: datetime
    metadata: Optional[dict] = {}
    
    class Config:
        from_attributes = True

class ExchangeTimelineResponse(BaseModel):
    exchange_id: UUID
    events: List[ExchangeTimelineEvent]
    total_events: int

# Esquema para notificaciones de intercambio
class ExchangeNotificationSettings(BaseModel):
    email_new_request: bool = True
    email_status_change: bool = True
    email_meeting_reminder: bool = True
    push_new_request: bool = True
    push_status_change: bool = True
    push_meeting_reminder: bool = True
    
    class Config:
        from_attributes = True

# Esquema para reportar problema en intercambio
class ExchangeReportRequest(BaseModel):
    issue_type: str = Field(..., pattern="^(no_show|item_mismatch|safety_concern|fraud|other)$")
    description: str = Field(..., min_length=20, max_length=1000)
    evidence_urls: Optional[List[str]] = Field(default=[])
    
    @validator('description')
    def validate_description(cls, v):
        return v.strip()
    
    @validator('evidence_urls')
    def validate_evidence(cls, v):
        if v and len(v) > 5:
            raise ValueError('No se pueden adjuntar más de 5 evidencias')
        return v or []

# Esquema para respuesta de reporte
class ExchangeReportResponse(BaseModel):
    report_id: UUID
    message: str
    reference_number: str
    estimated_resolution_time: str

# Esquema para métricas de intercambios (admin)
class ExchangeMetrics(BaseModel):
    total_exchanges: int
    completed_exchanges: int
    cancelled_exchanges: int
    pending_exchanges: int
    
    completion_rate: float
    cancellation_rate: float
    average_completion_time_days: float
    
    # Métricas por período
    exchanges_this_month: int
    exchanges_last_month: int
    growth_rate: float
    
    # Métricas de valor
    total_value_exchanged: Decimal
    average_exchange_value: Decimal
    
    # Top categorías
    top_categories: List[dict]
    
    class Config:
        from_attributes = True

# Esquema para configuración de recordatorios
class ExchangeReminderSettings(BaseModel):
    meeting_reminder_hours: int = Field(default=24, ge=1, le=168)  # 1 hora a 1 semana
    completion_reminder_days: int = Field(default=3, ge=1, le=30)  # 1 día a 1 mes
    enable_meeting_reminders: bool = True
    enable_completion_reminders: bool = True
    
    class Config:
        from_attributes = True

# Esquema para sugerencias de intercambio
class ExchangeSuggestion(BaseModel):
    suggested_item_id: UUID
    suggested_item_title: str
    suggested_item_image: Optional[str]
    owner_id: UUID
    owner_username: str
    owner_rating: Optional[float]
    match_score: float  # 0.0 a 1.0
    match_reasons: List[str]
    distance_km: Optional[float]
    
    class Config:
        from_attributes = True

class ExchangeSuggestionsResponse(BaseModel):
    item_id: UUID
    suggestions: List[ExchangeSuggestion]
    total_suggestions: int
    search_radius_km: int