from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
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
from app.models.item import Item
from app.models.exchange import Exchange
from app.models.rating import Rating
from app.schemas.user import (
    UserResponse,
    UserDetailResponse,
    UserUpdate,
    UserPublicProfile,
    UserListItem,
    UserStats,
    UserSearchParams,
    UserSearchResponse
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
    db: Session = Depends(get_db)
):
    """Obtener estadísticas del usuario"""
    
    # Contar ítems
    total_items = db.query(Item).filter(Item.owner_id == current_user.id).count()
    active_items = db.query(Item).filter(
        Item.owner_id == current_user.id,
        Item.is_available_for_exchange == True
    ).count()
    
    # Contar intercambios
    total_exchanges = db.query(Exchange).filter(
        (Exchange.requester_id == current_user.id) | 
        (Exchange.owner_id == current_user.id)
    ).count()
    
    completed_exchanges = db.query(Exchange).filter(
        (Exchange.requester_id == current_user.id) | 
        (Exchange.owner_id == current_user.id),
        Exchange.status == "completed"
    ).count()
    
    # Calcular tasa de éxito
    success_rate = (completed_exchanges / total_exchanges * 100) if total_exchanges > 0 else 0
    
    # Obtener calificación promedio
    avg_rating = db.query(Rating).filter(
        Rating.rated_user_id == current_user.id
    ).with_entities(
        db.func.avg(Rating.overall_rating)
    ).scalar() or 0
    
    # Contar calificaciones
    total_ratings = db.query(Rating).filter(
        Rating.rated_user_id == current_user.id
    ).count()
    
    return UserStats(
        total_items=total_items,
        active_items=active_items,
        total_exchanges=total_exchanges,
        completed_exchanges=completed_exchanges,
        success_rate=round(success_rate, 2),
        average_rating=round(float(avg_rating), 2),
        total_ratings=total_ratings,
        member_since=current_user.created_at,
        last_active=current_user.updated_at
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
        Item.is_available_for_exchange == True,
        Item.status == "active"
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
        rated_users = db.query(Rating.rated_user_id).group_by(Rating.rated_user_id).having(
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
            query = query.outerjoin(Rating, User.id == Rating.rated_user_id).group_by(User.id).order_by(
                db.func.coalesce(db.func.avg(Rating.overall_rating), 0).desc()
            )
        else:
            query = query.outerjoin(Rating, User.id == Rating.rated_user_id).group_by(User.id).order_by(
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
    db: Session = Depends(get_db)
):
    """Obtener ítems del usuario actual"""
    
    query = db.query(Item).filter(Item.owner_id == current_user.id)
    
    # Filtrar por estado si se especifica
    if status:
        query = query.filter(Item.status == status)
    
    # Ordenar por fecha de creación (más recientes primero)
    query = query.order_by(Item.created_at.desc())
    
    # Paginación
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    return items


@router.get("/me/exchanges", response_model=List[ExchangeListItem])
async def get_my_exchanges(
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None, regex="^(requester|owner|any)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener intercambios del usuario actual"""
    
    query = db.query(Exchange)
    
    # Filtrar por rol del usuario
    if role == "requester":
        query = query.filter(Exchange.requester_id == current_user.id)
    elif role == "owner":
        query = query.filter(Exchange.owner_id == current_user.id)
    else:
        # Cualquier rol (por defecto)
        query = query.filter(
            (Exchange.requester_id == current_user.id) |
            (Exchange.owner_id == current_user.id)
        )
    
    # Filtrar por estado si se especifica
    if status:
        query = query.filter(Exchange.status == status)
    
    # Ordenar por fecha de actualización (más recientes primero)
    query = query.order_by(Exchange.updated_at.desc())
    
    # Paginación
    offset = (page - 1) * page_size
    exchanges = query.offset(offset).limit(page_size).all()
    
    return exchanges


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