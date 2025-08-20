from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID
import os
import shutil
from datetime import datetime
from PIL import Image

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, 
    get_current_active_user,
    get_optional_current_user,
    validate_uuid
)
from app.core.config import settings
from app.models.user import User
from app.models.item import Item, ItemStatus, ItemCondition
from app.models.item_image import ItemImage
from app.models.category import Category
from app.models.exchange import Exchange
from app.schemas.item import (
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemListItem,
    ItemSearchParams,
    ItemSearchResponse,
    ItemInterestRequest,
    ItemInterestResponse,
    ItemReportRequest,
    ItemFavoriteResponse,
    ItemImageUploadResponse,
    ItemImageReorderRequest,
    ItemImageUpdate,
    ItemStatusUpdate,
    ItemDuplicateRequest,
    RelatedItemsResponse,
    ItemStats
)

router = APIRouter()


def save_item_image(file: UploadFile, item_id: UUID) -> tuple[str, dict]:
    """Guardar imagen de ítem y retornar URL y metadatos"""
    
    # Crear directorio de ítems si no existe
    items_dir = os.path.join(settings.UPLOAD_DIR, "items")
    os.makedirs(items_dir, exist_ok=True)
    
    # Generar nombre único para el archivo
    file_extension = os.path.splitext(file.filename)[1].lower()
    filename = f"{item_id}_{datetime.utcnow().timestamp()}{file_extension}"
    file_path = os.path.join(items_dir, filename)
    
    # Guardar archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Obtener dimensiones de la imagen
    try:
        with Image.open(file_path) as img:
            width, height = img.size
    except Exception:
        width, height = None, None
    
    # Obtener tamaño del archivo
    file_size = os.path.getsize(file_path)
    
    url = f"/uploads/items/{filename}"
    metadata = {
        "width": width,
        "height": height,
        "file_size": file_size,
        "original_filename": file.filename
    }
    
    return url, metadata


