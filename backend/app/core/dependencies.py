from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import verify_token, AuthenticationError
from app.models.user import User
from app.models.admin_user import AdminUser
from app.core.config import settings

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scheme_name="JWT"
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Obtener el usuario actual basado en el token JWT"""
    
    # Verificar el token
    payload = verify_token(token, "access")
    if payload is None:
        raise AuthenticationError("Token inválido o expirado")
    
    # Extraer el ID del usuario
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise AuthenticationError("Token inválido")
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise AuthenticationError("ID de usuario inválido")
    
    # Buscar el usuario en la base de datos
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AuthenticationError("Usuario no encontrado")
    
    # Verificar que el usuario esté activo
    if not user.is_active:
        raise AuthenticationError("Usuario inactivo")
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Obtener el usuario actual y verificar que esté activo"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Obtener el usuario actual y verificar que tenga email verificado"""
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email no verificado"
        )
    return current_user

async def get_optional_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Obtener el usuario actual de forma opcional (puede ser None)"""
    # Extraer token del header Authorization
    authorization = request.headers.get("Authorization")
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    
    try:
        # Verificar el token
        payload = verify_token(token, "access")
        if payload is None:
            return None
        
        # Extraer el ID del usuario
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            return None
        
        # Buscar el usuario en la base de datos
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            return None
        
        return user
    except Exception:
        return None

async def require_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Requerir que el usuario actual sea administrador
    Se valida por:
    - Correo en la lista de propietarios/admins (ADMIN_EMAILS)
    - Registro en la tabla AdminUser
    """
    admin_emails = set(email.strip().lower() for email in settings.ADMIN_EMAILS)
    if current_user.email and current_user.email.lower() in admin_emails:
        return current_user

    # Verificar en la tabla de administradores adicionales
    from sqlalchemy import select
    result = await db.execute(select(AdminUser).where(AdminUser.user_id == current_user.id))
    admin_row = result.scalar_one_or_none()
    if admin_row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de administrador"
        )
    return current_user

def require_owner_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Requerir que el usuario sea el propietario (dueño) definido en ADMIN_EMAILS.
    Solo usuarios con correo en ADMIN_EMAILS pasan esta verificación.
    """
    admin_emails = set(email.strip().lower() for email in settings.ADMIN_EMAILS)
    if not current_user.email or current_user.email.lower() not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren privilegios de propietario"
        )
    return current_user

def get_pagination_params(
    skip: int = 0,
    limit: int = 20
) -> dict:
    """Obtener parámetros de paginación validados"""
    if skip < 0:
        skip = 0
    
    if limit <= 0:
        limit = 20
    elif limit > 100:
        limit = 100
    
    return {"skip": skip, "limit": limit}

def validate_uuid(uuid_str: str) -> UUID:
    """Validar y convertir string a UUID"""
    try:
        return UUID(uuid_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )