from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
from app.core.company_dependencies import get_current_company, get_optional_current_company
from app.models.company import Company
from app.models.company_session import CompanySession
from app.schemas.company_auth import (
    CompanyLoginRequest,
    CompanyRegisterRequest,
    CompanyTokenResponse,
    CompanyTokenRefreshRequest,
    CompanyTokenRefreshResponse,
    CompanyLogoutRequest,
    CompanyLogoutResponse
)
from app.schemas.company import CompanyResponse, CompanyRewards
from app.models.contribution import Contribution, ContributionStatus
from app.models.reward_event import RewardEvent

router = APIRouter()
security = HTTPBearer(auto_error=False)

# Función auxiliar para obtener información del cliente
def get_client_info(request: Request) -> dict:
    """Extraer información del cliente desde la solicitud"""
    user_agent = request.headers.get("user-agent", "Unknown")
    ip_address = request.client.host if request.client else "0.0.0.0"
    
    # Aquí se podría implementar la detección de ubicación basada en IP
    # usando servicios como MaxMind GeoIP o similar
    
    return {
        "user_agent": user_agent,
        "ip_address": ip_address,
        "location": None  # Se podría implementar después
    }

@router.post("/register", response_model=CompanyTokenResponse)
async def register_company(
    company_data: CompanyRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Registrar una nueva empresa"""
    logger = logging.getLogger(__name__)
    
    try:
        # Verificar si el email ya existe
        existing_company_stmt = select(Company).where(Company.email == company_data.email)
        result = await db.execute(existing_company_stmt)
        existing_company = result.scalar_one_or_none()
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # Verificar si el username ya existe
        existing_username_stmt = select(Company).where(Company.username == company_data.username)
        result = await db.execute(existing_username_stmt)
        existing_username = result.scalar_one_or_none()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        
        # Crear nueva empresa
        hashed_password = get_password_hash(company_data.password)
        new_company = Company(
            email=company_data.email,
            username=company_data.username,
            hashed_password=hashed_password,
            company_name=company_data.company_name,
            tax_id=company_data.tax_id,
            industry=company_data.industry,
            company_size=company_data.company_size,
            website=company_data.website,
            phone=company_data.phone,
            bio=company_data.bio,
            contact_name=company_data.contact_name,
            contact_position=company_data.contact_position,
            contact_email=company_data.contact_email,
            contact_phone=company_data.contact_phone,
            address=company_data.address,
            city=company_data.city,
            state=company_data.state,
            country=company_data.country,
            postal_code=company_data.postal_code,
            collaboration_type=company_data.collaboration_type,
            is_active=True,
            email_verified=False  # Requerirá verificación
        )
        
        db.add(new_company)
        await db.commit()
        await db.refresh(new_company)
        
        # Crear tokens
        access_token = create_access_token(data={"sub": str(new_company.id), "type": "company"})
        refresh_token = create_refresh_token(data={"sub": str(new_company.id), "type": "company"})
        
        # Crear sesión
        client_info = get_client_info(request)
        session = CompanySession.create_session(
            company_id=new_company.id,
            access_token=access_token,
            refresh_token=refresh_token,
            user_agent=client_info["user_agent"],
            ip_address=client_info["ip_address"]
        )
        
        db.add(session)
        await db.commit()
        await db.refresh(session)
        
        # Preparar respuesta
        company_dict = {
            "id": str(new_company.id),
            "email": new_company.email,
            "username": new_company.username,
            "company_name": new_company.company_name,
            "tax_id": new_company.tax_id,
            "industry": new_company.industry,
            "company_size": new_company.company_size,
            "is_active": new_company.is_active,
            "email_verified": new_company.email_verified,
            "created_at": new_company.created_at.isoformat()
        }
        
        # Preparar información de sesión
        session_info = {
            "id": session.id,
            "device_name": session.device_name or "Unknown Device",
            "location_display": session.location_display or "Unknown Location",
            "ip_address": session.ip_address,
            "created_at": session.created_at,
            "last_activity": session.last_activity,
            "time_until_expiry_hours": session.time_until_expiry_hours
        }
        
        return CompanyTokenResponse(
            message="Empresa registrada exitosamente",
            company=company_dict,
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=3600,
            session_info=session_info
        )
    
    except Exception as e:
        logger.error(f"Error en registro de empresa: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


@router.post("/login", response_model=CompanyTokenResponse)
async def login_company(
    login_data: CompanyLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Iniciar sesión como empresa"""
    
    # Buscar empresa por email
    company_stmt = select(Company).where(Company.email == login_data.email)
    result = await db.execute(company_stmt)
    company = result.scalar_one_or_none()
    if not company or not verify_password(login_data.password, company.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas"
        )
    
    if not company.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta desactivada"
        )
    
    # Crear tokens
    access_token = create_access_token(data={"sub": str(company.id), "type": "company"})
    refresh_token = create_refresh_token(data={"sub": str(company.id), "type": "company"})
    
    # Crear sesión
    client_info = get_client_info(request)
    session = CompanySession.create_session(
        company_id=company.id,
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
    company_dict = {
        "id": str(company.id),
        "email": company.email,
        "username": company.username,
        "company_name": company.company_name,
        "tax_id": company.tax_id,
        "industry": company.industry,
        "company_size": company.company_size,
        "is_active": company.is_active,
        "email_verified": company.email_verified
    }
    
    # Preparar información de sesión
    session_info = {
        "id": session.id,
        "device_name": session.device_name or "Unknown Device",
        "location_display": session.location_display or "Unknown Location",
        "ip_address": session.ip_address,
        "created_at": session.created_at,
        "last_activity": session.last_activity,
        "time_until_expiry_hours": session.time_until_expiry_hours
    }
    
    return CompanyTokenResponse(
        message="Inicio de sesión exitoso",
        company=company_dict,
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
        session_info=session_info
    )


@router.post("/refresh", response_model=CompanyTokenRefreshResponse)
async def refresh_company_token(
    refresh_data: CompanyTokenRefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Renovar token de acceso para empresas"""
    
    try:
        # Verificar refresh token
        payload = verify_token(refresh_data.refresh_token)
        company_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not company_id or token_type != "company":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Buscar sesión activa
        session_stmt = select(CompanySession).where(
            CompanySession.refresh_token == refresh_data.refresh_token,
            CompanySession.is_active == True,
            CompanySession.is_revoked == False
        )
        result = await db.execute(session_stmt)
        session = result.scalar_one_or_none()
        
        if not session or session.is_expired:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión inválida o expirada"
            )
        
        # Buscar empresa
        company_stmt = select(Company).where(Company.id == company_id)
        result = await db.execute(company_stmt)
        company = result.scalar_one_or_none()
        
        if not company or not company.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Empresa no encontrada o inactiva"
            )
        
        # Crear nuevos tokens
        new_access_token = create_access_token(data={"sub": str(company.id), "type": "company"})
        new_refresh_token = create_refresh_token(data={"sub": str(company.id), "type": "company"})
        
        # Actualizar sesión
        session.access_token = new_access_token
        session.refresh_token = new_refresh_token
        session.last_activity = datetime.utcnow()
        
        await db.commit()
        await db.refresh(session)
        
        company_dict = {
            "id": str(company.id),
            "email": company.email,
            "username": company.username,
            "company_name": company.company_name,
            "is_active": company.is_active,
            "email_verified": company.email_verified
        }
        
        return CompanyTokenRefreshResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=3600,
            company=company_dict
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido: {str(e)}"
        )


@router.get("/me", response_model=CompanyResponse)
async def get_current_company_info(
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Obtener información de la empresa actual"""
    
    return CompanyResponse(
        id=current_company.id,
        email=current_company.email,
        username=current_company.username,
        company_name=current_company.company_name,
        tax_id=current_company.tax_id,
        industry=current_company.industry,
        company_size=current_company.company_size,
        website=current_company.website,
        phone=current_company.phone,
        bio=current_company.bio,
        contact_name=current_company.contact_name,
        contact_position=current_company.contact_position,
        contact_email=current_company.contact_email,
        contact_phone=current_company.contact_phone,
        address=current_company.address,
        city=current_company.city,
        state=current_company.state,
        country=current_company.country,
        postal_code=current_company.postal_code,
        is_active=current_company.is_active,
        is_verified=current_company.is_verified,
        email_verified=current_company.email_verified,
        phone_verified=current_company.phone_verified,
        reputation_score=current_company.reputation_score,
        total_exchanges=current_company.total_exchanges,
        successful_exchanges=current_company.successful_exchanges,
        reward_points=current_company.reward_points,
        reward_tier=current_company.reward_tier,
        created_at=current_company.created_at,
        updated_at=current_company.updated_at,
        last_login=current_company.last_login
    )

@router.get("/me/rewards", response_model=CompanyRewards)
async def get_company_rewards(
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    total_contributions = (await db.execute(
        select(func.count()).select_from(Contribution).where(Contribution.company_id == current_company.id)
    )).scalar() or 0
    active_contributions = (await db.execute(
        select(func.count()).select_from(Contribution).where(
            (Contribution.company_id == current_company.id) &
            (Contribution.status == ContributionStatus.ACTIVE)
        )
    )).scalar() or 0
    completed_contributions = (await db.execute(
        select(func.count()).select_from(Contribution).where(
            (Contribution.company_id == current_company.id) &
            (Contribution.status == ContributionStatus.COMPLETED)
        )
    )).scalar() or 0

    points = int(active_contributions * 20 + completed_contributions * 100 + float(current_company.reputation_score or 0) * 30)
    tier = 'Bronce'
    next_tier_at = 100
    if points >= 100 and points < 300:
        tier = 'Plata'
        next_tier_at = 300
    elif points >= 300 and points < 600:
        tier = 'Oro'
        next_tier_at = 600
    elif points >= 600:
        tier = 'Platino'
        next_tier_at = points + 100

    return CompanyRewards(points=points, tier=tier, next_tier_at=next_tier_at)

@router.put("/me/rewards/recompute", response_model=CompanyResponse)
async def recompute_and_persist_company_rewards(
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    active_contributions = (await db.execute(
        select(func.count()).select_from(Contribution).where(
            (Contribution.company_id == current_company.id) &
            (Contribution.status == ContributionStatus.ACTIVE)
        )
    )).scalar() or 0
    completed_contributions = (await db.execute(
        select(func.count()).select_from(Contribution).where(
            (Contribution.company_id == current_company.id) &
            (Contribution.status == ContributionStatus.COMPLETED)
        )
    )).scalar() or 0

    points = int(active_contributions * 20 + completed_contributions * 100 + float(current_company.reputation_score or 0) * 30)
    tier = 'Bronce'
    if points >= 100 and points < 300:
        tier = 'Plata'
    elif points >= 300 and points < 600:
        tier = 'Oro'
    elif points >= 600:
        tier = 'Platino'

    old_points = current_company.reward_points or 0
    old_tier = current_company.reward_tier or 'Bronce'

    current_company.reward_points = points
    current_company.reward_tier = tier
    current_company.updated_at = datetime.utcnow()

    event = RewardEvent(
        actor_id=current_company.id,
        actor_type='company',
        event_type='recompute',
        points_delta=int(points - old_points),
        points_total=points,
        tier_before=old_tier,
        tier_after=tier,
        description='Recomputación de recompensas de empresa',
        meta=None
    )
    db.add(event)

    await db.commit()
    await db.refresh(current_company)
    return current_company

@router.post("/logout", response_model=CompanyLogoutResponse)
async def logout_company(
    logout_data: CompanyLogoutRequest,
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Cerrar sesión de empresa"""
    
    try:
        if logout_data.logout_all_devices:
            # Revocar todas las sesiones de la empresa
            session_stmt = select(CompanySession).where(
                CompanySession.company_id == current_company.id,
                CompanySession.is_active == True,
                CompanySession.is_revoked == False
            )
            result = await db.execute(session_stmt)
            sessions = result.scalars().all()
            
            for session in sessions:
                session.is_active = False
                session.is_revoked = True
                session.revoked_at = datetime.utcnow()
            
            await db.commit()
            
            return CompanyLogoutResponse(
                message="Se han cerrado todas las sesiones",
                sessions_closed=len(sessions)
            )
        else:
            # Revocar solo la sesión actual
            if not logout_data.refresh_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Se requiere el refresh_token para cerrar la sesión actual"
                )
            
            session_stmt = select(CompanySession).where(
                CompanySession.company_id == current_company.id,
                CompanySession.refresh_token == logout_data.refresh_token,
                CompanySession.is_active == True,
                CompanySession.is_revoked == False
            )
            result = await db.execute(session_stmt)
            session = result.scalar_one_or_none()
            
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sesión no encontrada"
                )
            
            session.is_active = False
            session.is_revoked = True
            session.revoked_at = datetime.utcnow()
            
            await db.commit()
            
            return CompanyLogoutResponse(
                message="Sesión cerrada exitosamente",
                sessions_closed=1
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cerrar sesión: {str(e)}"
        )
