from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, 
    get_current_active_user,
    get_optional_current_user,
    validate_uuid,
    require_admin
)
from app.models.user import User
from app.models.category import Category
from app.models.item import Item, ItemStatus
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListItem,
    PopularCategory,
    CategoryStats,
    CategoryDetailResponse,
    CategorySearchParams,
    CategorySearchResponse,
    CategoryReorderRequest,
    DefaultCategoriesImport,
    ImportResponse,
    CategorySlugCheck,
    SlugAvailabilityResponse,
    CategoryHierarchy,
    CategoryExportFormat,
    CategoryExportResponse
)

router = APIRouter()


@router.get("/", response_model=CategorySearchResponse)
async def get_categories(
    search_params: CategorySearchParams = Depends(),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener lista de categorías"""
    
    query = select(Category)
    
    # Filtrar por estado activo
    if search_params.is_active is not None:
        query = query.filter(Category.is_active == search_params.is_active)
    else:
        # Por defecto, solo mostrar categorías activas
        query = query.filter(Category.is_active == True)
    
    # Filtrar por consulta de texto
    if search_params.query:
        search_term = f"%{search_params.query}%"
        query = query.filter(
            (Category.name.ilike(search_term)) |
            (Category.description.ilike(search_term))
        )
    
    # Filtrar solo categorías con ítems si se especifica
    if search_params.has_items:
        query = query.filter(Category.item_count > 0)
    
    # Contar total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Ordenamiento
    if search_params.sort_by == "name":
        if search_params.sort_order == "desc":
            query = query.order_by(Category.name.desc())
        else:
            query = query.order_by(Category.name.asc())
    elif search_params.sort_by == "item_count":
        if search_params.sort_order == "desc":
            query = query.order_by(Category.item_count.desc())
        else:
            query = query.order_by(Category.item_count.asc())
    elif search_params.sort_by == "created_at":
        if search_params.sort_order == "desc":
            query = query.order_by(Category.created_at.desc())
        else:
            query = query.order_by(Category.created_at.asc())
    else:  # sort_order por defecto
        query = query.order_by(Category.sort_order.asc(), Category.name.asc())
    
    # Paginación
    offset = (search_params.page - 1) * search_params.page_size
    paginated_query = query.offset(offset).limit(search_params.page_size)
    result = await db.execute(paginated_query)
    categories = result.scalars().all()
    total_pages = (total + search_params.page_size - 1) // search_params.page_size
    
    # Mapear categorías a CategoryListItem
    category_list_items = [
        CategoryListItem(
            id=cat.id,
            name=cat.name,
            slug=cat.slug,
            icon=cat.icon,
            color=cat.color,
            image_url=cat.image_url,
            item_count=cat.items_count,  # Mapear items_count a item_count
            is_active=cat.is_active,
            sort_order=cat.sort_order
        )
        for cat in categories
    ]
    
    return CategorySearchResponse(
        categories=category_list_items,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages,
        has_next=search_params.page < total_pages,
        has_prev=search_params.page > 1
    )


@router.get("/popular", response_model=List[PopularCategory])
async def get_popular_categories(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Obtener categorías más populares"""
    
    categories = db.query(Category).filter(
        Category.is_active == True,
        Category.item_count > 0
    ).order_by(
        Category.item_count.desc()
    ).limit(limit).all()
    
    popular_categories = []
    for category in categories:
        # Calcular tendencia (comparar con el mes anterior)
        # TODO: Implementar cálculo real de tendencia
        trend = "up"  # Simulado por ahora
        
        popular_categories.append(PopularCategory(
            id=category.id,
            name=category.name,
            slug=category.slug,
            icon=category.icon,
            color=category.color,
            item_count=category.item_count,
            trend=trend,
            growth_percentage=5.2  # Simulado
        ))
    
    return popular_categories


@router.get("/hierarchy", response_model=List[CategoryHierarchy])
async def get_category_hierarchy(
    db: AsyncSession = Depends(get_db)
):
    """Obtener jerarquía completa de categorías"""
    
    # Obtener categorías raíz
    root_categories = db.query(Category).filter(
        Category.parent_id.is_(None),
        Category.is_active == True
    ).order_by(Category.sort_order.asc()).all()
    
    def build_hierarchy(category: Category) -> CategoryHierarchy:
        # Obtener subcategorías
        children = db.query(Category).filter(
            Category.parent_id == category.id,
            Category.is_active == True
        ).order_by(Category.sort_order.asc()).all()
        
        return CategoryHierarchy(
            id=category.id,
            name=category.name,
            slug=category.slug,
            icon=category.icon,
            color=category.color,
            level=category.level,
            item_count=category.item_count,
            children=[build_hierarchy(child) for child in children]
        )
    
    return [build_hierarchy(category) for category in root_categories]


@router.get("/{category_id}", response_model=CategoryDetailResponse)
async def get_category(
    category_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener detalles de una categoría"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    
    # Si no es admin, solo mostrar categorías activas
    if not (current_user and current_user.is_admin) and not category.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    
    # Obtener categoría padre
    parent_category = None
    if category.parent_id:
        parent_category = db.query(Category).filter(
            Category.id == category.parent_id
        ).first()
    
    # Obtener subcategorías
    subcategories = db.query(Category).filter(
        Category.parent_id == category_id,
        Category.is_active == True
    ).order_by(Category.sort_order.asc()).all()
    
    # Obtener ítems recientes de la categoría
    recent_items = db.query(Item).filter(
        Item.category_id == category_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_available_for_exchange == True
    ).order_by(Item.created_at.desc()).limit(6).all()
    
    # Calcular estadísticas
    total_items = db.query(Item).filter(
        Item.category_id == category_id,
        Item.status == ItemStatus.AVAILABLE
    ).count()
    
    available_items = db.query(Item).filter(
        Item.category_id == category_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    ).count()
    
    # Calcular valor promedio
    avg_value_result = db.query(
        db.func.avg(Item.estimated_value)
    ).filter(
        Item.category_id == category_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.estimated_value.isnot(None)
    ).scalar()
    
    avg_value = float(avg_value_result) if avg_value_result else None
    
    stats = CategoryStats(
        total_items=total_items,
        available_items=available_items,
        average_value=avg_value,
        subcategories_count=len(subcategories)
    )
    
    return CategoryDetailResponse(
        **category.__dict__,
        parent_category=parent_category,
        subcategories=subcategories,
        recent_items=recent_items,
        stats=stats
    )


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva categoría (solo administradores)"""
    
    # Verificar que el slug es único
    existing_category = db.query(Category).filter(
        Category.slug == category_data.slug
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una categoría con ese slug"
        )
    
    # Verificar categoría padre si se especifica
    parent_category = None
    level = 0
    
    if category_data.parent_id:
        parent_category = db.query(Category).filter(
            Category.id == category_data.parent_id,
            Category.is_active == True
        ).first()
        
        if not parent_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría padre no encontrada"
            )
        
        level = parent_category.level + 1
        
        # Limitar profundidad máxima
        if level > 3:  # Máximo 4 niveles (0, 1, 2, 3)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Máximo 4 niveles de categorías permitidos"
            )
    
    # Obtener siguiente orden de clasificación
    max_order = db.query(db.func.max(Category.sort_order)).filter(
        Category.parent_id == category_data.parent_id
    ).scalar() or 0
    
    # Crear la categoría
    new_category = Category(
        **category_data.dict(),
        level=level,
        sort_order=max_order + 1,
        created_by=current_user.id
    )
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_update: CategoryUpdate,
    category_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar una categoría existente (solo administradores)"""
    
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    
    # Verificar slug único si se está cambiando
    if category_update.slug and category_update.slug != category.slug:
        result = await db.execute(
            select(Category).where(
                Category.slug == category_update.slug,
                Category.id != category_id
            )
        )
        existing_category = result.scalar_one_or_none()
        
        if existing_category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con ese slug"
            )
    
    # Verificar categoría padre si se está cambiando
    if category_update.parent_id is not None:
        if category_update.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Una categoría no puede ser padre de sí misma"
            )
        
        if category_update.parent_id:
            result = await db.execute(
                select(Category).where(
                    Category.id == category_update.parent_id,
                    Category.is_active == True
                )
            )
            parent_category = result.scalar_one_or_none()
            
            if not parent_category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría padre no encontrada"
                )
            
            # Verificar que no se cree un ciclo
            async def check_cycle(parent_id: UUID, target_id: UUID) -> bool:
                if parent_id == target_id:
                    return True
                result = await db.execute(select(Category).where(Category.id == parent_id))
                parent = result.scalar_one_or_none()
                if parent and parent.parent_id:
                    return await check_cycle(parent.parent_id, target_id)
                return False
            
            if await check_cycle(category_update.parent_id, category_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se puede crear un ciclo en la jerarquía de categorías"
                )
    
    # Actualizar campos
    update_data = category_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    category.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(category)
    
    return category


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar una categoría (solo administradores)"""
    
    category = db.query(Category).filter(Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )
    
    # Verificar que no tiene ítems activos
    active_items = db.query(Item).filter(
        Item.category_id == category_id,
        Item.status == ItemStatus.AVAILABLE
    ).count()
    
    if active_items > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar una categoría con {active_items} ítems activos"
        )
    
    # Verificar que no tiene subcategorías activas
    active_subcategories = db.query(Category).filter(
        Category.parent_id == category_id,
        Category.is_active == True
    ).count()
    
    if active_subcategories > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar una categoría con {active_subcategories} subcategorías activas"
        )
    
    # Marcar como inactiva en lugar de eliminar
    category.is_active = False
    category.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Categoría eliminada exitosamente"}


@router.post("/reorder")
async def reorder_categories(
    reorder_data: CategoryReorderRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Reordenar categorías (solo administradores)"""
    
    # Actualizar orden de las categorías
    for order_data in reorder_data.category_orders:
        category = db.query(Category).filter(
            Category.id == order_data["id"]
        ).first()
        
        if category:
            category.sort_order = order_data["sort_order"]
    
    db.commit()
    
    return {"message": "Orden de categorías actualizado"}


