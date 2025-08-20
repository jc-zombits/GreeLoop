from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.rating import Rating
from app.models.exchange import Exchange
from app.models.notification import Notification
from app.schemas.rating import (
    RatingCreate,
    RatingUpdate,
    RatingResponse,
    RatingListItem,
    RatingSearchParams,
    RatingSearchResponse,
    UserRatingStats,
    PendingRatingResponse,
    PendingRatingsResponse,
    RatingSettings,
    RatingSettingsUpdate
)

router = APIRouter(tags=["ratings"])

@router.post("/", response_model=RatingResponse)
async def create_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva calificación"""
    
    # Verificar que el intercambio existe y está completado
    exchange_query = select(Exchange).where(Exchange.id == rating_data.exchange_id)
    exchange_result = await db.execute(exchange_query)
    exchange = exchange_result.scalar_one_or_none()
    
    if not exchange:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    
    if exchange.status != "completed":
        raise HTTPException(status_code=400, detail="Solo se pueden calificar intercambios completados")
    
    # Verificar que el usuario actual participó en el intercambio
    if current_user.id not in [exchange.requester_id, exchange.owner_id]:
        raise HTTPException(status_code=403, detail="Solo los participantes del intercambio pueden calificar")
    
    # Verificar que no se esté auto-calificando
    if current_user.id == rating_data.rated_user_id:
        raise HTTPException(status_code=400, detail="No puedes calificarte a ti mismo")
    
    # Verificar que el usuario a calificar participó en el intercambio
    if rating_data.rated_user_id not in [exchange.requester_id, exchange.owner_id]:
        raise HTTPException(status_code=400, detail="El usuario a calificar debe haber participado en el intercambio")
    
    # Verificar que no existe ya una calificación de este usuario para este intercambio
    existing_rating_query = select(Rating).where(
        and_(
            Rating.rater_id == current_user.id,
            Rating.exchange_id == rating_data.exchange_id
        )
    )
    existing_result = await db.execute(existing_rating_query)
    existing_rating = existing_result.scalar_one_or_none()
    
    if existing_rating:
        raise HTTPException(status_code=400, detail="Ya has calificado este intercambio")
    
    # Crear la calificación
    new_rating = Rating(
        rater_id=current_user.id,
        rated_id=rating_data.rated_user_id,
        exchange_id=rating_data.exchange_id,
        overall_rating=rating_data.overall_rating,
        communication_rating=rating_data.communication_rating,
        punctuality_rating=rating_data.punctuality_rating,
        item_condition_rating=rating_data.item_condition_rating,
        friendliness_rating=rating_data.friendliness_rating,
        comment=rating_data.comment,
        would_exchange_again=1 if rating_data.would_exchange_again else 0 if rating_data.would_exchange_again is False else None
    )
    
    db.add(new_rating)
    await db.commit()
    await db.refresh(new_rating)
    
    # Crear notificación para el usuario calificado
    notification = Notification.create_rating_notification(
        user_id=rating_data.rated_user_id,
        rater_id=current_user.id,
        rater_name=current_user.username,
        rating=rating_data.overall_rating,
        exchange_id=rating_data.exchange_id
    )
    db.add(notification)
    await db.commit()
    
    # Obtener información del usuario calificado para la respuesta
    rated_user_query = select(User).where(User.id == rating_data.rated_user_id)
    rated_user_result = await db.execute(rated_user_query)
    rated_user = rated_user_result.scalar_one()
    
    return RatingResponse(
        id=new_rating.id,
        rater_id=new_rating.rater_id,
        rated_id=new_rating.rated_id,
        exchange_id=new_rating.exchange_id,
        overall_rating=new_rating.overall_rating,
        communication_rating=new_rating.communication_rating,
        punctuality_rating=new_rating.punctuality_rating,
        item_condition_rating=new_rating.item_condition_rating,
        friendliness_rating=new_rating.friendliness_rating,
        comment=new_rating.comment,
        would_exchange_again=bool(new_rating.would_exchange_again) if new_rating.would_exchange_again is not None else None,
        created_at=new_rating.created_at,
        updated_at=new_rating.updated_at,
        rater_username=current_user.username,
        rated_username=rated_user.username
    )

@router.get("/", response_model=RatingSearchResponse)
async def get_ratings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[UUID] = None,
    min_rating: Optional[float] = Query(None, ge=1, le=5),
    max_rating: Optional[float] = Query(None, ge=1, le=5),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener calificaciones con filtros y paginación"""
    
    # Construir query base
    query = select(Rating)
    
    # Si se especifica un user_id, mostrar las calificaciones recibidas por ese usuario
    if user_id:
        query = query.where(Rating.rated_id == user_id)
    else:
        # Si no se especifica, mostrar las calificaciones del usuario actual
        query = query.where(
            or_(
                Rating.rater_id == current_user.id,
                Rating.rated_id == current_user.id
            )
        )
    
    # Aplicar filtros de calificación
    if min_rating is not None:
        query = query.where(Rating.overall_rating >= min_rating)
    if max_rating is not None:
        query = query.where(Rating.overall_rating <= max_rating)
    
    # Contar total
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Aplicar paginación y ordenamiento
    query = query.order_by(desc(Rating.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    # Ejecutar query con joins para obtener información de usuarios
    from sqlalchemy.orm import selectinload
    query = query.options(selectinload(Rating.rater), selectinload(Rating.rated))
    
    result = await db.execute(query)
    ratings = result.scalars().all()
    
    # Calcular estadísticas
    if ratings:
        ratings_values = [r.overall_rating for r in ratings]
        average_rating = sum(ratings_values) / len(ratings_values)
        
        # Distribución de calificaciones
        rating_distribution = {str(i): 0 for i in range(1, 6)}
        for rating in ratings_values:
            rating_distribution[str(round(rating))] += 1
        
        # Porcentaje de recomendaciones
        recommendations = [r for r in ratings if r.would_exchange_again == 1]
        recommendation_percentage = (len(recommendations) / len(ratings)) * 100 if ratings else 0
    else:
        average_rating = None
        rating_distribution = {str(i): 0 for i in range(1, 6)}
        recommendation_percentage = None
    
    # Convertir a RatingListItem
    rating_items = []
    for rating in ratings:
        rating_items.append(RatingListItem(
            id=rating.id,
            rater_id=rating.rater_id,
            rated_id=rating.rated_id,
            exchange_id=rating.exchange_id,
            overall_rating=rating.overall_rating,
            comment=rating.comment,
            would_exchange_again=bool(rating.would_exchange_again) if rating.would_exchange_again is not None else None,
            created_at=rating.created_at,
            rater_username=rating.rater.username,
            rated_username=rating.rated.username
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return RatingSearchResponse(
        ratings=rating_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
        average_rating=average_rating,
        rating_distribution=rating_distribution,
        recommendation_percentage=recommendation_percentage
    )

@router.get("/stats/{user_id}", response_model=UserRatingStats)
async def get_user_rating_stats(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener estadísticas de calificaciones de un usuario"""
    
    # Verificar que el usuario existe
    user_query = select(User).where(User.id == user_id)
    user_result = await db.execute(user_query)
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Calificaciones recibidas
    received_query = select(Rating).where(Rating.rated_id == user_id)
    received_result = await db.execute(received_query)
    received_ratings = received_result.scalars().all()
    
    # Calificaciones dadas
    given_query = select(Rating).where(Rating.rater_id == user_id)
    given_result = await db.execute(given_query)
    given_ratings = given_result.scalars().all()
    
    # Estadísticas de calificaciones recibidas
    total_ratings_received = len(received_ratings)
    if received_ratings:
        overall_ratings = [r.overall_rating for r in received_ratings]
        average_rating = sum(overall_ratings) / len(overall_ratings)
        
        # Distribución
        rating_distribution = {str(i): 0 for i in range(1, 6)}
        for rating in overall_ratings:
            rating_distribution[str(round(rating))] += 1
        
        # Promedios específicos
        comm_ratings = [r.communication_rating for r in received_ratings if r.communication_rating is not None]
        punct_ratings = [r.punctuality_rating for r in received_ratings if r.punctuality_rating is not None]
        condition_ratings = [r.item_condition_rating for r in received_ratings if r.item_condition_rating is not None]
        friendly_ratings = [r.friendliness_rating for r in received_ratings if r.friendliness_rating is not None]
        
        average_communication = sum(comm_ratings) / len(comm_ratings) if comm_ratings else None
        average_punctuality = sum(punct_ratings) / len(punct_ratings) if punct_ratings else None
        average_item_condition = sum(condition_ratings) / len(condition_ratings) if condition_ratings else None
        average_friendliness = sum(friendly_ratings) / len(friendly_ratings) if friendly_ratings else None
        
        # Recomendaciones
        recommendations = [r for r in received_ratings if r.would_exchange_again == 1]
        total_recommendations = len(recommendations)
        recommendation_percentage = (total_recommendations / total_ratings_received) * 100
        
        # Tendencia reciente (últimos 30 días)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_ratings = [r for r in received_ratings if r.created_at >= thirty_days_ago]
        if recent_ratings:
            recent_average = sum(r.overall_rating for r in recent_ratings) / len(recent_ratings)
            if recent_average > average_rating + 0.2:
                trend = "improving"
            elif recent_average < average_rating - 0.2:
                trend = "declining"
            else:
                trend = "stable"
            last_30_days_average = recent_average
        else:
            trend = "stable"
            last_30_days_average = None
    else:
        average_rating = None
        rating_distribution = {str(i): 0 for i in range(1, 6)}
        average_communication = None
        average_punctuality = None
        average_item_condition = None
        average_friendliness = None
        total_recommendations = 0
        recommendation_percentage = None
        trend = "stable"
        last_30_days_average = None
    
    # Estadísticas de calificaciones dadas
    total_ratings_given = len(given_ratings)
    if given_ratings:
        given_overall_ratings = [r.overall_rating for r in given_ratings]
        average_rating_given = sum(given_overall_ratings) / len(given_overall_ratings)
    else:
        average_rating_given = None
    
    return UserRatingStats(
        total_ratings_received=total_ratings_received,
        average_rating=average_rating,
        rating_distribution=rating_distribution,
        average_communication=average_communication,
        average_punctuality=average_punctuality,
        average_item_condition=average_item_condition,
        average_friendliness=average_friendliness,
        total_recommendations=total_recommendations,
        recommendation_percentage=recommendation_percentage,
        total_ratings_given=total_ratings_given,
        average_rating_given=average_rating_given,
        recent_ratings_trend=trend,
        last_30_days_average=last_30_days_average
    )

@router.get("/pending", response_model=PendingRatingsResponse)
async def get_pending_ratings(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener intercambios completados que están pendientes de calificación"""
    
    # Buscar intercambios completados donde el usuario participó
    completed_exchanges_query = select(Exchange).where(
        and_(
            Exchange.status == "completed",
            or_(
                Exchange.requester_id == current_user.id,
                Exchange.owner_id == current_user.id
            )
        )
    )
    
    completed_result = await db.execute(completed_exchanges_query)
    completed_exchanges = completed_result.scalars().all()
    
    pending_ratings = []
    overdue_count = 0
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    for exchange in completed_exchanges:
        # Verificar si ya calificó este intercambio
        existing_rating_query = select(Rating).where(
            and_(
                Rating.rater_id == current_user.id,
                Rating.exchange_id == exchange.id
            )
        )
        existing_result = await db.execute(existing_rating_query)
        existing_rating = existing_result.scalar_one_or_none()
        
        if not existing_rating:
            # Determinar el otro usuario
            other_user_id = exchange.owner_id if exchange.requester_id == current_user.id else exchange.requester_id
            
            # Obtener información del otro usuario
            other_user_query = select(User).where(User.id == other_user_id)
            other_user_result = await db.execute(other_user_query)
            other_user = other_user_result.scalar_one()
            
            # Obtener información de los items
            my_item_title = exchange.requested_item.title if exchange.requester_id == current_user.id else exchange.offered_item.title
            other_item_title = exchange.offered_item.title if exchange.requester_id == current_user.id else exchange.requested_item.title
            
            days_since_completion = (datetime.utcnow() - exchange.updated_at).days
            is_overdue = exchange.updated_at < seven_days_ago
            
            if is_overdue:
                overdue_count += 1
            
            pending_ratings.append(PendingRatingResponse(
                exchange_id=exchange.id,
                other_user_id=other_user.id,
                other_user_username=other_user.username,
                other_user_avatar=other_user.avatar_url,
                my_item_title=my_item_title,
                other_item_title=other_item_title,
                completed_at=exchange.updated_at,
                days_since_completion=days_since_completion,
                reminder_sent=False  # TODO: Implementar sistema de recordatorios
            ))
    
    return PendingRatingsResponse(
        pending_ratings=pending_ratings,
        total=len(pending_ratings),
        overdue_count=overdue_count
    )

@router.get("/settings", response_model=RatingSettings)
async def get_rating_settings(
    current_user: User = Depends(get_current_active_user)
):
    """Obtener configuraciones de calificaciones del usuario"""
    
    return RatingSettings(
        email_rating_reminders=getattr(current_user, 'email_ratings', True),
        push_rating_reminders=getattr(current_user, 'push_ratings', True),
        show_ratings_publicly=True,  # TODO: Agregar campo al modelo User
        allow_rating_comments=True   # TODO: Agregar campo al modelo User
    )

@router.put("/settings")
async def update_rating_settings(
    settings: RatingSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar configuraciones de calificaciones del usuario"""
    
    # Actualizar configuraciones que existen en el modelo User
    if settings.email_rating_reminders is not None:
        current_user.email_ratings = settings.email_rating_reminders
    if settings.push_rating_reminders is not None:
        current_user.push_ratings = settings.push_rating_reminders
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return {"message": "Configuraciones de calificaciones actualizadas exitosamente"}

@router.put("/{rating_id}", response_model=RatingResponse)
async def update_rating(
    rating_id: UUID,
    rating_update: RatingUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar una calificación existente"""
    
    # Buscar la calificación
    rating_query = select(Rating).where(Rating.id == rating_id)
    rating_result = await db.execute(rating_query)
    rating = rating_result.scalar_one_or_none()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Calificación no encontrada")
    
    # Verificar que el usuario actual es quien hizo la calificación
    if rating.rater_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo puedes editar tus propias calificaciones")
    
    # Actualizar campos
    if rating_update.overall_rating is not None:
        rating.overall_rating = rating_update.overall_rating
    if rating_update.communication_rating is not None:
        rating.communication_rating = rating_update.communication_rating
    if rating_update.punctuality_rating is not None:
        rating.punctuality_rating = rating_update.punctuality_rating
    if rating_update.item_condition_rating is not None:
        rating.item_condition_rating = rating_update.item_condition_rating
    if rating_update.friendliness_rating is not None:
        rating.friendliness_rating = rating_update.friendliness_rating
    if rating_update.comment is not None:
        rating.comment = rating_update.comment
    if rating_update.would_exchange_again is not None:
        rating.would_exchange_again = 1 if rating_update.would_exchange_again else 0
    
    rating.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(rating)
    
    # Obtener información de usuarios para la respuesta
    rater_query = select(User).where(User.id == rating.rater_id)
    rater_result = await db.execute(rater_query)
    rater = rater_result.scalar_one()
    
    rated_query = select(User).where(User.id == rating.rated_id)
    rated_result = await db.execute(rated_query)
    rated = rated_result.scalar_one()
    
    return RatingResponse(
        id=rating.id,
        rater_id=rating.rater_id,
        rated_id=rating.rated_id,
        exchange_id=rating.exchange_id,
        overall_rating=rating.overall_rating,
        communication_rating=rating.communication_rating,
        punctuality_rating=rating.punctuality_rating,
        item_condition_rating=rating.item_condition_rating,
        friendliness_rating=rating.friendliness_rating,
        comment=rating.comment,
        would_exchange_again=bool(rating.would_exchange_again) if rating.would_exchange_again is not None else None,
        created_at=rating.created_at,
        updated_at=rating.updated_at,
        rater_username=rater.username,
        rated_username=rated.username
    )