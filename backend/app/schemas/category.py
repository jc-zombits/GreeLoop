from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from uuid import UUID

# Esquema base para categoría
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)  # Código de color hex
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True
    sort_order: int = Field(default=0, ge=0)
    
    @validator('color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            raise ValueError('El color debe ser un código hexadecimal válido que comience con #')
        if v and len(v) != 7:
            raise ValueError('El color debe tener exactamente 7 caracteres (#RRGGBB)')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        return v.strip().title()

# Esquema para crear categoría
class CategoryCreate(CategoryBase):
    pass

# Esquema para actualizar categoría
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=7)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)
    
    @validator('color')
    def validate_color(cls, v):
        if v and not v.startswith('#'):
            raise ValueError('El color debe ser un código hexadecimal válido que comience con #')
        if v and len(v) != 7:
            raise ValueError('El color debe tener exactamente 7 caracteres (#RRGGBB)')
        return v
    
    @validator('name')
    def validate_name(cls, v):
        if v:
            return v.strip().title()
        return v

# Esquema para respuesta de categoría
class CategoryResponse(CategoryBase):
    id: UUID
    slug: str
    item_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Esquema para lista de categorías (versión simplificada)
class CategoryListItem(BaseModel):
    id: UUID
    name: str
    slug: str
    icon: Optional[str]
    color: Optional[str]
    image_url: Optional[str]
    item_count: int
    is_active: bool
    sort_order: int
    
    class Config:
        from_attributes = True

# Esquema para categorías populares
class PopularCategory(BaseModel):
    id: UUID
    name: str
    slug: str
    icon: Optional[str]
    color: Optional[str]
    image_url: Optional[str]
    item_count: int
    recent_items_count: int  # Ítems agregados en los últimos 30 días
    
    class Config:
        from_attributes = True

# Esquema para estadísticas de categoría
class CategoryStats(BaseModel):
    total_items: int
    active_items: int
    completed_exchanges: int
    pending_exchanges: int
    average_item_value: Optional[float]
    most_common_condition: Optional[str]
    recent_activity: int  # Actividad en los últimos 7 días
    
    class Config:
        from_attributes = True

# Esquema detallado de categoría con estadísticas
class CategoryDetailResponse(CategoryResponse):
    stats: CategoryStats
    recent_items: list[dict]  # Lista simplificada de ítems recientes
    
    class Config:
        from_attributes = True

# Esquema para búsqueda de categorías
class CategorySearchParams(BaseModel):
    query: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    has_items: Optional[bool] = None  # Solo categorías con ítems
    sort_by: Optional[str] = Field(default="name", pattern="^(name|item_count|created_at|sort_order)$")
    sort_order: Optional[str] = Field(default="asc", pattern="^(asc|desc)$")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

# Esquema para respuesta de búsqueda de categorías
class CategorySearchResponse(BaseModel):
    categories: list[CategoryListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

# Esquema para reordenar categorías
class CategoryReorderRequest(BaseModel):
    category_orders: list[dict] = Field(..., description="Lista de {id: UUID, sort_order: int}")
    
    @validator('category_orders')
    def validate_orders(cls, v):
        if not v:
            raise ValueError('Debe proporcionar al menos una categoría para reordenar')
        
        # Verificar que cada elemento tenga id y sort_order
        for item in v:
            if 'id' not in item or 'sort_order' not in item:
                raise ValueError('Cada elemento debe tener id y sort_order')
            if not isinstance(item['sort_order'], int) or item['sort_order'] < 0:
                raise ValueError('sort_order debe ser un entero no negativo')
        
        return v

# Esquema para importar categorías por defecto
class DefaultCategoriesImport(BaseModel):
    overwrite_existing: bool = Field(default=False, description="Sobrescribir categorías existentes")
    categories_to_import: Optional[list[str]] = Field(None, description="Lista de nombres de categorías específicas a importar")

# Esquema para respuesta de importación
class ImportResponse(BaseModel):
    success: bool
    message: str
    imported_count: int
    skipped_count: int
    errors: list[str] = []
    imported_categories: list[CategoryListItem] = []

# Esquema para validación de slug
class CategorySlugCheck(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    exclude_id: Optional[UUID] = None  # Para excluir una categoría específica en actualizaciones

class SlugAvailabilityResponse(BaseModel):
    available: bool
    suggested_slug: str
    message: str

# Esquema para categorías con jerarquía (para futuras expansiones)
class CategoryHierarchy(BaseModel):
    id: UUID
    name: str
    slug: str
    icon: Optional[str]
    color: Optional[str]
    item_count: int
    parent_id: Optional[UUID] = None
    children: list['CategoryHierarchy'] = []
    level: int = 0
    
    class Config:
        from_attributes = True

# Permitir referencias circulares para CategoryHierarchy
CategoryHierarchy.model_rebuild()

# Esquema para exportar categorías
class CategoryExportFormat(BaseModel):
    format: str = Field(default="json", pattern="^(json|csv|xlsx)$")
    include_stats: bool = Field(default=True)
    include_inactive: bool = Field(default=False)
    fields: Optional[list[str]] = Field(None, description="Campos específicos a exportar")

# Esquema para respuesta de exportación
class CategoryExportResponse(BaseModel):
    download_url: str
    filename: str
    format: str
    expires_at: datetime
    file_size: int  # En bytes
    record_count: int