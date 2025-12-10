from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
import os
import shutil
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, 
    get_current_active_user,
    get_pagination_params,
    validate_uuid
)
from app.core.config import settings
from app.models.user import User
from app.models.item import Item, ItemStatus
from app.models.exchange import Exchange, ExchangeStatus
from app.models.rating import Rating
from app.models.reward_event import RewardEvent
from app.models.reward import Reward
from app.schemas.user import (
    UserResponse,
    UserDetailResponse,
    UserUpdate,
    UserPublicProfile,
    UserListItem,
    UserStats,
    UserSearchParams,
    UserSearchResponse,
    UserRewards,
    RewardRedeemRequest,
    RewardRedeemResponse,
    RewardCatalogItem,
    RewardRedemptionSummary,
    RewardRedemptionItem,
    RewardRedemptionListResponse
)
from app.schemas.item import ItemListItem
from app.schemas.exchange import ExchangeListItem

router = APIRouter()


@router.get("/profile", response_model=UserDetailResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Obtener perfil completo del usuario actual"""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualizar perfil del usuario"""
    
    # Verificar si el nuevo username ya existe (si se está cambiando)
    if user_update.username and user_update.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == user_update.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
    
    # Verificar si el nuevo email ya existe (si se está cambiando)
    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        # Si cambia el email, marcar como no verificado
        current_user.email_verified = False
    
    # Actualizar campos
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Subir avatar del usuario"""
    
    # Validar tipo de archivo
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos de imagen"
        )
    
    # Validar tamaño
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo es demasiado grande. Máximo {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    # Crear directorio de avatares si no existe
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    
    # Generar nombre único para el archivo
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = os.path.join(avatar_dir, filename)
    
    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar el archivo"
        )
    
    # Actualizar URL del avatar en la base de datos
    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Avatar actualizado exitosamente",
        "avatar_url": avatar_url
    }


@router.delete("/profile/avatar")
async def delete_avatar(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Eliminar avatar del usuario"""
    
    if current_user.avatar_url:
        # Intentar eliminar el archivo físico
        try:
            file_path = os.path.join(settings.UPLOAD_DIR, current_user.avatar_url.lstrip('/uploads/'))
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass  # No fallar si no se puede eliminar el archivo
        
        # Limpiar URL en la base de datos
        current_user.avatar_url = None
        current_user.updated_at = datetime.utcnow()
        db.commit()
    
    return {"message": "Avatar eliminado exitosamente"}


@router.get("/profile/stats", response_model=UserStats)
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener estadísticas del usuario"""
    
    # Contar ítems
    total_items = (await db.execute(
        select(func.count()).select_from(Item).where(Item.owner_id == current_user.id)
    )).scalar() or 0
    active_items = (await db.execute(
        select(func.count()).select_from(Item).where(
            (Item.owner_id == current_user.id) &
            (Item.is_active == True) &
            (Item.status == ItemStatus.AVAILABLE)
        )
    )).scalar() or 0
    
    # Contar intercambios
    total_exchanges = (await db.execute(
        select(func.count()).select_from(Exchange).where(
            (Exchange.requester_id == current_user.id) |
            (Exchange.owner_id == current_user.id)
        )
    )).scalar() or 0
    
    completed_exchanges = (await db.execute(
        select(func.count()).select_from(Exchange).where(
            ((Exchange.requester_id == current_user.id) |
             (Exchange.owner_id == current_user.id)) &
            (Exchange.status == ExchangeStatus.COMPLETED)
        )
    )).scalar() or 0
    
    pending_exchanges = (await db.execute(
        select(func.count()).select_from(Exchange).where(
            ((Exchange.requester_id == current_user.id) |
             (Exchange.owner_id == current_user.id)) &
            (Exchange.status.in_([
                ExchangeStatus.PENDING,
                ExchangeStatus.ACCEPTED,
                ExchangeStatus.COUNTER_OFFERED,
                ExchangeStatus.CONFIRMED,
                ExchangeStatus.IN_PROGRESS
            ]))
        )
    )).scalar() or 0
    
    # Calcular tasa de éxito
    success_rate = (completed_exchanges / total_exchanges * 100) if total_exchanges > 0 else 0
    
    # Obtener calificación promedio
    avg_rating = (await db.execute(
        select(func.avg(Rating.overall_rating)).where(Rating.rated_id == current_user.id)
    )).scalar() or 0
    
    # Contar calificaciones
    total_ratings = (await db.execute(
        select(func.count()).select_from(Rating).where(Rating.rated_id == current_user.id)
    )).scalar() or 0
    
    return UserStats(
        total_items=total_items,
        active_items=active_items,
        total_exchanges=total_exchanges,
        successful_exchanges=completed_exchanges,
        pending_exchanges=pending_exchanges,
        success_rate=round(success_rate, 2),
        reputation_score=current_user.reputation_score,
        total_ratings=total_ratings,
        average_rating=round(float(avg_rating), 2)
    )


@router.get("/profile/rewards", response_model=UserRewards)
async def get_user_rewards(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    total_items = (await db.execute(
        select(func.count()).select_from(Item).where(Item.owner_id == current_user.id)
    )).scalar() or 0
    completed_exchanges = (await db.execute(
        select(func.count()).select_from(Exchange).where(
            ((Exchange.requester_id == current_user.id) |
             (Exchange.owner_id == current_user.id)) &
            (Exchange.status == ExchangeStatus.COMPLETED)
        )
    )).scalar() or 0
    avg_rating = (await db.execute(
        select(func.avg(Rating.overall_rating)).where(Rating.rated_id == current_user.id)
    )).scalar() or 0
    points = int(completed_exchanges * 50 + total_items * 10 + float(avg_rating) * 20)
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
    return UserRewards(points=points, tier=tier, next_tier_at=next_tier_at)


@router.put("/profile/rewards/recompute", response_model=UserResponse)
async def recompute_and_persist_user_rewards(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    total_items = db.query(func.count()).select_from(Item).filter(Item.owner_id == current_user.id).scalar() or 0
    completed_exchanges = db.query(func.count()).select_from(Exchange).filter(
        ((Exchange.requester_id == current_user.id) |
         (Exchange.owner_id == current_user.id)) &
        (Exchange.status == ExchangeStatus.COMPLETED)
    ).scalar() or 0
    avg_rating = db.query(func.avg(Rating.overall_rating)).filter(Rating.rated_id == current_user.id).scalar() or 0
    points = int(completed_exchanges * 50 + total_items * 10 + float(avg_rating or 0) * 20)
    tier = 'Bronce'
    if points >= 100 and points < 300:
        tier = 'Plata'
    elif points >= 300 and points < 600:
        tier = 'Oro'
    elif points >= 600:
        tier = 'Platino'
    old_points = current_user.reward_points or 0
    old_tier = current_user.reward_tier or 'Bronce'
    current_user.reward_points = points
    current_user.reward_tier = tier
    current_user.updated_at = datetime.utcnow()
    event = RewardEvent(
        actor_id=current_user.id,
        actor_type='user',
        event_type='recompute',
        points_delta=int(points - old_points),
        points_total=points,
        tier_before=old_tier,
        tier_after=tier,
        description='Recomputación de recompensas de usuario',
        meta=None
    )
    db.add(event)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/profile/rewards/redeem", response_model=RewardRedeemResponse)
async def redeem_user_reward(
    redeem: RewardRedeemRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    reward = (await db.execute(select(Reward).where(Reward.id == redeem.reward_id))).scalar_one_or_none()
    if not reward or not reward.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recompensa no disponible")

    now = datetime.utcnow()
    if reward.starts_at and reward.starts_at > now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recompensa aún no disponible")
    if reward.ends_at and reward.ends_at < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recompensa expirada")
    if reward.stock <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sin stock disponible")

    # Validar tier
    tier_required = (reward.tier_required or 'Bronce').lower()
    tiers = ['bronce', 'plata', 'oro', 'platino']
    user_tier = (current_user.reward_tier or 'Bronce').lower()
    if tiers.index(user_tier) < tiers.index(tier_required):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nivel insuficiente para canjear esta recompensa")

    # Validar puntos
    cost = int(reward.points_cost or 0)
    if cost <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Costo inválido")
    current_points = int(current_user.reward_points or 0)
    if current_points < cost:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Puntos insuficientes")

    # Descontar puntos y stock
    new_points = current_points - cost
    reward.stock = int(reward.stock) - 1

    # Recalcular tier según puntos restantes
    new_tier = 'Bronce'
    if 100 <= new_points < 300:
        new_tier = 'Plata'
    elif 300 <= new_points < 600:
        new_tier = 'Oro'
    elif new_points >= 600:
        new_tier = 'Platino'

    before_tier = current_user.reward_tier or 'Bronce'
    current_user.reward_points = new_points
    current_user.reward_tier = new_tier
    current_user.updated_at = now

    event = RewardEvent(
        actor_id=current_user.id,
        actor_type='user',
        event_type='redeem',
        points_delta=-cost,
        points_total=new_points,
        tier_before=before_tier,
        tier_after=new_tier,
        description=f'Canje de recompensa {str(reward.id)}',
        meta=__import__('json').dumps({
            "reward_id": str(reward.id),
            "reward_name": reward.name,
            "category": reward.category,
            "cost": cost
        })
    )
    db.add(event)
    await db.commit()
    await db.refresh(current_user)

    return RewardRedeemResponse(
        success=True,
        points_remaining=new_points,
        tier=new_tier,
        message="Canje realizado exitosamente"
    )


@router.get("/profile/rewards/catalog", response_model=List[RewardCatalogItem])
async def get_rewards_catalog(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    result = await db.execute(select(Reward).where(Reward.active == True))
    rewards = result.scalars().all()

    filtered = []
    for r in rewards:
        if r.starts_at and r.starts_at > now:
            continue
        if r.ends_at and r.ends_at < now:
            continue
        if r.stock is not None and r.stock <= 0:
            continue
        filtered.append(r)

    return filtered


@router.get("/profile/rewards/redemptions", response_model=RewardRedemptionSummary)
async def get_user_redemptions_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(RewardEvent)
        .where(
            (RewardEvent.actor_id == current_user.id) &
            (RewardEvent.actor_type == 'user') &
            (RewardEvent.event_type == 'redeem')
        )
        .order_by(RewardEvent.created_at.desc())
    )
    events = result.scalars().all()

    total_redeemed = 0
    redemptions: list[RewardRedemptionItem] = []
    import json
    for e in events:
        cost = abs(int(e.points_delta or 0))
        total_redeemed += cost
        reward_id = None
        reward_name = None
        category = None
        try:
            meta = json.loads(e.meta) if e.meta else None
            if isinstance(meta, dict):
                reward_id = meta.get('reward_id')
                reward_name = meta.get('reward_name')
                category = meta.get('category')
        except Exception:
            pass
        redemptions.append(RewardRedemptionItem(
            reward_id=reward_id,
            reward_name=reward_name,
            category=category,
            points_cost=cost,
            created_at=e.created_at
        ))

    return RewardRedemptionSummary(
        total_points_redeemed=total_redeemed,
        redemptions=redemptions[:10]
    )


@router.get("/profile/rewards/redemptions/list", response_model=RewardRedemptionListResponse)
async def get_rewards_redemptions_list(
    current_user: User = Depends(get_current_active_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    base_where = (
        (RewardEvent.actor_id == current_user.id) &
        (RewardEvent.actor_type == 'user') &
        (RewardEvent.event_type == 'redeem')
    )
    total_result = await db.execute(
        select(func.count()).select_from(RewardEvent).where(base_where)
    )
    total = total_result.scalar() or 0
    result = await db.execute(
        select(RewardEvent)
        .where(base_where)
        .order_by(RewardEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    events = result.scalars().all()

    items: list[RewardRedemptionItem] = []
    import json
    for e in events:
        cost = abs(int(e.points_delta or 0))
        reward_id = None
        reward_name = None
        category = None
        try:
            meta = json.loads(e.meta) if e.meta else None
            if isinstance(meta, dict):
                reward_id = meta.get('reward_id')
                reward_name = meta.get('reward_name')
                category = meta.get('category')
        except Exception:
            pass
        items.append(RewardRedemptionItem(
            reward_id=reward_id,
            reward_name=reward_name,
            category=category,
            points_cost=cost,
            created_at=e.created_at
        ))

    total_pages = (total + page_size - 1) // page_size
    return RewardRedemptionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{user_id}", response_model=UserPublicProfile)
async def get_user_public_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Obtener perfil público de un usuario"""
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user


@router.get("/{user_id}/items", response_model=List[ItemListItem])
async def get_user_items(
    user_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtener ítems públicos de un usuario"""
    
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Obtener ítems disponibles del usuario
    offset = (page - 1) * page_size
    items = db.query(Item).filter(
        Item.owner_id == user_id,
        Item.is_active == True,
        Item.status == ItemStatus.AVAILABLE
    ).offset(offset).limit(page_size).all()
    
    return items


@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    search_params: UserSearchParams = Depends(),
    db: Session = Depends(get_db)
):
    """Buscar usuarios"""
    
    query = db.query(User).filter(User.is_active == True)
    
    # Filtrar por consulta de texto
    if search_params.query:
        search_term = f"%{search_params.query}%"
        query = query.filter(
            (User.username.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    
    # Filtrar por ubicación
    if search_params.city:
        query = query.filter(User.city.ilike(f"%{search_params.city}%"))
    
    if search_params.state:
        query = query.filter(User.state.ilike(f"%{search_params.state}%"))
    
    if search_params.country:
        query = query.filter(User.country.ilike(f"%{search_params.country}%"))
    
    # Filtrar por verificación
    if search_params.verified_only:
        query = query.filter(User.email_verified == True)
    
    # Filtrar por calificación mínima
    if search_params.min_rating:
        # Subconsulta para obtener usuarios con calificación mínima
        rated_users = db.query(Rating.rated_id).group_by(Rating.rated_id).having(
                db.func.avg(Rating.overall_rating) >= search_params.min_rating
            ).subquery()
        query = query.filter(User.id.in_(rated_users))
    
    # Contar total
    total = query.count()
    
    # Ordenamiento
    if search_params.sort_by == "username":
        if search_params.sort_order == "desc":
            query = query.order_by(User.username.desc())
        else:
            query = query.order_by(User.username.asc())
    elif search_params.sort_by == "created_at":
        if search_params.sort_order == "desc":
            query = query.order_by(User.created_at.desc())
        else:
            query = query.order_by(User.created_at.asc())
    elif search_params.sort_by == "rating":
        # Ordenar por calificación promedio
        if search_params.sort_order == "desc":
            query = query.outerjoin(Rating, User.id == Rating.rated_id).group_by(User.id).order_by(
                db.func.coalesce(db.func.avg(Rating.overall_rating), 0).desc()
            )
        else:
            query = query.outerjoin(Rating, User.id == Rating.rated_id).group_by(User.id).order_by(
                db.func.coalesce(db.func.avg(Rating.overall_rating), 0).asc()
            )
    
    # Paginación
    offset = (search_params.page - 1) * search_params.page_size
    users = query.offset(offset).limit(search_params.page_size).all()
    
    # Calcular páginas
    total_pages = (total + search_params.page_size - 1) // search_params.page_size
    
    return UserSearchResponse(
        users=users,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages,
        has_next=search_params.page < total_pages,
        has_prev=search_params.page > 1
    )


@router.get("/me/items", response_model=List[ItemListItem])
async def get_my_items(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener ítems del usuario actual"""
    
    stmt = select(Item).where(Item.owner_id == current_user.id).options(
        selectinload(Item.owner),
        selectinload(Item.category),
        selectinload(Item.images)
    )
    
    # Filtrar por estado si se especifica
    if status:
        try:
            status_enum = ItemStatus(status)
            stmt = stmt.where(Item.status == status_enum)
        except ValueError:
            pass
    
    # Ordenar por fecha de creación (más recientes primero)
    stmt = stmt.order_by(Item.created_at.desc())
    
    # Paginación
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    item_list = []
    for item in items:
        item_list.append(ItemListItem(
            id=item.id,
            title=item.title,
            condition=item.condition,
            estimated_value=item.estimated_value,
            city=item.owner.city if getattr(item, 'owner', None) else None,
            state=item.owner.state if getattr(item, 'owner', None) else None,
            status=item.status,
            view_count=getattr(item, 'views_count', 0),
            interest_count=getattr(item, 'exchange_requests_count', 0),
            created_at=item.created_at,
            primary_image_url=item.main_image_url,
            owner_username=item.owner.username if getattr(item, 'owner', None) else "Usuario",
            owner_rating=item.owner.reputation_score if getattr(item, 'owner', None) else 0.0,
            category_name=item.category.name if getattr(item, 'category', None) else "General",
            category_icon=item.category.icon if getattr(item, 'category', None) else None,
            category_color=item.category.color if getattr(item, 'category', None) else None,
            distance_km=None,
            condition_display=item.condition_display,
            status_display=item.status_display
        ))
    
    return item_list


@router.get("/me/exchanges", response_model=List[ExchangeListItem])
async def get_my_exchanges(
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None, regex="^(requester|owner|any)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener intercambios del usuario actual"""
    
    stmt = select(Exchange)
    
    # Filtrar por rol del usuario
    if role == "requester":
        stmt = stmt.where(Exchange.requester_id == current_user.id)
    elif role == "owner":
        stmt = stmt.where(Exchange.owner_id == current_user.id)
    else:
        # Cualquier rol (por defecto)
        stmt = stmt.where(
            (Exchange.requester_id == current_user.id) |
            (Exchange.owner_id == current_user.id)
        )
    
    # Filtrar por estado si se especifica
    if status:
        try:
            status_enum = ExchangeStatus(status)
            stmt = stmt.where(Exchange.status == status_enum)
        except ValueError:
            pass
    
    # Ordenar por fecha de actualización (más recientes primero)
    stmt = stmt.order_by(Exchange.updated_at.desc())
    
    # Paginación
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    result = await db.execute(stmt)
    exchanges = result.scalars().all()
    
    exchange_list = []
    for exchange in exchanges:
        other_user_id = exchange.requester_id if exchange.requester_id != current_user.id else exchange.owner_id
        exchange_list.append(ExchangeListItem(
            id=exchange.id,
            status=exchange.status,
            requester_item_title=getattr(exchange.requested_item, 'title', 'Item solicitado'),
            requester_item_image=None,
            owner_item_title=getattr(exchange.offered_item, 'title', 'Item ofrecido'),
            owner_item_image=None,
            other_user_id=other_user_id,
            other_user_username="Usuario",
            other_user_rating=None,
            proposed_cash_difference=None,
            meeting_date=exchange.meeting_datetime,
            created_at=exchange.created_at,
            updated_at=exchange.updated_at,
            status_display=exchange.status_display,
            requires_action=False,
            days_since_created=0
        ))
    
    return exchange_list


@router.put("/me/settings/privacy")
async def update_privacy_settings(
    show_email: Optional[bool] = None,
    show_phone: Optional[bool] = None,
    show_location: Optional[bool] = None,
    allow_messages: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualizar configuraciones de privacidad"""
    
    if show_email is not None:
        current_user.show_email = show_email
    if show_phone is not None:
        current_user.show_phone = show_phone
    if show_location is not None:
        current_user.show_location = show_location
    if allow_messages is not None:
        current_user.allow_messages = allow_messages
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Configuraciones de privacidad actualizadas"}


@router.put("/me/settings/notifications")
async def update_notification_settings(
    email_exchanges: Optional[bool] = None,
    email_messages: Optional[bool] = None,
    email_ratings: Optional[bool] = None,
    push_exchanges: Optional[bool] = None,
    push_messages: Optional[bool] = None,
    push_ratings: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualizar configuraciones de notificaciones"""
    
    if email_exchanges is not None:
        current_user.email_exchanges = email_exchanges
    if email_messages is not None:
        current_user.email_messages = email_messages
    if email_ratings is not None:
        current_user.email_ratings = email_ratings
    if push_exchanges is not None:
        current_user.push_exchanges = push_exchanges
    if push_messages is not None:
        current_user.push_messages = push_messages
    if push_ratings is not None:
        current_user.push_ratings = push_ratings
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Configuraciones de notificaciones actualizadas"}


@router.delete("/me/account")
async def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Eliminar cuenta del usuario (desactivar)"""
    
    # En lugar de eliminar, desactivamos la cuenta
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    
    # Revocar todas las sesiones
    from app.models.user_session import UserSession
    UserSession.revoke_all_user_sessions(db, current_user.id)
    
    db.commit()
    
    return {"message": "Cuenta desactivada exitosamente"}
