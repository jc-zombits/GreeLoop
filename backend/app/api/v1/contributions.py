from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
import logging

from app.core.database import get_db
from app.core.company_dependencies import get_current_company
from app.models.company import Company
from app.models.contribution import Contribution, ContributionStatus, DeliveryMethod
from app.models.contribution_category import ContributionCategory
from app.models.contribution_image import ContributionImage
from app.schemas.contribution import (
    ContributionCreate,
    ContributionUpdate,
    ContributionResponse,
    ContributionListItem,
    ContributionSearchParams,
    ContributionSearchResponse,
    ContributionCategoryResponse
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/categories", response_model=List[ContributionCategoryResponse])
async def get_contribution_categories(
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(True, description="Solo categorías activas")
):
    """Obtener todas las categorías de contribuciones"""
    try:
        stmt = select(ContributionCategory)
        if active_only:
            stmt = stmt.where(ContributionCategory.is_active == True)
        stmt = stmt.order_by(ContributionCategory.sort_order, ContributionCategory.name)
        
        result = await db.execute(stmt)
        categories = result.scalars().all()
        
        return categories
    except Exception as e:
        logger.error(f"Error getting contribution categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener las categorías"
        )

@router.post("/", response_model=ContributionResponse)
async def create_contribution(
    contribution_data: ContributionCreate,
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva contribución"""
    try:
        # Verificar que la categoría existe
        category_stmt = select(ContributionCategory).where(
            ContributionCategory.id == contribution_data.category_id,
            ContributionCategory.is_active == True
        )
        result = await db.execute(category_stmt)
        category = result.scalar_one_or_none()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada"
            )
        
        # Crear la contribución
        contribution = Contribution(
            **contribution_data.dict(),
            company_id=current_company.id,
            status=ContributionStatus.DRAFT
        )
        
        db.add(contribution)
        await db.commit()
        await db.refresh(contribution)
        
        # Cargar las relaciones para la respuesta
        stmt = select(Contribution).options(
            selectinload(Contribution.category),
            selectinload(Contribution.images)
        ).where(Contribution.id == contribution.id)
        
        result = await db.execute(stmt)
        contribution_with_relations = result.scalar_one()
        
        return contribution_with_relations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating contribution: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la contribución"
        )

@router.get("/", response_model=ContributionSearchResponse)
async def search_contributions(
    category_id: Optional[UUID] = Query(None),
    delivery_method: Optional[DeliveryMethod] = Query(None),
    status: Optional[ContributionStatus] = Query(ContributionStatus.ACTIVE),
    min_value: Optional[float] = Query(None, ge=0),
    max_value: Optional[float] = Query(None, ge=0),
    city: Optional[str] = Query(None),
    is_recurring: Optional[bool] = Query(None),
    search_query: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Buscar contribuciones con filtros"""
    try:
        # Construir la consulta base
        stmt = select(
            Contribution.id,
            Contribution.title,
            Contribution.description,
            Contribution.category_id,
            ContributionCategory.name.label('category_name'),
            Contribution.quantity,
            Contribution.estimated_value,
            Contribution.currency,
            Contribution.delivery_method,
            Contribution.status,
            Contribution.views_count,
            Contribution.interested_count,
            Contribution.created_at,
            Company.company_name
        ).select_from(
            Contribution.__table__.join(ContributionCategory.__table__)
            .join(Company.__table__)
        )
        
        # Aplicar filtros
        filters = []
        
        if category_id:
            filters.append(Contribution.category_id == category_id)
        
        if delivery_method:
            filters.append(Contribution.delivery_method == delivery_method)
        
        if status:
            filters.append(Contribution.status == status)
        
        if min_value is not None:
            filters.append(Contribution.estimated_value >= min_value)
        
        if max_value is not None:
            filters.append(Contribution.estimated_value <= max_value)
        
        if city:
            filters.append(Company.city.ilike(f"%{city}%"))
        
        if is_recurring is not None:
            filters.append(Contribution.is_recurring == is_recurring)
        
        if search_query:
            search_filter = or_(
                Contribution.title.ilike(f"%{search_query}%"),
                Contribution.description.ilike(f"%{search_query}%"),
                Company.company_name.ilike(f"%{search_query}%")
            )
            filters.append(search_filter)
        
        if filters:
            stmt = stmt.where(and_(*filters))
        
        # Contar total de resultados
        count_stmt = select(func.count()).select_from(stmt.subquery())
        count_result = await db.execute(count_stmt)
        total = count_result.scalar()
        
        # Aplicar paginación y ordenamiento
        stmt = stmt.order_by(Contribution.created_at.desc())
        stmt = stmt.offset((page - 1) * limit).limit(limit)
        
        result = await db.execute(stmt)
        contributions_data = result.all()
        
        # Convertir a lista de objetos ContributionListItem
        contributions = []
        for row in contributions_data:
            contribution_dict = {
                'id': row.id,
                'title': row.title,
                'description': row.description,
                'category_id': row.category_id,
                'category_name': row.category_name,
                'quantity': row.quantity,
                'estimated_value': row.estimated_value,
                'currency': row.currency,
                'delivery_method': row.delivery_method,
                'status': row.status,
                'views_count': row.views_count,
                'interested_count': row.interested_count,
                'created_at': row.created_at,
                'company_name': row.company_name,
                'primary_image_url': None  # TODO: Implementar cuando se agreguen imágenes
            }
            contributions.append(ContributionListItem(**contribution_dict))
        
        total_pages = (total + limit - 1) // limit
        
        return ContributionSearchResponse(
            contributions=contributions,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error searching contributions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al buscar contribuciones"
        )

@router.get("/my", response_model=List[ContributionResponse])
async def get_my_contributions(
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Obtener las contribuciones de la empresa actual"""
    try:
        stmt = select(Contribution).options(
            selectinload(Contribution.category),
            selectinload(Contribution.images)
        ).where(
            Contribution.company_id == current_company.id
        ).order_by(Contribution.created_at.desc())
        
        result = await db.execute(stmt)
        contributions = result.scalars().all()
        
        return contributions
        
    except Exception as e:
        logger.error(f"Error getting company contributions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener las contribuciones"
        )

@router.get("/{contribution_id}", response_model=ContributionResponse)
async def get_contribution(
    contribution_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Obtener una contribución específica"""
    try:
        stmt = select(Contribution).options(
            selectinload(Contribution.category),
            selectinload(Contribution.images)
        ).where(Contribution.id == contribution_id)
        
        result = await db.execute(stmt)
        contribution = result.scalar_one_or_none()
        
        if not contribution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contribución no encontrada"
            )
        
        # Incrementar contador de vistas
        contribution.views_count += 1
        await db.commit()
        
        return contribution
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contribution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener la contribución"
        )

@router.put("/{contribution_id}", response_model=ContributionResponse)
async def update_contribution(
    contribution_id: UUID,
    contribution_data: ContributionUpdate,
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar una contribución"""
    try:
        # Verificar que la contribución existe y pertenece a la empresa
        stmt = select(Contribution).where(
            Contribution.id == contribution_id,
            Contribution.company_id == current_company.id
        )
        result = await db.execute(stmt)
        contribution = result.scalar_one_or_none()
        
        if not contribution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contribución no encontrada"
            )
        
        # Verificar categoría si se está actualizando
        if contribution_data.category_id:
            category_stmt = select(ContributionCategory).where(
                ContributionCategory.id == contribution_data.category_id,
                ContributionCategory.is_active == True
            )
            result = await db.execute(category_stmt)
            category = result.scalar_one_or_none()
            
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada"
                )
        
        # Actualizar campos
        update_data = contribution_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(contribution, field, value)
        
        await db.commit()
        await db.refresh(contribution)
        
        # Cargar las relaciones para la respuesta
        stmt = select(Contribution).options(
            selectinload(Contribution.category),
            selectinload(Contribution.images)
        ).where(Contribution.id == contribution.id)
        
        result = await db.execute(stmt)
        contribution_with_relations = result.scalar_one()
        
        return contribution_with_relations
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contribution: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar la contribución"
        )

@router.delete("/{contribution_id}")
async def delete_contribution(
    contribution_id: UUID,
    current_company: Company = Depends(get_current_company),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar una contribución"""
    try:
        # Verificar que la contribución existe y pertenece a la empresa
        stmt = select(Contribution).where(
            Contribution.id == contribution_id,
            Contribution.company_id == current_company.id
        )
        result = await db.execute(stmt)
        contribution = result.scalar_one_or_none()
        
        if not contribution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contribución no encontrada"
            )
        
        await db.delete(contribution)
        await db.commit()
        
        return {"message": "Contribución eliminada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contribution: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la contribución"
        )