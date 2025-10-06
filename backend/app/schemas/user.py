from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Esquemas base
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    
    # Ubicación
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    # Configuraciones de privacidad
    show_phone: bool = False
    show_email: bool = False
    show_location: bool = True
    
    # Configuraciones de notificaciones
    email_notifications: bool = True
    push_notifications: bool = True
    sms_notifications: bool = False
    
    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
        return v.lower()
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is not None:
            # Remover espacios y caracteres especiales
            cleaned = ''.join(filter(str.isdigit, v))
            if len(cleaned) < 10:
                raise ValueError('El número de teléfono debe tener al menos 10 dígitos')
        return v

# Esquema para crear usuario
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('Las contraseñas no coinciden')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

# Esquema para actualizar usuario
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = Field(None, max_length=500)
    
    # Ubicación
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    # Configuraciones de privacidad
    show_phone: Optional[bool] = None
    show_email: Optional[bool] = None
    show_location: Optional[bool] = None
    
    # Configuraciones de notificaciones
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None

    # Estado de la cuenta
    is_active: Optional[bool] = None

# Esquema para cambiar contraseña
class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_new_password: str
    
    @validator('confirm_new_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Las contraseñas no coinciden')
        return v
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

# Esquema de respuesta básico
class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Ubicación (respetando configuraciones de privacidad)
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Estado de la cuenta
    is_active: bool
    email_verified: bool
    phone_verified: bool
    # Rol
    is_admin: bool = False
    
    # Estadísticas públicas
    reputation_score: float
    total_exchanges: int
    successful_exchanges: int
    success_rate: float
    
    # Timestamps
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Esquema de respuesta detallado (para el propio usuario)
class UserDetailResponse(UserResponse):
    # Información adicional solo para el propio usuario
    address: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Configuraciones de privacidad
    show_phone: bool
    show_email: bool
    show_location: bool
    
    # Configuraciones de notificaciones
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    
    # Timestamps adicionales
    updated_at: datetime

# Esquema para perfil público
class UserPublicProfile(BaseModel):
    id: UUID
    username: str
    first_name: str
    last_name: str
    full_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Ubicación (solo si el usuario permite mostrarla)
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    
    # Estadísticas públicas
    reputation_score: float
    total_exchanges: int
    successful_exchanges: int
    success_rate: float
    
    # Información de contacto (solo si el usuario permite mostrarla)
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Fecha de registro (solo mes y año)
    member_since: str  # Formato: "Enero 2024"
    
    class Config:
        from_attributes = True

# Esquema para lista de usuarios
class UserListItem(BaseModel):
    id: UUID
    username: str
    first_name: str
    last_name: str
    full_name: str
    avatar_url: Optional[str] = None
    city: Optional[str] = None
    is_active: bool
    reputation_score: float
    total_exchanges: int
    
    class Config:
        from_attributes = True

# Esquema para estadísticas de usuario
class UserStats(BaseModel):
    total_items: int
    active_items: int
    total_exchanges: int
    successful_exchanges: int
    pending_exchanges: int
    success_rate: float
    reputation_score: float
    total_ratings: int
    average_rating: float
    
    class Config:
        from_attributes = True

# Esquema para verificación de email
class EmailVerification(BaseModel):
    token: str

# Esquema para recuperación de contraseña
class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Las contraseñas no coinciden')
        return v

# Esquema para búsqueda de usuarios
class UserSearchParams(BaseModel):
    query: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    min_reputation: Optional[float] = Field(None, ge=0, le=5)
    min_exchanges: Optional[int] = Field(None, ge=0)
    sort_by: Optional[str] = Field("reputation", pattern="^(reputation|exchanges|created_at|username)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

# Esquema para respuesta de búsqueda
class UserSearchResponse(BaseModel):
    users: List[UserListItem]
    total: int
    skip: int
    limit: int
    has_more: bool
    
    class Config:
        from_attributes = True