from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional
import math

from app.core.database import get_db
from app.models import (
    User,
    Company,
    Item,
    Exchange,
    CommunityPost,
    CommunityPostLike,
    CommunityFeedPost,
    CommunityFeedLike,
    CommunityFeedComment,
    CommunityActorType,
    CommunityMediaType,
    PostType,
    ExchangeStatus,
    Rating,
)
from app.schemas import (
    CommunityStatsResponse, TopUsersResponse, TopUser, ApiUser,
    CommunityPostCreate, CommunityPostList, CommunityPost as CommunityPostSchema,
    PostResponse, LikeResponse, PostAuthor,
    FeedPostCreate, FeedPostList, FeedPost,
    FeedCommentCreate, FeedCommentList, FeedComment,
    ToggleLikeResponse, ShareResponse, FeedAuthor, ActorType, MediaType
)
from app.core.dependencies import get_current_user, get_optional_current_user, get_current_actor, get_optional_actor, CurrentActor

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


def _format_location(city: Optional[str], state: Optional[str], country: Optional[str] = None) -> str:
    parts = [p for p in [city, state, country] if p]
    return ", ".join(parts) if parts else "Colombia"


def _user_display_name(user: User) -> str:
    name = f"{user.first_name or ''} {user.last_name or ''}".strip()
    return name if name else user.username


