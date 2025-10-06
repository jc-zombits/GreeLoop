from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import require_admin, require_owner_admin, validate_uuid
from app.models.user import User
from app.models.admin_user import AdminUser
from app.models.item import Item, ItemStatus
from app.schemas.user import UserListItem, UserResponse, UserUpdate
from app.schemas.item import ItemListItem, ItemStatusUpdate
from app.schemas.admin import AdminRoleUpdate

router = APIRouter()


@router.get('/users', response_model=list[UserListItem])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Listar usuarios (admin)"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    # Mapear a esquema UserListItem
    response = []
    for u in users:
        response.append(UserListItem(
            id=u.id,
            username=u.username,
            first_name=u.first_name,
            last_name=u.last_name,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            city=u.city,
            is_active=u.is_active,
            reputation_score=u.reputation_score,
            total_exchanges=u.total_exchanges
        ))
    return response


@router.get('/users/{user_id}', response_model=UserResponse)
async def get_user_detail(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Obtener detalle de usuario (admin)"""
    uid: UUID = validate_uuid(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return UserResponse.model_validate(user)


@router.patch('/users/{user_id}', response_model=UserResponse)
async def update_user_admin(
    user_id: str,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Actualizar usuario (admin)"""
    uid: UUID = validate_uuid(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    # Aplicar cambios permitidos
    data = update_data.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.put('/users/{user_id}', response_model=UserResponse)
async def update_user_admin_put(
    user_id: str,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Actualizar usuario (admin) usando PUT"""
    uid: UUID = validate_uuid(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    # Aplicar cambios permitidos
    data = update_data.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete('/users/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Eliminar usuario (admin) - soft delete"""
    uid: UUID = validate_uuid(user_id)
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    user.is_active = False
    await db.commit()
    return None


@router.patch('/users/{user_id}/admin')
async def update_user_admin_role(
    user_id: str,
    role_update: AdminRoleUpdate,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner_admin)
):
    """Otorgar o revocar rol administrador. Restringido al propietario."""
    uid: UUID = validate_uuid(user_id)

    # No permitir auto-revocación del propietario a sí mismo
    if owner.id == uid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Operación no permitida sobre el propietario")

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if role_update.make_admin:
        # Crear registro si no existe
        exists = await db.execute(select(AdminUser).where(AdminUser.user_id == uid))
        admin_entry = exists.scalar_one_or_none()
        if admin_entry is None:
            admin_entry = AdminUser(user_id=uid)
            db.add(admin_entry)
            await db.commit()
        return {"message": "Usuario promovido a administrador"}
    else:
        # Revocar si existe
        exists = await db.execute(select(AdminUser).where(AdminUser.user_id == uid))
        admin_entry = exists.scalar_one_or_none()
        if admin_entry is not None:
            await db.delete(admin_entry)
            await db.commit()
        return {"message": "Privilegios de administrador revocados"}


@router.get('/items', response_model=list[ItemListItem])
async def list_items_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Listar ítems (admin)"""
    result = await db.execute(select(Item))
    items = result.scalars().all()
    response = []
    for it in items:
        response.append(ItemListItem(
            id=it.id,
            title=it.title,
            slug=str(it.id),
            condition=it.condition,
            status=it.status,
            view_count=it.views_count,
            interest_count=it.exchange_requests_count,
            owner_id=it.owner_id,
            category_id=it.category_id,
            created_at=it.created_at,
            updated_at=it.updated_at
        ))
    return response


@router.patch('/items/{item_id}/status', response_model=ItemListItem)
async def update_item_status_admin(
    item_id: str,
    status_update: ItemStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Actualizar estado de ítem (admin)"""
    iid: UUID = validate_uuid(item_id)
    result = await db.execute(select(Item).where(Item.id == iid))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem no encontrado")
    if status_update.status:
        item.status = status_update.status
    await db.commit()
    await db.refresh(item)
    return ItemListItem(
        id=item.id,
        title=item.title,
        slug=str(item.id),
        condition=item.condition,
        status=item.status,
        view_count=item.views_count,
        interest_count=item.exchange_requests_count,
        owner_id=item.owner_id,
        category_id=item.category_id,
        created_at=item.created_at,
        updated_at=item.updated_at
    )


@router.put('/items/{item_id}/status', response_model=ItemListItem)
async def update_item_status_admin_put(
    item_id: str,
    status_update: ItemStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Actualizar estado de ítem (admin) usando PUT"""
    iid: UUID = validate_uuid(item_id)
    result = await db.execute(select(Item).where(Item.id == iid))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem no encontrado")
    if status_update.status:
        item.status = status_update.status
    await db.commit()
    await db.refresh(item)
    return ItemListItem(
        id=item.id,
        title=item.title,
        slug=str(item.id),
        condition=item.condition,
        status=item.status,
        view_count=item.views_count,
        interest_count=item.exchange_requests_count,
        owner_id=item.owner_id,
        category_id=item.category_id,
        created_at=item.created_at,
        updated_at=item.updated_at
    )