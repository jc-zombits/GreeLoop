from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

# Esquema base para calificación
class RatingBase(BaseModel):
    overall_rating: int = Field(..., ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    punctuality_rating: Optional[int] = Field(None, ge=1, le=5)
    item_condition_rating: Optional[int] = Field(None, ge=1, le=5)
    friendliness_rating: Optional[int] = Field(None, ge=1, le=5)
    
    comment: Optional[str] = Field(None, max_length=1000)
    would_exchange_again: Optional[bool] = None
    
    @validator('comment')
    def validate_comment(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para crear calificación
class RatingCreate(RatingBase):
    exchange_id: UUID
    rated_user_id: UUID

# Esquema para actualizar calificación
class RatingUpdate(BaseModel):
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    communication_rating: Optional[int] = Field(None, ge=1, le=5)
    punctuality_rating: Optional[int] = Field(None, ge=1, le=5)
    item_condition_rating: Optional[int] = Field(None, ge=1, le=5)
    friendliness_rating: Optional[int] = Field(None, ge=1, le=5)
    
    comment: Optional[str] = Field(None, max_length=1000)
    would_exchange_again: Optional[bool] = None
    
    @validator('comment')
    def validate_comment(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para respuesta de calificación
class RatingResponse(RatingBase):
    id: UUID
    rater_id: UUID
    rated_user_id: UUID
    exchange_id: UUID
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    
    # Información del calificador
    rater: dict  # Información básica del usuario
    
    # Información del calificado
    rated_user: dict  # Información básica del usuario
    
    # Información del intercambio
    exchange: dict  # Información básica del intercambio
    
    # Propiedades calculadas
    rating_stars: str  # Representación en estrellas
    recommendation_text: str
    
    class Config:
        from_attributes = True

# Esquema para lista de calificaciones (versión simplificada)
class RatingListItem(BaseModel):
    id: UUID
    overall_rating: int
    comment: Optional[str]
    would_exchange_again: Optional[bool]
    created_at: datetime
    
    # Información del calificador
    rater_username: str
    rater_avatar: Optional[str]
    
    # Información del intercambio
    exchange_item_title: str
    
    # Propiedades calculadas
    rating_stars: str
    recommendation_text: str
    
    class Config:
        from_attributes = True

# Esquema para búsqueda de calificaciones
class RatingSearchParams(BaseModel):
    user_id: Optional[UUID] = None  # Calificaciones recibidas por este usuario
    rater_id: Optional[UUID] = None  # Calificaciones dadas por este usuario
    exchange_id: Optional[UUID] = None
    
    # Filtros de calificación
    min_rating: Optional[int] = Field(None, ge=1, le=5)
    max_rating: Optional[int] = Field(None, ge=1, le=5)
    would_exchange_again: Optional[bool] = None
    has_comment: Optional[bool] = None
    
    # Filtros de fecha
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    
    # Ordenamiento
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|overall_rating|updated_at)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    
    @validator('max_rating')
    def validate_rating_range(cls, v, values):
        min_rating = values.get('min_rating')
        if v is not None and min_rating is not None and v < min_rating:
            raise ValueError('La calificación máxima debe ser mayor que la mínima')
        return v

# Esquema para respuesta de búsqueda de calificaciones
class RatingSearchResponse(BaseModel):
    ratings: List[RatingListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Estadísticas de la búsqueda
    average_rating: Optional[float]
    rating_distribution: dict  # {"1": count, "2": count, ...}
    recommendation_percentage: Optional[float]

# Esquema para estadísticas de calificaciones del usuario
class UserRatingStats(BaseModel):
    # Calificaciones recibidas
    total_ratings_received: int
    average_rating: Optional[float]
    
    # Distribución de calificaciones
    rating_distribution: dict  # {"1": count, "2": count, ...}
    
    # Calificaciones específicas promedio
    average_communication: Optional[float]
    average_punctuality: Optional[float]
    average_item_condition: Optional[float]
    average_friendliness: Optional[float]
    
    # Recomendaciones
    total_recommendations: int
    recommendation_percentage: Optional[float]
    
    # Calificaciones dadas
    total_ratings_given: int
    average_rating_given: Optional[float]
    
    # Tendencias
    recent_ratings_trend: str  # "improving", "declining", "stable"
    last_30_days_average: Optional[float]
    
    class Config:
        from_attributes = True

# Esquema detallado de estadísticas de calificaciones
class DetailedRatingStats(UserRatingStats):
    # Calificaciones por período
    ratings_this_month: int
    ratings_last_month: int
    ratings_this_year: int
    
    # Mejores y peores aspectos
    best_aspect: Optional[str]  # El aspecto mejor calificado
    worst_aspect: Optional[str]  # El aspecto peor calificado
    
    # Comparación con otros usuarios
    percentile_rank: Optional[float]  # Percentil en comparación con otros usuarios
    
    # Comentarios más frecuentes (palabras clave)
    common_positive_keywords: List[str]
    common_negative_keywords: List[str]
    
    class Config:
        from_attributes = True

# Esquema para respuesta de calificación pendiente
class PendingRatingResponse(BaseModel):
    exchange_id: UUID
    other_user_id: UUID
    other_user_username: str
    other_user_avatar: Optional[str]
    
    # Información del intercambio
    my_item_title: str
    other_item_title: str
    completed_at: datetime
    
    # Estado
    days_since_completion: int
    reminder_sent: bool
    
    class Config:
        from_attributes = True

# Esquema para lista de calificaciones pendientes
class PendingRatingsResponse(BaseModel):
    pending_ratings: List[PendingRatingResponse]
    total: int
    overdue_count: int  # Calificaciones pendientes por más de 7 días

# Esquema para recordatorio de calificación
class RatingReminderRequest(BaseModel):
    exchange_id: UUID
    message: Optional[str] = Field(None, max_length=200)
    
    @validator('message')
    def validate_message(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para reportar calificación
class RatingReportRequest(BaseModel):
    rating_id: UUID
    reason: str = Field(..., pattern="^(fake|inappropriate|spam|harassment|other)$")
    description: str = Field(..., min_length=10, max_length=500)
    
    @validator('description')
    def validate_description(cls, v):
        return v.strip()

# Esquema para respuesta de reporte
class RatingReportResponse(BaseModel):
    report_id: UUID
    message: str
    reference_number: str

# Esquema para configuración de calificaciones
class RatingSettings(BaseModel):
    email_rating_reminders: bool = True
    push_rating_reminders: bool = True
    
    # Configuraciones de privacidad
    show_ratings_publicly: bool = True
    allow_rating_comments: bool = True
    
    # Configuraciones de recordatorios
    reminder_frequency_days: int = Field(default=3, ge=1, le=14)
    max_reminders: int = Field(default=3, ge=1, le=10)
    
    class Config:
        from_attributes = True

# Esquema para actualizar configuración de calificaciones
class RatingSettingsUpdate(BaseModel):
    email_rating_reminders: Optional[bool] = None
    push_rating_reminders: Optional[bool] = None
    show_ratings_publicly: Optional[bool] = None
    allow_rating_comments: Optional[bool] = None
    reminder_frequency_days: Optional[int] = Field(None, ge=1, le=14)
    max_reminders: Optional[int] = Field(None, ge=1, le=10)

# Esquema para análisis de sentimientos de calificaciones
class RatingSentimentAnalysis(BaseModel):
    rating_id: UUID
    sentiment_score: float  # -1.0 (muy negativo) a 1.0 (muy positivo)
    sentiment_label: str  # "positive", "negative", "neutral"
    confidence: float  # 0.0 a 1.0
    
    # Palabras clave extraídas
    positive_keywords: List[str]
    negative_keywords: List[str]
    neutral_keywords: List[str]
    
    class Config:
        from_attributes = True

# Esquema para métricas de calificaciones (admin)
class RatingMetrics(BaseModel):
    total_ratings: int
    ratings_this_month: int
    ratings_last_month: int
    growth_rate: float
    
    # Distribución general
    overall_average_rating: float
    rating_distribution: dict
    
    # Métricas de calidad
    ratings_with_comments_percentage: float
    positive_recommendations_percentage: float
    
    # Usuarios más activos
    top_raters: List[dict]
    top_rated_users: List[dict]
    
    # Tendencias
    rating_trends: dict  # Tendencias por mes
    
    class Config:
        from_attributes = True

# Esquema para exportar calificaciones
class RatingExportRequest(BaseModel):
    user_id: Optional[UUID] = None  # Si no se especifica, exporta todas
    format: str = Field(default="json", pattern="^(json|csv|xlsx)$")
    include_comments: bool = True
    include_sentiment_analysis: bool = False
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class RatingExportResponse(BaseModel):
    download_url: str
    filename: str
    format: str
    expires_at: datetime
    rating_count: int
    file_size: int

# Esquema para respuesta de calificación mutua
class MutualRatingStatus(BaseModel):
    exchange_id: UUID
    my_rating_given: bool
    other_rating_given: bool
    both_completed: bool
    
    # Información de las calificaciones si existen
    my_rating: Optional[RatingResponse] = None
    other_rating: Optional[RatingResponse] = None
    
    class Config:
        from_attributes = True

# Esquema para sugerencias de mejora basadas en calificaciones
class RatingImprovementSuggestions(BaseModel):
    user_id: UUID
    overall_score: float
    
    # Áreas de mejora
    improvement_areas: List[dict]  # [{"area": "communication", "score": 3.2, "suggestion": "..."}]
    
    # Fortalezas
    strengths: List[dict]  # [{"area": "punctuality", "score": 4.8, "praise": "..."}]
    
    # Recomendaciones específicas
    action_items: List[str]
    
    class Config:
        from_attributes = True