@router.post("/", response_model=ItemResponse)
async def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear un nuevo ítem"""
    
    # Verificar que la categoría existe
    category_query = select(Category).filter(
        Category.id == item_data.category_id,
        Category.is_active == True
    )
    result = await db.execute(category_query)
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    
    # Mapear datos del esquema al modelo
    item_dict = item_data.dict()
    
    # Mapear ubicación de city, state, country a location_description
    location_parts = []
    if item_dict.get('city'):
        location_parts.append(item_dict['city'])
    if item_dict.get('state'):
        location_parts.append(item_dict['state'])
    if item_dict.get('country'):
        location_parts.append(item_dict['country'])
    
    # Crear el ítem con campos mapeados
    new_item = Item(
        title=item_dict['title'],
        description=item_dict['description'],
        category_id=item_dict['category_id'],
        condition=item_dict['condition'],
        estimated_value=item_dict.get('estimated_value'),
        location_description=', '.join(location_parts) if location_parts else item_dict.get('location_description'),
        latitude=item_dict.get('latitude'),
        longitude=item_dict.get('longitude'),
        allow_partial_exchange=item_dict.get('accepts_cash_difference', False),
        exchange_preferences=item_dict.get('exchange_preferences'),
        owner_id=current_user.id,
        status=ItemStatus.AVAILABLE
    )
    
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    # Actualizar contador de ítems en la categoría
    await category.update_items_count(db)
    
    # Construir respuesta manualmente
    response_data = {
        "id": new_item.id,
        "title": new_item.title,
        "description": new_item.description,
        "category_id": new_item.category_id,
        "condition": new_item.condition,
        "estimated_value": new_item.estimated_value,
        "owner_id": new_item.owner_id,
        "status": new_item.status,
        "slug": str(new_item.id),  # Usar ID como slug temporal
        "view_count": new_item.views_count,
        "interest_count": new_item.exchange_requests_count,
        "created_at": new_item.created_at,
        "updated_at": new_item.updated_at,
        "location_description": new_item.location_description,
        "latitude": new_item.latitude,
        "longitude": new_item.longitude,
        "allow_partial_exchange": new_item.allow_partial_exchange,
        "owner": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email
        },
        "category": {
            "id": category.id,
            "name": category.name,
            "slug": category.slug
        },
        "images": [],
        "condition_display": new_item.condition.value,
        "status_display": new_item.status.value
    }
    
    return response_data


@router.get("/", response_model=ItemSearchResponse)
async def search_items(
    search_params: ItemSearchParams = Depends(),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Buscar ítems"""
    
    query = select(Item, User.username, User.reputation_score, User.city, User.state, Category.name, Category.icon, Category.color).join(
        User, Item.owner_id == User.id
    ).join(
        Category, Item.category_id == Category.id
    ).filter(
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    )
    
    # Filtrar por consulta de texto
    if search_params.query:
        search_term = f"%{search_params.query}%"
        query = query.filter(
            (Item.title.ilike(search_term)) |
            (Item.description.ilike(search_term))
        )
    
    # Filtrar por categoría
    if search_params.category_id:
        query = query.filter(Item.category_id == search_params.category_id)
    
    # Filtrar por condición
    if search_params.condition:
        query = query.filter(Item.condition == search_params.condition)
    
    # Filtrar por rango de valor
    if search_params.min_value:
        query = query.filter(Item.estimated_value >= search_params.min_value)
    if search_params.max_value:
        query = query.filter(Item.estimated_value <= search_params.max_value)
    
    # Filtrar por ubicación
    if search_params.city:
        query = query.filter(Item.city.ilike(f"%{search_params.city}%"))
    if search_params.state:
        query = query.filter(Item.state.ilike(f"%{search_params.state}%"))
    if search_params.country:
        query = query.filter(Item.country.ilike(f"%{search_params.country}%"))
    
    # Filtrar por diferencia en efectivo
    if search_params.accepts_cash_difference is not None:
        query = query.filter(Item.accepts_cash_difference == search_params.accepts_cash_difference)
    
    # Filtrar por fechas
    if search_params.created_after:
        query = query.filter(Item.created_at >= search_params.created_after)
    if search_params.created_before:
        query = query.filter(Item.created_at <= search_params.created_before)
    
    # Excluir ítems del usuario actual si está autenticado
    if current_user:
        query = query.filter(Item.owner_id != current_user.id)
    
    # Contar total con los mismos filtros
    count_query = select(func.count(Item.id)).select_from(
        Item.__table__.join(User.__table__, Item.owner_id == User.id).join(Category.__table__, Item.category_id == Category.id)
    ).filter(
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    )
    
    # Aplicar los mismos filtros que en la consulta principal
    if search_params.query:
        search_term = f"%{search_params.query}%"
        count_query = count_query.filter(
            (Item.title.ilike(search_term)) |
            (Item.description.ilike(search_term))
        )
    
    if search_params.category_id:
        count_query = count_query.filter(Item.category_id == search_params.category_id)
    
    if search_params.condition:
        count_query = count_query.filter(Item.condition == search_params.condition)
    
    if search_params.min_value:
        count_query = count_query.filter(Item.estimated_value >= search_params.min_value)
    if search_params.max_value:
        count_query = count_query.filter(Item.estimated_value <= search_params.max_value)
    
    if search_params.city:
        count_query = count_query.filter(Item.city.ilike(f"%{search_params.city}%"))
    if search_params.state:
        count_query = count_query.filter(Item.state.ilike(f"%{search_params.state}%"))
    if search_params.country:
        count_query = count_query.filter(Item.country.ilike(f"%{search_params.country}%"))
    
    if search_params.accepts_cash_difference is not None:
        count_query = count_query.filter(Item.accepts_cash_difference == search_params.accepts_cash_difference)
    
    if search_params.created_after:
        count_query = count_query.filter(Item.created_at >= search_params.created_after)
    if search_params.created_before:
        count_query = count_query.filter(Item.created_at <= search_params.created_before)
    
    if current_user:
        count_query = count_query.filter(Item.owner_id != current_user.id)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Ordenamiento
    if search_params.sort_by == "title":
        if search_params.sort_order == "desc":
            query = query.order_by(Item.title.desc())
        else:
            query = query.order_by(Item.title.asc())
    elif search_params.sort_by == "estimated_value":
        if search_params.sort_order == "desc":
            query = query.order_by(Item.estimated_value.desc().nulls_last())
        else:
            query = query.order_by(Item.estimated_value.asc().nulls_last())
    elif search_params.sort_by == "view_count":
        if search_params.sort_order == "desc":
            query = query.order_by(Item.views_count.desc())
        else:
            query = query.order_by(Item.views_count.asc())
    elif search_params.sort_by == "updated_at":
        if search_params.sort_order == "desc":
            query = query.order_by(Item.updated_at.desc())
        else:
            query = query.order_by(Item.updated_at.asc())
    else:  # created_at por defecto
        if search_params.sort_order == "desc":
            query = query.order_by(Item.created_at.desc())
        else:
            query = query.order_by(Item.created_at.asc())
    
    # Paginación
    offset = (search_params.page - 1) * search_params.page_size
    items_query = query.offset(offset).limit(search_params.page_size)
    items_result = await db.execute(items_query)
    raw_items = items_result.all()
    
    # Procesar los resultados para crear objetos ItemListItem
    items = []
    for row in raw_items:
        item, username, reputation_score, city, state, category_name, category_icon, category_color = row
        
        # Obtener imagen principal
        primary_image_query = select(ItemImage.image_url).filter(
            ItemImage.item_id == item.id,
            ItemImage.is_primary == True
        ).limit(1)
        primary_image_result = await db.execute(primary_image_query)
        primary_image_url = primary_image_result.scalar()
        
        item_data = ItemListItem(
            id=item.id,
            title=item.title,
            condition=item.condition,
            estimated_value=item.estimated_value,
            city=city,
            state=state,
            status=item.status,
            view_count=item.views_count,
            interest_count=item.favorites_count,
            created_at=item.created_at,
            primary_image_url=primary_image_url,
            owner_username=username,
            owner_rating=reputation_score,
            category_name=category_name,
            category_icon=category_icon,
            category_color=category_color,
            condition_display=item.condition.value.replace('_', ' ').title(),
            status_display=item.status.value.replace('_', ' ').title()
        )
        items.append(item_data)
    
    # Calcular páginas
    total_pages = (total + search_params.page_size - 1) // search_params.page_size
    
    # Obtener categorías sugeridas basadas en la búsqueda
    suggested_categories = []
    if search_params.query:
        categories_query = select(Category).filter(
            Category.name.ilike(f"%{search_params.query}%"),
            Category.is_active == True
        ).limit(5)
        categories_result = await db.execute(categories_query)
        categories = categories_result.scalars().all()
        suggested_categories = [{
            "id": str(cat.id),
            "name": cat.name,
            "item_count": cat.item_count
        } for cat in categories]
    
    # Obtener ciudades cercanas
    nearby_cities = []
    if search_params.city:
        cities = db.query(Item.city).filter(
            Item.city.ilike(f"%{search_params.city}%"),
            Item.city.isnot(None),
            Item.status == ItemStatus.AVAILABLE
        ).distinct().limit(5).all()
        nearby_cities = [city[0] for city in cities if city[0]]
    
    return ItemSearchResponse(
        items=items,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages,
        has_next=search_params.page < total_pages,
        has_prev=search_params.page > 1,
        search_params=search_params.dict(),
        suggested_categories=suggested_categories,
        nearby_cities=nearby_cities
    )


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener detalles de un ítem"""
    
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado"
        )
    
    # Verificar si el ítem está disponible (a menos que sea el propietario)
    if current_user and current_user.id != item.owner_id:
        if item.status != ItemStatus.AVAILABLE or not item.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ítem no disponible"
            )
    
    # Incrementar contador de vistas (solo si no es el propietario)
    if not current_user or current_user.id != item.owner_id:
        item.increment_views()
        db.commit()
    
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_update: ItemUpdate,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar un ítem"""
    
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos para editarlo"
        )
    
    # Verificar que la nueva categoría existe (si se está cambiando)
    if item_update.category_id and item_update.category_id != item.category_id:
        category = db.query(Category).filter(
            Category.id == item_update.category_id,
            Category.is_active == True
        ).first()
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada"
            )
    
    # Actualizar campos
    update_data = item_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    return item