@router.get("/feed", response_model=FeedPostList)
async def list_feed_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_actor: Optional[CurrentActor] = Depends(get_optional_actor),
    db: AsyncSession = Depends(get_db)
):
    total_q = select(func.count(CommunityFeedPost.id)).where(CommunityFeedPost.is_active == True)
    total_res = await db.execute(total_q)
    total = total_res.scalar() or 0

    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    offset = (page - 1) * page_size

    posts_q = (
        select(CommunityFeedPost)
        .where(CommunityFeedPost.is_active == True)
        .order_by(CommunityFeedPost.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    posts_res = await db.execute(posts_q)
    posts = posts_res.scalars().all()

    user_ids = set()
    company_ids = set()
    for p in posts:
        if p.author_type == CommunityActorType.USER:
            user_ids.add(p.author_id)
        else:
            company_ids.add(p.author_id)

    users_by_id = {}
    companies_by_id = {}
    if user_ids:
        ures = await db.execute(select(User).where(User.id.in_(list(user_ids))))
        users_by_id = {u.id: u for u in ures.scalars().all()}
    if company_ids:
        cres = await db.execute(select(Company).where(Company.id.in_(list(company_ids))))
        companies_by_id = {c.id: c for c in cres.scalars().all()}

    liked_post_ids = set()
    if current_actor is not None and posts:
        like_q = select(CommunityFeedLike.post_id).where(
            CommunityFeedLike.post_id.in_([p.id for p in posts]),
            CommunityFeedLike.actor_type == CommunityActorType(current_actor.actor_type),
            CommunityFeedLike.actor_id == current_actor.id
        )
        like_res = await db.execute(like_q)
        liked_post_ids = set(like_res.scalars().all())

    response_posts = []
    for p in posts:
        if p.author_type == CommunityActorType.USER:
            u = users_by_id.get(p.author_id)
            author = FeedAuthor(
                id=str(p.author_id),
                actor_type=ActorType.user,
                name=_user_display_name(u) if u else "Usuario",
                username=u.username if u else "usuario",
                avatar=u.avatar_url if u and u.avatar_url else "/api/placeholder/48/48",
                location=_format_location(u.city if u else None, u.state if u else None, u.country if u else None)
            )
        else:
            c = companies_by_id.get(p.author_id)
            author = FeedAuthor(
                id=str(p.author_id),
                actor_type=ActorType.company,
                name=c.company_name if c else "Empresa",
                username=c.username if c else "empresa",
                avatar=c.logo_url if c and c.logo_url else "/api/placeholder/48/48",
                location=_format_location(c.city if c else None, c.state if c else None, c.country if c else None)
            )

        response_posts.append(FeedPost(
            id=str(p.id),
            title=p.title,
            content=p.content,
            post_type=p.post_type.value if hasattr(p.post_type, "value") else "general",
            media_type=p.media_type.value if hasattr(p.media_type, "value") else "none",
            media_url=p.media_url,
            author=author,
            likes_count=p.likes_count,
            comments_count=p.comments_count,
            shares_count=p.shares_count,
            created_at=p.created_at,
            is_liked=p.id in liked_post_ids
        ))

    return FeedPostList(
        posts=response_posts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.post("/feed", response_model=FeedPost)
async def create_feed_post(
    post_data: FeedPostCreate,
    current_actor: CurrentActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    if post_data.media_type != MediaType.none and not post_data.media_url:
        raise HTTPException(status_code=400, detail="media_url es requerido cuando media_type no es none")

    post = CommunityFeedPost(
        author_type=CommunityActorType(current_actor.actor_type),
        author_id=current_actor.id,
        title=post_data.title,
        content=post_data.content,
        post_type=PostType(post_data.post_type.value),
        media_type=CommunityMediaType(post_data.media_type.value),
        media_url=post_data.media_url
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    if current_actor.actor_type == "user":
        u = current_actor.user
        author = FeedAuthor(
            id=str(u.id),
            actor_type=ActorType.user,
            name=_user_display_name(u),
            username=u.username,
            avatar=u.avatar_url or "/api/placeholder/48/48",
            location=_format_location(u.city, u.state, u.country)
        )
    else:
        c = current_actor.company
        author = FeedAuthor(
            id=str(c.id),
            actor_type=ActorType.company,
            name=c.company_name,
            username=c.username,
            avatar=c.logo_url or "/api/placeholder/48/48",
            location=_format_location(c.city, c.state, c.country)
        )

    return FeedPost(
        id=str(post.id),
        title=post.title,
        content=post.content,
        post_type=post.post_type.value,
        media_type=post.media_type.value,
        media_url=post.media_url,
        author=author,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        shares_count=post.shares_count,
        created_at=post.created_at,
        is_liked=False
    )


@router.post("/feed/{post_id}/like", response_model=ToggleLikeResponse)
async def toggle_feed_like(
    post_id: UUID,
    current_actor: CurrentActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    post_res = await db.execute(
        select(CommunityFeedPost).where(
            CommunityFeedPost.id == post_id,
            CommunityFeedPost.is_active == True
        )
    )
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    like_res = await db.execute(
        select(CommunityFeedLike).where(
            CommunityFeedLike.post_id == post_id,
            CommunityFeedLike.actor_type == CommunityActorType(current_actor.actor_type),
            CommunityFeedLike.actor_id == current_actor.id
        )
    )
    existing_like = like_res.scalar_one_or_none()

    if existing_like:
        await db.delete(existing_like)
        post.decrement_likes()
        liked = False
    else:
        db.add(CommunityFeedLike(
            post_id=post_id,
            actor_type=CommunityActorType(current_actor.actor_type),
            actor_id=current_actor.id
        ))
        post.increment_likes()
        liked = True

    await db.commit()
    await db.refresh(post)
    return ToggleLikeResponse(liked=liked, likes_count=post.likes_count)


@router.post("/feed/{post_id}/share", response_model=ShareResponse)
async def register_feed_share(
    post_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    post_res = await db.execute(
        select(CommunityFeedPost).where(
            CommunityFeedPost.id == post_id,
            CommunityFeedPost.is_active == True
        )
    )
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    post.increment_shares()
    await db.commit()
    await db.refresh(post)
    return ShareResponse(shares_count=post.shares_count)


@router.get("/feed/{post_id}/comments", response_model=FeedCommentList)
async def list_feed_comments(
    post_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    total_q = select(func.count(CommunityFeedComment.id)).where(
        CommunityFeedComment.post_id == post_id,
        CommunityFeedComment.is_active == True
    )
    total_res = await db.execute(total_q)
    total = total_res.scalar() or 0

    total_pages = max(1, math.ceil(total / page_size)) if total else 1
    offset = (page - 1) * page_size

    comments_q = (
        select(CommunityFeedComment)
        .where(CommunityFeedComment.post_id == post_id, CommunityFeedComment.is_active == True)
        .order_by(CommunityFeedComment.created_at.asc())
        .offset(offset)
        .limit(page_size)
    )
    comments_res = await db.execute(comments_q)
    comments = comments_res.scalars().all()

    user_ids = set()
    company_ids = set()
    for c in comments:
        if c.actor_type == CommunityActorType.USER:
            user_ids.add(c.actor_id)
        else:
            company_ids.add(c.actor_id)

    users_by_id = {}
    companies_by_id = {}
    if user_ids:
        ures = await db.execute(select(User).where(User.id.in_(list(user_ids))))
        users_by_id = {u.id: u for u in ures.scalars().all()}
    if company_ids:
        cres = await db.execute(select(Company).where(Company.id.in_(list(company_ids))))
        companies_by_id = {c.id: c for c in cres.scalars().all()}

    items = []
    for c in comments:
        if c.actor_type == CommunityActorType.USER:
            u = users_by_id.get(c.actor_id)
            author = FeedAuthor(
                id=str(c.actor_id),
                actor_type=ActorType.user,
                name=_user_display_name(u) if u else "Usuario",
                username=u.username if u else "usuario",
                avatar=u.avatar_url if u and u.avatar_url else "/api/placeholder/48/48",
                location=_format_location(u.city if u else None, u.state if u else None, u.country if u else None)
            )
        else:
            comp = companies_by_id.get(c.actor_id)
            author = FeedAuthor(
                id=str(c.actor_id),
                actor_type=ActorType.company,
                name=comp.company_name if comp else "Empresa",
                username=comp.username if comp else "empresa",
                avatar=comp.logo_url if comp and comp.logo_url else "/api/placeholder/48/48",
                location=_format_location(comp.city if comp else None, comp.state if comp else None, comp.country if comp else None)
            )

        items.append(FeedComment(
            id=str(c.id),
            post_id=str(c.post_id),
            author=author,
            content=c.content,
            created_at=c.created_at
        ))

    return FeedCommentList(
        comments=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/feed/{post_id}/comments", response_model=FeedComment)
async def create_feed_comment(
    post_id: UUID,
    comment: FeedCommentCreate,
    current_actor: CurrentActor = Depends(get_current_actor),
    db: AsyncSession = Depends(get_db)
):
    post_res = await db.execute(
        select(CommunityFeedPost).where(
            CommunityFeedPost.id == post_id,
            CommunityFeedPost.is_active == True
        )
    )
    post = post_res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post no encontrado")

    c = CommunityFeedComment(
        post_id=post_id,
        actor_type=CommunityActorType(current_actor.actor_type),
        actor_id=current_actor.id,
        content=comment.content
    )
    db.add(c)
    post.increment_comments()
    await db.commit()
    await db.refresh(c)

    if current_actor.actor_type == "user":
        u = current_actor.user
        author = FeedAuthor(
            id=str(u.id),
            actor_type=ActorType.user,
            name=_user_display_name(u),
            username=u.username,
            avatar=u.avatar_url or "/api/placeholder/48/48",
            location=_format_location(u.city, u.state, u.country)
        )
    else:
        comp = current_actor.company
        author = FeedAuthor(
            id=str(comp.id),
            actor_type=ActorType.company,
            name=comp.company_name,
            username=comp.username,
            avatar=comp.logo_url or "/api/placeholder/48/48",
            location=_format_location(comp.city, comp.state, comp.country)
        )

    return FeedComment(
        id=str(c.id),
        post_id=str(post_id),
        author=author,
        content=c.content,
        created_at=c.created_at
    )
