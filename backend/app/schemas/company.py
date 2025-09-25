from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import re

class CompanyBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    company_name: str = Field(..., min_length=2, max_length=100)
    
    # Campos opcionales
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    
    # Información de contacto
    contact_name: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    
    # Ubicación
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Tipo de colaboración
    collaboration_type: Optional[str] = None

class CompanyCreate(CompanyBase):
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    accept_terms: bool = Field(...)
    accept_privacy: bool = Field(...)
    
    @validator('password')
    def password_strength(cls, v):
        # Verificar que la contraseña tenga al menos 8 caracteres
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        
        # Verificar que la contraseña tenga al menos una letra mayúscula
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe tener al menos una letra mayúscula')
        
        # Verificar que la contraseña tenga al menos una letra minúscula
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe tener al menos una letra minúscula')
        
        # Verificar que la contraseña tenga al menos un número
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe tener al menos un número')
        
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Las contraseñas no coinciden')
        return v
    
    @validator('accept_terms')
    def terms_accepted(cls, v):
        if not v:
            raise ValueError('Debes aceptar los términos y condiciones')
        return v
    
    @validator('accept_privacy')
    def privacy_accepted(cls, v):
        if not v:
            raise ValueError('Debes aceptar la política de privacidad')
        return v

class CompanyResponse(CompanyBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    email_verified: bool
    phone_verified: bool
    reputation_score: float
    total_exchanges: int
    successful_exchanges: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class CompanyPublicProfile(BaseModel):
    id: uuid.UUID
    username: str
    company_name: str
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    reputation_score: float
    total_exchanges: int
    successful_exchanges: int
    is_verified: bool
    collaboration_type: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

class CompanyListItem(BaseModel):
    id: uuid.UUID
    username: str
    company_name: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    reputation_score: float
    is_verified: bool
    collaboration_type: Optional[str] = None
    
    class Config:
        orm_mode = True

class CompanyStats(BaseModel):
    reputation_score: float
    total_exchanges: int
    successful_exchanges: int
    
    class Config:
        orm_mode = True

class CompanySearchParams(BaseModel):
    query: Optional[str] = None
    industry: Optional[str] = None
    collaboration_type: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    verified_only: Optional[bool] = False
    page: int = 1
    limit: int = 10

class CompanySearchResponse(BaseModel):
    items: List[CompanyListItem]
    total: int
    page: int
    limit: int
    pages: int