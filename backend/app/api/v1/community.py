from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models import User, Item, Exchange, CommunityPost, CommunityPostLike, PostType, ExchangeStatus, Rating
from app.schemas import (
    CommunityStatsResponse, TopUsersResponse, TopUser, ApiUser,
    CommunityPostCreate, CommunityPostList, CommunityPost as CommunityPostSchema,
    PostResponse, LikeResponse, PostAuthor
)
from app.core.dependencies import get_current_user, get_optional_current_user

router = APIRouter()

@router.get("/stats", response_model=CommunityStatsResponse)
async def get_community_stats(
    db: AsyncSession = Depends(get_db)
):
    """Obtener estadísticas generales de la comunidad"""
    
    # Contar usuarios totales activos
    result = await db.execute(select(func.count(User.id)).where(User.is_active == True))
    total_users = result.scalar()
    
    # Contar intercambios totales
    result = await db.execute(select(func.count(Exchange.id)))
    total_exchanges = result.scalar()
    
    # Contar intercambios completados
    result = await db.execute(
        select(func.count(Exchange.id)).where(Exchange.status == ExchangeStatus.COMPLETED)
    )
    completed_exchanges = result.scalar()
    
    # Contar ítems totales activos
    result = await db.execute(
        select(func.count(Item.id)).where(Item.is_available_for_exchange == True)
    )
    total_items = result.scalar()
    
    # Calcular CO2 ahorrado (estimación: 2.3 kg por intercambio completado)
    co2_saved = completed_exchanges * 2.3
    
    return CommunityStatsResponse(
        total_users=total_users,
        total_exchanges=total_exchanges,
        items_saved=total_items,
        co2_reduced=round(co2_saved, 1)
    )

