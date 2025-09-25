from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class CompanyLoginRequest(BaseModel):
    email: EmailStr
    password: str

class CompanyRegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str
    company_name: str = Field(..., min_length=2, max_length=100)
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    contact_name: Optional[str] = None
    contact_position: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    collaboration_type: Optional[str] = None
    accept_terms: bool = Field(...)
    accept_privacy: bool = Field(...)
    
    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'password' in values and v != values['password']:
            raise ValueError('Las contraseñas no coinciden')
        return v

class CompanySessionInfo(BaseModel):
    id: uuid.UUID
    device_name: Optional[str] = None
    location_display: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_activity: datetime
    time_until_expiry_hours: float
    
    class Config:
        orm_mode = True

class CompanyTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Segundos hasta expiración
    company: Dict[str, Any]  # Información de la empresa
    session_info: CompanySessionInfo
    message: Optional[str] = None

class CompanyTokenRefreshRequest(BaseModel):
    refresh_token: str

class CompanyTokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # Segundos hasta expiración

class CompanyLogoutRequest(BaseModel):
    refresh_token: Optional[str] = None  # Si se proporciona, solo se cierra esa sesión
    all_sessions: bool = False  # Si es True, se cierran todas las sesiones

class CompanyLogoutResponse(BaseModel):
    message: str
    sessions_closed: int