@router.post("/check-slug", response_model=SlugAvailabilityResponse)
async def check_slug_availability(
    slug_check: CategorySlugCheck,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Verificar disponibilidad de slug"""
    
    existing_category = db.query(Category).filter(
        Category.slug == slug_check.slug
    )
    
    # Excluir la categoría actual si se está editando
    if slug_check.exclude_id:
        existing_category = existing_category.filter(
            Category.id != slug_check.exclude_id
        )
    
    is_available = existing_category.first() is None
    
    suggestions = []
    if not is_available:
        # Generar sugerencias de slug
        base_slug = slug_check.slug
        for i in range(1, 6):
            suggested_slug = f"{base_slug}-{i}"
            if not db.query(Category).filter(Category.slug == suggested_slug).first():
                suggestions.append(suggested_slug)
    
    return SlugAvailabilityResponse(
        slug=slug_check.slug,
        is_available=is_available,
        suggestions=suggestions
    )


@router.post("/import-defaults", response_model=ImportResponse)
async def import_default_categories(
    import_data: DefaultCategoriesImport,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Importar categorías por defecto (solo administradores)"""
    
    # Categorías por defecto
    default_categories = [
        {
            "name": "Electrónicos",
            "slug": "electronicos",
            "description": "Dispositivos electrónicos y gadgets",
            "icon": "📱",
            "color": "#3B82F6",
            "subcategories": [
                {"name": "Teléfonos", "slug": "telefonos", "icon": "📱"},
                {"name": "Computadoras", "slug": "computadoras", "icon": "💻"},
                {"name": "Audio", "slug": "audio", "icon": "🎧"},
                {"name": "Gaming", "slug": "gaming", "icon": "🎮"}
            ]
        },
        {
            "name": "Ropa y Accesorios",
            "slug": "ropa-accesorios",
            "description": "Prendas de vestir y accesorios de moda",
            "icon": "👕",
            "color": "#EC4899",
            "subcategories": [
                {"name": "Ropa Hombre", "slug": "ropa-hombre", "icon": "👔"},
                {"name": "Ropa Mujer", "slug": "ropa-mujer", "icon": "👗"},
                {"name": "Zapatos", "slug": "zapatos", "icon": "👟"},
                {"name": "Accesorios", "slug": "accesorios", "icon": "👜"}
            ]
        },
        {
            "name": "Hogar y Jardín",
            "slug": "hogar-jardin",
            "description": "Artículos para el hogar y jardín",
            "icon": "🏠",
            "color": "#10B981",
            "subcategories": [
                {"name": "Muebles", "slug": "muebles", "icon": "🪑"},
                {"name": "Decoración", "slug": "decoracion", "icon": "🖼️"},
                {"name": "Jardín", "slug": "jardin", "icon": "🌱"},
                {"name": "Herramientas", "slug": "herramientas", "icon": "🔧"}
            ]
        },
        {
            "name": "Deportes y Recreación",
            "slug": "deportes-recreacion",
            "description": "Equipos deportivos y artículos de recreación",
            "icon": "⚽",
            "color": "#F59E0B",
            "subcategories": [
                {"name": "Fitness", "slug": "fitness", "icon": "🏋️"},
                {"name": "Deportes", "slug": "deportes", "icon": "⚽"},
                {"name": "Outdoor", "slug": "outdoor", "icon": "🏕️"},
                {"name": "Bicicletas", "slug": "bicicletas", "icon": "🚴"}
            ]
        },
        {
            "name": "Libros y Medios",
            "slug": "libros-medios",
            "description": "Libros, películas, música y medios",
            "icon": "📚",
            "color": "#8B5CF6",
            "subcategories": [
                {"name": "Libros", "slug": "libros", "icon": "📖"},
                {"name": "Películas", "slug": "peliculas", "icon": "🎬"},
                {"name": "Música", "slug": "musica", "icon": "🎵"},
                {"name": "Videojuegos", "slug": "videojuegos", "icon": "🎮"}
            ]
        },
        {
            "name": "Vehículos",
            "slug": "vehiculos",
            "description": "Vehículos y accesorios automotrices",
            "icon": "🚗",
            "color": "#EF4444",
            "subcategories": [
                {"name": "Autos", "slug": "autos", "icon": "🚗"},
                {"name": "Motos", "slug": "motos", "icon": "🏍️"},
                {"name": "Accesorios Auto", "slug": "accesorios-auto", "icon": "🔧"},
                {"name": "Repuestos", "slug": "repuestos", "icon": "⚙️"}
            ]
        }
    ]
    
    created_count = 0
    skipped_count = 0
    
    try:
        for cat_data in default_categories:
            # Verificar si ya existe
            existing = db.query(Category).filter(
                Category.slug == cat_data["slug"]
            ).first()
            
            if existing and not import_data.overwrite_existing:
                skipped_count += 1
                continue
            
            if existing and import_data.overwrite_existing:
                # Actualizar existente
                for field, value in cat_data.items():
                    if field != "subcategories":
                        setattr(existing, field, value)
                existing.updated_at = datetime.utcnow()
                parent_category = existing
            else:
                # Crear nueva
                parent_category = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    icon=cat_data["icon"],
                    color=cat_data["color"],
                    level=0,
                    sort_order=created_count,
                    created_by=current_user.id
                )
                db.add(parent_category)
                created_count += 1
            
            db.commit()
            db.refresh(parent_category)
            
            # Crear subcategorías
            for i, subcat_data in enumerate(cat_data.get("subcategories", [])):
                existing_sub = db.query(Category).filter(
                    Category.slug == subcat_data["slug"]
                ).first()
                
                if existing_sub and not import_data.overwrite_existing:
                    continue
                
                if existing_sub and import_data.overwrite_existing:
                    existing_sub.parent_id = parent_category.id
                    existing_sub.name = subcat_data["name"]
                    existing_sub.icon = subcat_data["icon"]
                    existing_sub.level = 1
                    existing_sub.sort_order = i
                    existing_sub.updated_at = datetime.utcnow()
                else:
                    subcategory = Category(
                        name=subcat_data["name"],
                        slug=subcat_data["slug"],
                        icon=subcat_data["icon"],
                        parent_id=parent_category.id,
                        level=1,
                        sort_order=i,
                        created_by=current_user.id
                    )
                    db.add(subcategory)
                    created_count += 1
        
        db.commit()
        
        return ImportResponse(
            success=True,
            message=f"Importación completada. {created_count} categorías creadas/actualizadas, {skipped_count} omitidas.",
            created_count=created_count,
            skipped_count=skipped_count
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante la importación: {str(e)}"
        )