@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar un ítem (cambiar estado a removido)"""
    
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos para eliminarlo"
        )
    
    # Verificar que no hay intercambios activos
    active_exchanges = db.query(Exchange).filter(
        (Exchange.requester_item_id == item_id) | (Exchange.owner_item_id == item_id),
        Exchange.status.in_(["pending", "accepted", "meeting_arranged"])
    ).count()
    
    if active_exchanges > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un ítem con intercambios activos"
        )
    
    # Cambiar estado a removido
    item.status = ItemStatus.REMOVED
    item.is_available_for_exchange = False
    item.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Ítem eliminado exitosamente"}


@router.post("/{item_id}/images", response_model=ItemImageUploadResponse)
async def upload_item_image(
    item_id: str,
    file: UploadFile = File(...),
    alt_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Subir imagen para un ítem"""
    
    # Verificar que el ítem existe y pertenece al usuario
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
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
    
    # Verificar límite de imágenes por ítem
    current_images = db.query(ItemImage).filter(ItemImage.item_id == item_id).count()
    if current_images >= 10:  # Límite de 10 imágenes por ítem
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Máximo 10 imágenes por ítem"
        )
    
    try:
        # Guardar imagen
        url, metadata = save_item_image(file, item_id)
        
        # Determinar si es la primera imagen (será primaria)
        is_primary = current_images == 0
        
        # Crear registro en la base de datos
        item_image = ItemImage(
            item_id=item_id,
            url=url,
            original_filename=metadata["original_filename"],
            file_size=metadata["file_size"],
            width=metadata["width"],
            height=metadata["height"],
            is_primary=is_primary,
            sort_order=current_images,
            alt_text=alt_text
        )
        
        db.add(item_image)
        db.commit()
        db.refresh(item_image)
        
        return ItemImageUploadResponse(
            id=item_image.id,
            url=item_image.url,
            thumbnail_url=item_image.get_thumbnail_url(),
            original_filename=item_image.original_filename,
            file_size=item_image.file_size,
            width=item_image.width or 0,
            height=item_image.height or 0,
            is_primary=item_image.is_primary,
            sort_order=item_image.sort_order
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar la imagen"
        )


