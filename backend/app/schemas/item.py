from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from ..models.item import ItemCondition, ItemStatus

# Esquema base para ítem
class ItemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category_id: UUID
    condition: ItemCondition
    estimated_value: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Ubicación
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    # Configuraciones de intercambio
    is_available_for_exchange: bool = True
    accepts_cash_difference: bool = False
    max_cash_difference: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Preferencias de intercambio
    preferred_categories: Optional[List[UUID]] = Field(default=[])
    exchange_preferences: Optional[str] = Field(None, max_length=500)
    
    # Configuraciones de privacidad
    show_exact_location: bool = False
    is_featured: bool = False
    
    @validator('title')
    def validate_title(cls, v):
        return v.strip().title()
    
    @validator('description')
    def validate_description(cls, v):
        return v.strip()
    
    @validator('max_cash_difference')
    def validate_cash_difference(cls, v, values):
        if v is not None and not values.get('accepts_cash_difference', False):
            raise ValueError('No se puede establecer un monto máximo si no acepta diferencia en efectivo')
        return v
    
    @validator('preferred_categories')
    def validate_preferred_categories(cls, v):
        if v and len(v) > 5:
            raise ValueError('No se pueden seleccionar más de 5 categorías preferidas')
        return v or []

# Esquema para crear ítem
class ItemCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category_id: UUID
    condition: ItemCondition
    estimated_value: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Ubicación
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    # Configuraciones de intercambio
    is_available_for_exchange: bool = True
    accepts_cash_difference: bool = False
    max_cash_difference: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Preferencias de intercambio
    preferred_categories: Optional[List[UUID]] = Field(default=[])
    exchange_preferences: Optional[str] = Field(None, max_length=500)
    
    # Configuraciones de privacidad
    show_exact_location: bool = False
    is_featured: bool = False
    
    @validator('title')
    def validate_title(cls, v):
        return v.strip()
    
    @validator('description')
    def validate_description(cls, v):
        return v.strip()
    
    @validator('max_cash_difference')
    def validate_cash_difference(cls, v, values):
        if v is not None and not values.get('accepts_cash_difference', False):
            raise ValueError('No se puede establecer un monto máximo si no acepta diferencia en efectivo')
        return v
    
    @validator('preferred_categories')
    def validate_preferred_categories(cls, v):
        if v and len(v) > 5:
            raise ValueError('No se pueden seleccionar más de 5 categorías preferidas')
        return v or []

# Esquema para actualizar ítem
class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    category_id: Optional[UUID] = None
    condition: Optional[ItemCondition] = None
    estimated_value: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Ubicación
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    # Configuraciones de intercambio
    is_available_for_exchange: Optional[bool] = None
    accepts_cash_difference: Optional[bool] = None
    max_cash_difference: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    
    # Preferencias de intercambio
    preferred_categories: Optional[List[UUID]] = None
    exchange_preferences: Optional[str] = Field(None, max_length=500)
    
    # Configuraciones de privacidad
    show_exact_location: Optional[bool] = None
    is_featured: Optional[bool] = None
    
    @validator('title')
    def validate_title(cls, v):
        if v:
            return v.strip().title()
        return v
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            return v.strip()
        return v
    
    @validator('max_cash_difference')
    def validate_cash_difference(cls, v, values):
        if v is not None and not values.get('accepts_cash_difference', False):
            raise ValueError('No se puede establecer un monto máximo si no acepta diferencia en efectivo')
        return v
    
    @validator('preferred_categories')
    def validate_preferred_categories(cls, v):
        if v and len(v) > 5:
            raise ValueError('No se pueden seleccionar más de 5 categorías preferidas')
        return v

# Esquema para imagen de ítem
class ItemImageResponse(BaseModel):
    id: UUID
    url: str
    original_filename: str
    file_size: int
    width: Optional[int]
    height: Optional[int]
    is_primary: bool
    sort_order: int
    alt_text: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Esquema para respuesta de ítem
class ItemResponse(BaseModel):
    id: UUID
    title: str
    description: str
    category_id: UUID
    condition: ItemCondition
    estimated_value: Optional[Decimal]
    owner_id: UUID
    status: ItemStatus
    slug: str
    view_count: int
    interest_count: int
    created_at: datetime
    updated_at: datetime
    
    # Campos de ubicación del modelo real
    location_description: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    
    # Configuraciones de intercambio
    allow_partial_exchange: bool
    
    # Información del propietario
    owner: dict  # Información básica del usuario
    
    # Categoría
    category: dict  # Información básica de la categoría
    
    # Imágenes
    images: List[ItemImageResponse]
    
    # Información calculada
    distance_km: Optional[float] = None
    condition_display: str
    status_display: str
    
    class Config:
        from_attributes = True

# Esquema para lista de ítems (versión simplificada)
class ItemListItem(BaseModel):
    id: UUID
    title: str
    condition: ItemCondition
    estimated_value: Optional[Decimal]
    city: Optional[str]
    state: Optional[str]
    status: ItemStatus
    view_count: int
    interest_count: int
    created_at: datetime
    
    # Imagen principal
    primary_image_url: Optional[str]
    
    # Información del propietario
    owner_username: str
    owner_rating: Optional[float]
    
    # Categoría
    category_name: str
    category_icon: Optional[str]
    category_color: Optional[str]
    
    # Información calculada
    distance_km: Optional[float] = None
    condition_display: str
    status_display: str
    
    class Config:
        from_attributes = True

