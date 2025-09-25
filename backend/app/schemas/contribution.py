from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class ContributionStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DeliveryMethod(str, Enum):
    PICKUP = "pickup"
    DELIVERY = "delivery"
    SHIPPING = "shipping"
    DIGITAL = "digital"
    ON_SITE = "on_site"

# Esquemas para categorías de contribución
class ContributionCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class ContributionCategoryCreate(ContributionCategoryBase):
    pass

class ContributionCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class ContributionCategoryResponse(ContributionCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Esquemas para imágenes de contribución
class ContributionImageBase(BaseModel):
    filename: str
    original_filename: Optional[str] = None
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    is_primary: bool = False
    sort_order: int = 0

class ContributionImageResponse(ContributionImageBase):
    id: UUID
    contribution_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Esquemas para contribuciones
class ContributionBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10)
    category_id: UUID
    quantity: Optional[str] = Field(None, max_length=100)
    estimated_value: Optional[float] = Field(None, ge=0)
    currency: str = Field(default="EUR", max_length=3)
    destination: Optional[str] = None
    delivery_method: DeliveryMethod
    delivery_address: Optional[str] = None
    delivery_instructions: Optional[str] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = Field(None, max_length=50)

class ContributionCreate(ContributionBase):
    @validator('available_until')
    def validate_dates(cls, v, values):
        if v and 'available_from' in values and values['available_from']:
            if v <= values['available_from']:
                raise ValueError('La fecha de fin debe ser posterior a la fecha de inicio')
        return v

class ContributionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10)
    category_id: Optional[UUID] = None
    quantity: Optional[str] = Field(None, max_length=100)
    estimated_value: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    destination: Optional[str] = None
    delivery_method: Optional[DeliveryMethod] = None
    delivery_address: Optional[str] = None
    delivery_instructions: Optional[str] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    status: Optional[ContributionStatus] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = Field(None, max_length=50)

class ContributionResponse(ContributionBase):
    id: UUID
    company_id: UUID
    status: ContributionStatus
    views_count: int
    interested_count: int
    created_at: datetime
    updated_at: datetime
    
    # Relaciones
    category: ContributionCategoryResponse
    images: List[ContributionImageResponse] = []
    
    class Config:
        from_attributes = True

class ContributionListItem(BaseModel):
    id: UUID
    title: str
    description: str
    category_id: UUID
    category_name: str
    quantity: Optional[str]
    estimated_value: Optional[float]
    currency: str
    delivery_method: DeliveryMethod
    status: ContributionStatus
    views_count: int
    interested_count: int
    created_at: datetime
    company_name: str
    primary_image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class ContributionSearchParams(BaseModel):
    category_id: Optional[UUID] = None
    delivery_method: Optional[DeliveryMethod] = None
    status: Optional[ContributionStatus] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    city: Optional[str] = None
    is_recurring: Optional[bool] = None
    search_query: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

class ContributionSearchResponse(BaseModel):
    contributions: List[ContributionListItem]
    total: int
    page: int
    limit: int
    total_pages: int