@router.put("/{item_id}/images/{image_id}", response_model=ItemImageUploadResponse)
async def update_item_image(
    image_update: ItemImageUpdate,
    item_id: str,
    image_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar información de una imagen"""
    
    # Verificar que el ítem existe y pertenece al usuario
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Buscar la imagen
    image = db.query(ItemImage).filter(
        ItemImage.id == image_id,
        ItemImage.item_id == item_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada"
        )
    
    # Actualizar campos
    if image_update.alt_text is not None:
        image.alt_text = image_update.alt_text
    
    if image_update.is_primary is not None and image_update.is_primary:
        # Si se marca como primaria, desmarcar las demás
        ItemImage.set_primary(db, item_id, image_id)
    
    image.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(image)
    
    return ItemImageUploadResponse(
        id=image.id,
        url=image.url,
        thumbnail_url=image.get_thumbnail_url(),
        original_filename=image.original_filename,
        file_size=image.file_size,
        width=image.width or 0,
        height=image.height or 0,
        is_primary=image.is_primary,
        sort_order=image.sort_order
    )


@router.delete("/{item_id}/images/{image_id}")
async def delete_item_image(
    item_id: str,
    image_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar una imagen de un ítem"""
    
    # Verificar que el ítem existe y pertenece al usuario
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Buscar la imagen
    image = db.query(ItemImage).filter(
        ItemImage.id == image_id,
        ItemImage.item_id == item_id
    ).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada"
        )
    
    # Intentar eliminar el archivo físico
    try:
        file_path = os.path.join(settings.UPLOAD_DIR, image.url.lstrip('/uploads/'))
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass  # No fallar si no se puede eliminar el archivo
    
    # Eliminar de la base de datos
    db.delete(image)
    
    # Si era la imagen primaria, establecer otra como primaria
    if image.is_primary:
        remaining_images = db.query(ItemImage).filter(
            ItemImage.item_id == item_id
        ).order_by(ItemImage.sort_order).first()
        
        if remaining_images:
            remaining_images.is_primary = True
    
    db.commit()
    
    return {"message": "Imagen eliminada exitosamente"}


