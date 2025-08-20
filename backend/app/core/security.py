from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

# Configurar el contexto de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configurar OAuth2
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scheme_name="JWT"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar que una contraseña en texto plano coincida con el hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generar hash de una contraseña"""
    return pwd_context.hash(password)

def create_access_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Crear un token de acceso JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(
    data: dict, 
    expires_delta: Optional[timedelta] = None
) -> str:
    """Crear un token de refresh JWT"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def verify_token(
    token: str, 
    token_type: str = "access"
) -> Optional[dict]:
    """Verificar y decodificar un token JWT"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Verificar que el tipo de token sea correcto
        if payload.get("type") != token_type:
            return None
            
        # Verificar que el token no haya expirado
        exp = payload.get("exp")
        if exp is None or datetime.now(timezone.utc) > datetime.fromtimestamp(exp, tz=timezone.utc):
            return None
            
        return payload
        
    except JWTError:
        return None

def get_user_id_from_token(token: str) -> Optional[str]:
    """Extraer el ID del usuario de un token JWT"""
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None

def validate_password(password: str) -> bool:
    """Validar que una contraseña cumpla con los requisitos mínimos"""
    if len(password) < 8:
        return False
    
    # Al menos una letra mayúscula
    if not any(c.isupper() for c in password):
        return False
    
    # Al menos una letra minúscula
    if not any(c.islower() for c in password):
        return False
    
    # Al menos un número
    if not any(c.isdigit() for c in password):
        return False
    
    return True

def get_password_requirements() -> dict:
    """Obtener los requisitos de contraseña para mostrar al usuario"""
    return {
        "min_length": 8,
        "requires_uppercase": True,
        "requires_lowercase": True,
        "requires_number": True,
        "requires_special_char": False
    }

# Excepciones personalizadas para autenticación
class AuthenticationError(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

class AuthorizationError(HTTPException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )