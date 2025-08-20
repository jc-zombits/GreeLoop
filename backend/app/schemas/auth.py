from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

# Esquema para login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False
    device_info: Optional[str] = None

# Esquema para registro
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    confirm_password: str
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    
    # Ubicación básica
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    
    # Aceptación de términos
    accept_terms: bool = Field(..., description="Debe aceptar los términos y condiciones")
    accept_privacy: bool = Field(..., description="Debe aceptar la política de privacidad")
    
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
    
    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
        return v.lower()
    
    @validator('accept_terms')
    def terms_must_be_accepted(cls, v):
        if not v:
            raise ValueError('Debe aceptar los términos y condiciones')
        return v
    
    @validator('accept_privacy')
    def privacy_must_be_accepted(cls, v):
        if not v:
            raise ValueError('Debe aceptar la política de privacidad')
        return v

# Esquema para respuesta de tokens
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Segundos hasta la expiración
    user: dict  # Información básica del usuario

# Esquema para refresh token
class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Esquema para logout
class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
    logout_all_devices: bool = False

# Esquema para verificación de email
class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirm(BaseModel):
    token: str
    email: EmailStr

# Esquema para recuperación de contraseña
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    email: EmailStr
    new_password: str = Field(..., min_length=8)
    confirm_password: str
    
    @validator('confirm_password')
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

# Esquema para cambio de contraseña (usuario autenticado)
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str
    
    @validator('confirm_password')
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

# Esquema para información de sesión
class SessionInfo(BaseModel):
    id: UUID
    device_name: str
    location: str
    ip_address: Optional[str]
    is_current: bool
    created_at: datetime
    last_activity: datetime
    expires_at: datetime
    is_expired: bool
    time_until_expiry_hours: int
    
    class Config:
        from_attributes = True

# Esquema para lista de sesiones activas
class ActiveSessionsResponse(BaseModel):
    sessions: list[SessionInfo]
    total_sessions: int
    current_session_id: UUID

# Esquema para revocar sesión
class RevokeSessionRequest(BaseModel):
    session_id: UUID

# Esquema para verificación de token
class TokenVerificationResponse(BaseModel):
    valid: bool
    user_id: Optional[UUID] = None
    expires_at: Optional[datetime] = None
    token_type: Optional[str] = None

# Esquema para respuesta de autenticación exitosa
class AuthSuccessResponse(BaseModel):
    message: str
    user: dict
    tokens: TokenResponse
    session_info: SessionInfo

# Esquema para respuesta de error de autenticación
class AuthErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[dict] = None

# Esquema para validación de disponibilidad
class UsernameAvailabilityCheck(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    
    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
        return v.lower()

class EmailAvailabilityCheck(BaseModel):
    email: EmailStr

class AvailabilityResponse(BaseModel):
    available: bool
    message: str

# Esquema para configuración de autenticación de dos factores (2FA)
class TwoFactorSetupRequest(BaseModel):
    password: str  # Contraseña actual para confirmar

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    backup_codes: list[str]

class TwoFactorConfirmRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    
    @validator('code')
    def validate_code(cls, v):
        if not v.isdigit():
            raise ValueError('El código debe contener solo números')
        return v

class TwoFactorLoginRequest(LoginRequest):
    two_factor_code: str = Field(..., min_length=6, max_length=6)
    
    @validator('two_factor_code')
    def validate_code(cls, v):
        if not v.isdigit():
            raise ValueError('El código debe contener solo números')
        return v

# Esquema para respuesta de estado de autenticación
class AuthStatusResponse(BaseModel):
    authenticated: bool
    user_id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    expires_at: Optional[datetime] = None
    requires_email_verification: bool = False
    requires_two_factor: bool = False
    
    class Config:
        from_attributes = True

# Esquema para configuración de seguridad
class SecuritySettings(BaseModel):
    two_factor_enabled: bool
    email_notifications_security: bool
    login_notifications: bool
    suspicious_activity_alerts: bool
    
    class Config:
        from_attributes = True

class SecuritySettingsUpdate(BaseModel):
    email_notifications_security: Optional[bool] = None
    login_notifications: Optional[bool] = None
    suspicious_activity_alerts: Optional[bool] = None