# Esquema para búsqueda de ítems
class ItemSearchParams(BaseModel):
    query: Optional[str] = Field(None, max_length=200)
    category_id: Optional[UUID] = None
    condition: Optional[ItemCondition] = None
    min_value: Optional[Decimal] = Field(None, ge=0)
    max_value: Optional[Decimal] = Field(None, ge=0)
    
    # Filtros de ubicación
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_km: Optional[int] = Field(None, ge=1, le=500)
    
    # Filtros de intercambio
    accepts_cash_difference: Optional[bool] = None
    available_only: bool = True
    
    # Filtros de tiempo
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    
    # Ordenamiento
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|updated_at|title|estimated_value|view_count|distance)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    
    # Paginación
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    
    @validator('max_value')
    def validate_value_range(cls, v, values):
        min_value = values.get('min_value')
        if v is not None and min_value is not None and v < min_value:
            raise ValueError('El valor máximo debe ser mayor que el valor mínimo')
        return v

# Esquema para respuesta de búsqueda de ítems
class ItemSearchResponse(BaseModel):
    items: List[ItemListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    # Información adicional de búsqueda
    search_params: dict
    suggested_categories: List[dict] = []
    nearby_cities: List[str] = []

# Esquema para ítems relacionados/similares
class RelatedItemsResponse(BaseModel):
    similar_items: List[ItemListItem]
    same_category_items: List[ItemListItem]
    same_owner_items: List[ItemListItem]
    nearby_items: List[ItemListItem]

# Esquema para estadísticas de ítem
class ItemStats(BaseModel):
    total_views: int
    unique_views: int
    total_interests: int
    exchange_requests: int
    days_since_created: int
    average_daily_views: float
    
    class Config:
        from_attributes = True

# Esquema para marcar interés en un ítem
class ItemInterestRequest(BaseModel):
    message: Optional[str] = Field(None, max_length=500)
    proposed_items: Optional[List[UUID]] = Field(default=[])
    
    @validator('proposed_items')
    def validate_proposed_items(cls, v):
        if v and len(v) > 3:
            raise ValueError('No se pueden proponer más de 3 ítems')
        return v or []

# Esquema para respuesta de interés
class ItemInterestResponse(BaseModel):
    success: bool
    message: str
    exchange_id: Optional[UUID] = None

# Esquema para reportar ítem
class ItemReportRequest(BaseModel):
    reason: str = Field(..., pattern="^(inappropriate|spam|fake|stolen|other)$")
    description: str = Field(..., min_length=10, max_length=500)
    
    @validator('description')
    def validate_description(cls, v):
        return v.strip()

# Esquema para favoritos
class ItemFavoriteResponse(BaseModel):
    is_favorite: bool
    total_favorites: int

# Esquema para subir imágenes
class ItemImageUploadResponse(BaseModel):
    id: UUID
    url: str
    thumbnail_url: str
    original_filename: str
    file_size: int
    width: int
    height: int
    is_primary: bool
    sort_order: int
    
    class Config:
        from_attributes = True

# Esquema para reordenar imágenes
class ItemImageReorderRequest(BaseModel):
    image_orders: List[dict] = Field(..., description="Lista de {id: UUID, sort_order: int}")
    
    @validator('image_orders')
    def validate_orders(cls, v):
        if not v:
            raise ValueError('Debe proporcionar al menos una imagen para reordenar')
        
        for item in v:
            if 'id' not in item or 'sort_order' not in item:
                raise ValueError('Cada elemento debe tener id y sort_order')
            if not isinstance(item['sort_order'], int) or item['sort_order'] < 0:
                raise ValueError('sort_order debe ser un entero no negativo')
        
        return v

# Esquema para actualizar imagen
class ItemImageUpdate(BaseModel):
    alt_text: Optional[str] = Field(None, max_length=200)
    is_primary: Optional[bool] = None

# Esquema para ítems del usuario
class UserItemsParams(BaseModel):
    status: Optional[ItemStatus] = None
    category_id: Optional[UUID] = None
    sort_by: Optional[str] = Field(default="created_at", pattern="^(created_at|updated_at|title|view_count)$")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

# Esquema para cambiar estado de ítem
class ItemStatusUpdate(BaseModel):
    status: ItemStatus
    reason: Optional[str] = Field(None, max_length=200)
    
    @validator('reason')
    def validate_reason(cls, v, values):
        status = values.get('status')
        if status in [ItemStatus.PAUSED, ItemStatus.REMOVED] and not v:
            raise ValueError('Se requiere una razón para pausar o remover un ítem')
        return v

# Esquema para duplicar ítem
class ItemDuplicateRequest(BaseModel):
    title_suffix: Optional[str] = Field(None, max_length=50)
    copy_images: bool = True
    
    @validator('title_suffix')
    def validate_suffix(cls, v):
        if v:
            return v.strip()
        return v

# Esquema para exportar ítems del usuario
class UserItemsExportRequest(BaseModel):
    format: str = Field(default="json", pattern="^(json|csv|xlsx)$")
    include_images: bool = Field(default=False)
    status_filter: Optional[List[ItemStatus]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None