@router.post("/{item_id}/images/reorder")
async def reorder_item_images(
    reorder_data: ItemImageReorderRequest,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Reordenar imágenes de un ítem"""
    
    # Verificar que el ítem existe y pertenece al usuario
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Actualizar orden de las imágenes
    for order_data in reorder_data.image_orders:
        image = db.query(ItemImage).filter(
            ItemImage.id == order_data["id"],
            ItemImage.item_id == item_id
        ).first()
        
        if image:
            image.sort_order = order_data["sort_order"]
    
    db.commit()
    
    return {"message": "Orden de imágenes actualizado"}


@router.post("/{item_id}/interest", response_model=ItemInterestResponse)
async def express_interest(
    interest_data: ItemInterestRequest,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Expresar interés en un ítem"""
    
    # Verificar que el ítem existe y está disponible
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_available_for_exchange == True
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no disponible"
        )
    
    # Verificar que no es el propietario
    if item.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes expresar interés en tu propio ítem"
        )
    
    # Verificar que los ítems propuestos existen y pertenecen al usuario
    if interest_data.proposed_items:
        user_items = db.query(Item).filter(
            Item.id.in_(interest_data.proposed_items),
            Item.owner_id == current_user.id,
            Item.status == ItemStatus.AVAILABLE,
            Item.is_active == True
        ).all()
        
        if len(user_items) != len(interest_data.proposed_items):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Algunos de los ítems propuestos no son válidos"
            )
    
    # Incrementar contador de interés
    item.favorites_count += 1
    
    # TODO: Crear intercambio o mensaje según la lógica de negocio
    # Por ahora, solo incrementamos el contador
    
    db.commit()
    
    return ItemInterestResponse(
        success=True,
        message="Interés expresado exitosamente",
        exchange_id=None  # Se asignaría si se crea un intercambio
    )


@router.post("/{item_id}/report")
async def report_item(
    report_data: ItemReportRequest,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Reportar un ítem"""
    
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado"
        )
    
    # TODO: Implementar sistema de reportes
    # Por ahora, solo retornamos un mensaje de confirmación
    
    return {
        "message": "Reporte enviado exitosamente",
        "reference_number": f"RPT-{datetime.utcnow().timestamp()}"
    }


@router.post("/{item_id}/favorite", response_model=ItemFavoriteResponse)
async def toggle_favorite(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Agregar/quitar de favoritos"""
    
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado"
        )
    
    # TODO: Implementar sistema de favoritos
    # Por ahora, retornamos una respuesta simulada
    
    return ItemFavoriteResponse(
        is_favorite=True,
        total_favorites=1
    )