@router.get("/top-users", response_model=TopUsersResponse)
async def get_top_users(
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Obtener los usuarios más activos de la comunidad"""
    
    # Consulta para obtener usuarios con sus estadísticas
    query = (
        select(
            User.id,
            User.username,
            User.first_name,
            User.last_name,
            User.avatar_url,
            User.city,
            User.country,
            User.created_at,
            func.count(Exchange.id).label('exchanges'),
            func.coalesce(func.avg(Rating.overall_rating), 0).label('rating')
        )
        .select_from(User)
        .outerjoin(Exchange, (Exchange.requester_id == User.id) | (Exchange.owner_id == User.id))
        .outerjoin(Rating, Rating.rated_id == User.id)
        .where(User.is_active == True)
        .group_by(User.id, User.username, User.first_name, User.last_name, User.avatar_url, User.city, User.country, User.created_at)
        .order_by(desc('exchanges'), desc('rating'))
        .limit(limit)
    )
    
    result = await db.execute(query)
    users_data = result.all()
    
    top_users = []
    for user in users_data:
        full_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
        top_users.append(TopUser(
            id=str(user.id),
            name=full_name,
            username=user.username,
            avatar=user.avatar_url or '/api/placeholder/60/60',
            location=f"{user.city}, {user.country}" if user.city and user.country else user.city or user.country or "Ubicación no especificada",
            total_exchanges=user.exchanges or 0,
            rating=round(float(user.rating), 1) if user.rating else 0.0,
            join_date=user.created_at.strftime('%Y-%m-%d')
        ))
    
    return TopUsersResponse(
        users=top_users,
        total=len(top_users)
    )

@router.get("/posts", response_model=CommunityPostList)
async def get_community_posts(
    page: int = 1,
    limit: int = 10,
    post_type: PostType = None,
    db: AsyncSession = Depends(get_db)
):
    """Obtener posts de la comunidad con paginación"""
    
    # Validar parámetros
    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 10
    
    offset = (page - 1) * limit
    
    # Construir query base
    query = select(CommunityPost).where(
        CommunityPost.is_active == True,
        CommunityPost.is_approved == True
    )
    
    # Filtrar por tipo si se especifica
    if post_type:
        query = query.where(CommunityPost.post_type == post_type)
    
    # Ordenar por posts fijados primero, luego por fecha
    query = query.order_by(
        desc(CommunityPost.is_pinned),
        desc(CommunityPost.created_at)
    )
    
    # Obtener total de posts
    count_query = select(func.count(CommunityPost.id)).where(
        CommunityPost.is_active == True,
        CommunityPost.is_approved == True
    )
    if post_type:
        count_query = count_query.where(CommunityPost.post_type == post_type)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Obtener posts con paginación
    posts_result = await db.execute(query.offset(offset).limit(limit))
    posts = posts_result.scalars().all()
    
    # Convertir a esquemas con información del autor
    posts_data = []
    for post in posts:
        # Obtener información del autor
        author_result = await db.execute(
            select(User).where(User.id == post.author_id)
        )
        author = author_result.scalar_one_or_none()
        
        if author:
            author_data = PostAuthor(
                id=author.id,
                name=f"{author.first_name} {author.last_name}",
                username=author.username,
                avatar=author.avatar_url or "/api/placeholder/60/60",
                location=f"{author.city or ''}, {author.country or ''}".strip(", ")
            )
            
            post_data = CommunityPostSchema(
                id=post.id,
                author_id=post.author_id,
                author=author_data,
                title=post.title,
                content=post.content,
                post_type=post.post_type,
                image_url=post.image_url,
                likes_count=post.likes_count,
                comments_count=post.comments_count,
                is_active=post.is_active,
                is_pinned=post.is_pinned,
                created_at=post.created_at,
                updated_at=post.updated_at
            )
            posts_data.append(post_data)
    
    return CommunityPostList(
        posts=posts_data,
        total=total,
        page=page,
        limit=limit,
        has_next=(page * limit) < total,
        has_prev=page > 1
    )

@router.post("/posts", response_model=PostResponse)
async def create_community_post(
    post_data: CommunityPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear un nuevo post en la comunidad"""
    
    # Verificar que el usuario esté activo
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo no puede crear posts"
        )
    
    # Crear el post
    new_post = CommunityPost(
        author_id=current_user.id,
        title=post_data.title,
        content=post_data.content,
        post_type=post_data.post_type,
        image_url=post_data.image_url
    )
    
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    # Obtener el post completo con información del autor
    author_data = PostAuthor(
        id=current_user.id,
        name=f"{current_user.first_name} {current_user.last_name}",
        username=current_user.username,
        avatar=current_user.avatar_url or "/api/placeholder/60/60",
        location=f"{current_user.city or ''}, {current_user.country or ''}".strip(", ")
    )
    
    post_response = CommunityPostSchema(
        id=new_post.id,
        author_id=new_post.author_id,
        author=author_data,
        title=new_post.title,
        content=new_post.content,
        post_type=new_post.post_type,
        image_url=new_post.image_url,
        likes_count=new_post.likes_count,
        comments_count=new_post.comments_count,
        is_active=new_post.is_active,
        is_pinned=new_post.is_pinned,
        created_at=new_post.created_at,
        updated_at=new_post.updated_at
    )
    
    return PostResponse(
        message="Post creado exitosamente",
        post=post_response
    )

@router.post("/posts/{post_id}/like", response_model=LikeResponse)
async def toggle_post_like(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dar o quitar like a un post"""
    
    # Verificar que el post existe
    post_result = await db.execute(
        select(CommunityPost).where(
            CommunityPost.id == post_id,
            CommunityPost.is_active == True
        )
    )
    post = post_result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post no encontrado"
        )
    
    # Verificar si ya existe un like del usuario
    like_result = await db.execute(
        select(CommunityPostLike).where(
            CommunityPostLike.post_id == post_id,
            CommunityPostLike.user_id == current_user.id
        )
    )
    existing_like = like_result.scalar_one_or_none()
    
    if existing_like:
        # Quitar like
        await db.delete(existing_like)
        post.decrement_likes()
        liked = False
        message = "Like removido"
    else:
        # Agregar like
        new_like = CommunityPostLike(
            post_id=post.id,
            user_id=current_user.id
        )
        db.add(new_like)
        post.increment_likes()
        liked = True
        message = "Like agregado"
    
    await db.commit()
    await db.refresh(post)
    
    return LikeResponse(
        message=message,
        liked=liked,
        likes_count=post.likes_count
    )