@router.get("/export/{format}", response_model=CategoryExportResponse)
async def export_categories(
    format: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Exportar categorías (solo administradores)"""
    
    # Validar formato
    try:
        format_enum = CategoryExportFormat(format)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de exportación no válido"
        )
    
    categories = db.query(Category).filter(
        Category.is_active == True
    ).order_by(Category.level.asc(), Category.sort_order.asc()).all()
    
    if format_enum == CategoryExportFormat.JSON:
        # Exportar como JSON
        export_data = []
        for category in categories:
            export_data.append({
                "id": str(category.id),
                "name": category.name,
                "slug": category.slug,
                "description": category.description,
                "icon": category.icon,
                "color": category.color,
                "parent_id": str(category.parent_id) if category.parent_id else None,
                "level": category.level,
                "sort_order": category.sort_order,
                "item_count": category.item_count,
                "is_active": category.is_active,
                "created_at": category.created_at.isoformat(),
                "updated_at": category.updated_at.isoformat() if category.updated_at else None
            })
        
        return CategoryExportResponse(
            format=format,
            data=export_data,
            filename=f"categories_export_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json",
            total_records=len(export_data)
        )
    
    elif format_enum == CategoryExportFormat.CSV:
        # TODO: Implementar exportación CSV
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Exportación CSV no implementada aún"
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de exportación no válido"
        )