@router.get("/{item_id}/related", response_model=RelatedItemsResponse)
async def get_related_items(
    item_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Obtener ítems relacionados"""
    
    item = db.query(Item).filter(Item.id == item_id).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado"
        )
    
    # Ítems similares (misma categoría, excluyendo el actual)
    similar_items = db.query(Item).filter(
        Item.category_id == item.category_id,
        Item.id != item_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    ).limit(6).all()
    
    # Otros ítems del mismo propietario
    same_owner_items = db.query(Item).filter(
        Item.owner_id == item.owner_id,
        Item.id != item_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    ).limit(4).all()
    
    # Ítems cercanos (misma ciudad)
    nearby_items = []
    if item.city:
        nearby_items = db.query(Item).filter(
            Item.city == item.city,
            Item.id != item_id,
            Item.owner_id != item.owner_id,
            Item.status == ItemStatus.AVAILABLE,
            Item.is_active == True
        ).limit(4).all()
    
    return RelatedItemsResponse(
        similar_items=similar_items,
        same_category_items=similar_items,  # Mismo que similar por ahora
        same_owner_items=same_owner_items,
        nearby_items=nearby_items
    )


@router.get("/{item_id}/stats", response_model=ItemStats)
async def get_item_stats(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener estadísticas de un ítem (solo propietario)"""
    
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Calcular estadísticas
    days_since_created = (datetime.utcnow() - item.created_at).days
    average_daily_views = item.views_count / max(days_since_created, 1)
    
    # Contar solicitudes de intercambio
    exchange_requests = db.query(Exchange).filter(
        Exchange.owner_item_id == item_id
    ).count()
    
    return ItemStats(
        total_views=item.views_count,
            unique_views=item.views_count,  # Por ahora igual al total
        total_interests=item.favorites_count,
        exchange_requests=exchange_requests,
        days_since_created=days_since_created,
        average_daily_views=round(average_daily_views, 2)
    )


@router.put("/{item_id}/status", response_model=ItemResponse)
async def update_item_status(
    status_data: ItemStatusUpdate,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar estado de un ítem"""
    
    item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Actualizar estado
    item.status = status_update.status
    
    # Si se pausa o remueve, marcar como no disponible
    if status_update.status in [ItemStatus.PAUSED, ItemStatus.REMOVED]:
        item.is_available_for_exchange = False
    elif status_update.status == ItemStatus.AVAILABLE:
        item.is_available_for_exchange = True
    
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    
    return item


@router.post("/{item_id}/duplicate", response_model=ItemResponse)
async def duplicate_item(
    duplicate_data: ItemDuplicateRequest,
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicar un ítem"""
    
    original_item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not original_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado o no tienes permisos"
        )
    
    # Crear copia del ítem
    new_title = original_item.title
    if duplicate_data.title_suffix:
        new_title += f" - {duplicate_data.title_suffix}"
    else:
        new_title += " - Copia"
    
    new_item = Item(
        title=new_title,
        description=original_item.description,
        category_id=original_item.category_id,
        condition=original_item.condition,
        estimated_value=original_item.estimated_value,
        city=original_item.city,
        state=original_item.state,
        country=original_item.country,
        latitude=original_item.latitude,
        longitude=original_item.longitude,
        is_available_for_exchange=True,
        accepts_cash_difference=original_item.accepts_cash_difference,
        max_cash_difference=original_item.max_cash_difference,
        preferred_categories=original_item.preferred_categories,
        exchange_preferences=original_item.exchange_preferences,
        show_exact_location=original_item.show_exact_location,
        owner_id=current_user.id,
        status=ItemStatus.AVAILABLE
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    # Copiar imágenes si se solicita
    if duplicate_data.copy_images:
        original_images = db.query(ItemImage).filter(
            ItemImage.item_id == item_id
        ).order_by(ItemImage.sort_order).all()
        
        for i, orig_image in enumerate(original_images):
            # TODO: Implementar copia física de archivos de imagen
            # Por ahora, solo copiamos las referencias
            new_image = ItemImage(
                item_id=new_item.id,
                url=orig_image.url,
                original_filename=orig_image.original_filename,
                file_size=orig_image.file_size,
                width=orig_image.width,
                height=orig_image.height,
                is_primary=(i == 0),
                sort_order=i,
                alt_text=orig_image.alt_text
            )
            db.add(new_image)
    
    db.commit()
    db.refresh(new_item)
    
    return new_item