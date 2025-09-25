from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.core.database import get_db
from app.core.security import verify_token, AuthenticationError
from app.models.company import Company

# OAuth2 scheme para empresas
oauth2_scheme_company = OAuth2PasswordBearer(
    tokenUrl="/api/v1/company/auth/login",
    scheme_name="JWT_Company"
)

async def get_current_company(
    token: str = Depends(oauth2_scheme_company),
    db: AsyncSession = Depends(get_db)
) -> Company:
    """Obtener la empresa actual basada en el token JWT"""
    
    # Verificar el token
    payload = verify_token(token, "access")
    if payload is None:
        raise AuthenticationError("Token inválido o expirado")
    
    # Extraer el ID de la empresa
    company_id_str = payload.get("sub")
    if company_id_str is None:
        raise AuthenticationError("Token inválido")
    
    try:
        company_id = UUID(company_id_str)
    except ValueError:
        raise AuthenticationError("ID de empresa inválido")
    
    # Buscar la empresa en la base de datos
    from sqlalchemy import select
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if company is None:
        raise AuthenticationError("Empresa no encontrada")
    
    # Verificar que la empresa esté activa
    if not company.is_active:
        raise AuthenticationError("Empresa inactiva")
    
    return company

def get_current_active_company(
    current_company: Company = Depends(get_current_company)
) -> Company:
    """Obtener la empresa actual y verificar que esté activa"""
    if not current_company.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empresa inactiva"
        )
    return current_company

def get_current_verified_company(
    current_company: Company = Depends(get_current_company)
) -> Company:
    """Obtener la empresa actual y verificar que tenga email verificado"""
    if not current_company.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email no verificado"
        )
    return current_company

async def get_optional_current_company(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[Company]:
    """Obtener la empresa actual de forma opcional (puede ser None)"""
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
        
        # Extraer el ID de la empresa
        company_id_str = payload.get("sub")
        if company_id_str is None:
            return None
        
        try:
            company_id = UUID(company_id_str)
        except ValueError:
            return None
        
        # Buscar la empresa en la base de datos
        from sqlalchemy import select
        result = await db.execute(select(Company).where(Company.id == company_id))
        company = result.scalar_one_or_none()
        
        if company and company.is_active:
            return company
        
        return None
    except Exception:
        return None