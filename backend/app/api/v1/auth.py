from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timedelta
import traceback
import logging

from app.core.database import get_db
from app.core.security import (
    verify_password, 
    create_access_token, 
    create_refresh_token,
    verify_token,
    get_password_hash
)
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.user_session import UserSession
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    RefreshTokenRequest,
    LogoutRequest,
    EmailVerificationRequest,
    EmailVerificationConfirm,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChangeRequest,
    AuthSuccessResponse,
    AuthErrorResponse,
    UsernameAvailabilityCheck,
    EmailAvailabilityCheck,
    AvailabilityResponse,
    AuthStatusResponse,
    ActiveSessionsResponse,
    RevokeSessionRequest
)
from app.schemas.user import UserResponse

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_client_info(request: Request) -> dict:
    """Extraer información del cliente para sesiones"""
    return {
        "user_agent": request.headers.get("user-agent", "Unknown"),
        "ip_address": request.client.host if request.client else "Unknown",
        "device_info": request.headers.get("x-device-info", "Unknown")
    }


@router.post("/register", response_model=AuthSuccessResponse)
async def register(
    user_data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Registrar un nuevo usuario"""
    logger = logging.getLogger(__name__)
    
    try:
        # Verificar si el email ya existe
        existing_user_stmt = select(User).where(User.email == user_data.email)
        result = await db.execute(existing_user_stmt)
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # Verificar si el username ya existe
        existing_username_stmt = select(User).where(User.username == user_data.username)
        result = await db.execute(existing_username_stmt)
        existing_username = result.scalar_one_or_none()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        
        # Crear nuevo usuario
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            city=user_data.city,
            state=user_data.state,
            country=user_data.country,
            is_active=True,
            email_verified=False  # Requerirá verificación
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Crear tokens
        access_token = create_access_token(data={"sub": str(new_user.id)})
        refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
        
        # Crear sesión
        client_info = get_client_info(request)
        session = UserSession.create_session(
            user_id=new_user.id,
            access_token=access_token,
            refresh_token=refresh_token,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Preparar respuesta
        user_dict = {
            "id": str(new_user.id),
            "email": new_user.email,
            "username": new_user.username,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "phone": new_user.phone,
            "city": new_user.city,
            "country": new_user.country,
            "is_active": new_user.is_active,
            "email_verified": new_user.email_verified,
            "created_at": new_user.created_at.isoformat()
        }
        
        tokens = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 3600,
            "user": user_dict
        }
        
        # Preparar información de sesión
        session_info = {
            "id": session.id,
            "device_name": session.device_name or "Unknown Device",
            "location": session.location_display or "Unknown Location",
            "ip_address": session.ip_address,
            "is_current": True,
            "created_at": session.created_at,
            "last_activity": session.last_activity,
            "expires_at": session.expires_at,
            "is_expired": session.is_expired,
            "time_until_expiry_hours": session.time_until_expiry_hours
        }
        
        return {
            "message": "Usuario registrado exitosamente",
            "user": user_dict,
            "tokens": tokens,
            "session_info": session_info
        }
    
    except Exception as e:
        logger.error(f"Error en registro de usuario: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.post("/login", response_model=AuthSuccessResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Iniciar sesión"""
    
    # Buscar usuario por email
    user_stmt = select(User).where(User.email == login_data.email)
    result = await db.execute(user_stmt)
    user = result.scalar_one_or_none()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta desactivada"
        )
    
    # Crear tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Crear sesión
    client_info = get_client_info(request)
    session = UserSession.create_session(
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token,
        user_agent=client_info["user_agent"],
        ip_address=client_info["ip_address"]
    )
    
    # Agregar sesión a la base de datos
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Preparar respuesta
    user_dict = {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "email_verified": user.email_verified
    }
    
    tokens = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=3600,  # 1 hora
        user=user_dict
    )
    
    session_info = session.to_dict()
    
    return AuthSuccessResponse(
        message="Inicio de sesión exitoso",
        user=user_dict,
        tokens=tokens,
        session_info=session_info
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Renovar token de acceso"""
    
    try:
        # Verificar refresh token
        payload = verify_token(refresh_data.refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Buscar sesión activa
        session = UserSession.find_by_refresh_token(db, refresh_data.refresh_token)
        if not session or not session.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión inválida o expirada"
            )
        
        # Buscar usuario
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado o inactivo"
            )
        
        # Crear nuevos tokens
        new_access_token = create_access_token(data={"sub": str(user.id)})
        new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
        
        # Actualizar sesión
        session.access_token = new_access_token
        session.refresh_token = new_refresh_token
        session.update_last_activity()
        db.commit()
        
        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "email_verified": user.email_verified
        }
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=3600,
            user=user_dict
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )


@router.post("/logout")
async def logout(
    logout_data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cerrar sesión"""
    
    if logout_data.logout_all_devices:
        # Revocar todas las sesiones del usuario
        UserSession.revoke_all_user_sessions(db, current_user.id)
    else:
        # Revocar solo la sesión actual
        if logout_data.refresh_token:
            session = UserSession.find_by_refresh_token(db, logout_data.refresh_token)
            if session:
                session.revoke()
                db.commit()
    
    return {"message": "Sesión cerrada exitosamente"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Obtener información del usuario actual"""
    return current_user


@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verificar estado de autenticación"""
    
    if not current_user:
        return AuthStatusResponse(
            authenticated=False,
            requires_email_verification=False,
            requires_two_factor=False
        )
    
    return AuthStatusResponse(
        authenticated=True,
        user_id=current_user.id,
        expires_at=datetime.utcnow() + timedelta(hours=1),  # Aproximado
        requires_email_verification=not current_user.email_verified,
        requires_two_factor=False  # Por implementar
    )


@router.post("/check-username", response_model=AvailabilityResponse)
async def check_username_availability(
    username_check: UsernameAvailabilityCheck,
    db: AsyncSession = Depends(get_db)
):
    """Verificar disponibilidad de nombre de usuario"""
    
    existing_user = db.query(User).filter(User.username == username_check.username).first()
    
    if existing_user:
        return AvailabilityResponse(
            available=False,
            message="El nombre de usuario ya está en uso"
        )
    
    return AvailabilityResponse(
        available=True,
        message="Nombre de usuario disponible"
    )


@router.post("/check-email", response_model=AvailabilityResponse)
async def check_email_availability(
    email_check: EmailAvailabilityCheck,
    db: AsyncSession = Depends(get_db)
):
    """Verificar disponibilidad de email"""
    
    existing_user = db.query(User).filter(User.email == email_check.email).first()
    
    if existing_user:
        return AvailabilityResponse(
            available=False,
            message="El email ya está registrado"
        )
    
    return AvailabilityResponse(
        available=True,
        message="Email disponible"
    )


@router.get("/sessions", response_model=ActiveSessionsResponse)
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener sesiones activas del usuario"""
    
    sessions = UserSession.get_user_active_sessions(db, current_user.id)
    
    session_info_list = [session.to_dict() for session in sessions]
    
    return ActiveSessionsResponse(
        sessions=session_info_list,
        total_sessions=len(sessions),
        current_session_id=sessions[0].id if sessions else None
    )


@router.post("/revoke-session")
async def revoke_session(
    revoke_data: RevokeSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Revocar una sesión específica"""
    
    session = db.query(UserSession).filter(
        UserSession.id == revoke_data.session_id,
        UserSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesión no encontrada"
        )
    
    session.revoke()
    db.commit()
    
    return {"message": "Sesión revocada exitosamente"}


@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cambiar contraseña del usuario autenticado"""
    
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.utcnow()
    
    # Revocar todas las sesiones excepto la actual
    UserSession.revoke_all_user_sessions(db, current_user.id)
    
    db.commit()
    
    return {"message": "Contraseña cambiada exitosamente"}


# Endpoints para verificación de email y recuperación de contraseña
# (Implementación básica - requiere servicio de email)

@router.post("/request-email-verification")
async def request_email_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Solicitar verificación de email"""
    
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está verificado"
        )
    
    # TODO: Implementar envío de email de verificación
    # Por ahora, solo retornamos un mensaje
    
    return {"message": "Email de verificación enviado"}


@router.post("/verify-email")
async def verify_email(
    verification_data: EmailVerificationConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Verificar email con token"""
    
    # TODO: Implementar verificación real con token
    # Por ahora, verificamos directamente por email
    
    user = db.query(User).filter(User.email == verification_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    user.email_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Email verificado exitosamente"}


@router.post("/request-password-reset")
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Solicitar restablecimiento de contraseña"""
    
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        # Por seguridad, no revelamos si el email existe
        return {"message": "Si el email existe, se enviará un enlace de restablecimiento"}
    
    # TODO: Implementar envío de email de restablecimiento
    
    return {"message": "Si el email existe, se enviará un enlace de restablecimiento"}


@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Restablecer contraseña con token"""
    
    # TODO: Implementar verificación real con token
    # Por ahora, restablecemos directamente por email
    
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    user.hashed_password = get_password_hash(reset_data.new_password)
    user.updated_at = datetime.utcnow()
    
    # Revocar todas las sesiones
    UserSession.revoke_all_user_sessions(db, user.id)
    
    db.commit()
    
    return {"message": "Contraseña restablecida exitosamente"}