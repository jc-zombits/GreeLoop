from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.notification import Notification, NotificationType, NotificationPriority
from app.schemas.notification import (
    NotificationResponse,
    NotificationListItem,
    NotificationSearchParams,
    NotificationSearchResponse,
    MarkNotificationsReadRequest,
    UserNotificationStats,
    NotificationSettings,
    NotificationSettingsUpdate
)

router = APIRouter(tags=["notifications"])

@router.get("/", response_model=NotificationSearchResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    notification_type: Optional[NotificationType] = None,
    priority: Optional[NotificationPriority] = None,
    is_read: Optional[bool] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener notificaciones del usuario con filtros y paginación"""
    
    # Construir query base
    query = select(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_deleted == False
        )
    )
    
    # Aplicar filtros
    if notification_type:
        query = query.where(Notification.notification_type == notification_type)
    if priority:
        query = query.where(Notification.priority == priority)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
    
    # Contar total
    count_query = select(func.count()).select_from(query.subquery())
    result = await db.execute(count_query)
    total = result.scalar()
    
    # Aplicar paginación y ordenamiento
    query = query.order_by(Notification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    # Ejecutar query
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Calcular estadísticas adicionales
    stats_query = select(
        func.count().filter(Notification.is_read == False).label('unread_count'),
        func.count().filter(Notification.priority == NotificationPriority.HIGH).label('high_priority_count'),
        func.count().filter(Notification.expires_at < datetime.utcnow()).label('expired_count')
    ).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_deleted == False
        )
    )
    
    stats_result = await db.execute(stats_query)
    stats = stats_result.first()
    
    # Convertir a NotificationListItem
    notification_items = []
    for notification in notifications:
        notification_items.append(NotificationListItem(
            id=notification.id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            priority=notification.priority,
            is_read=notification.is_read,
            action_url=notification.action_url,
            action_text=notification.action_text,
            created_at=notification.created_at,
            priority_display=notification.priority_display,
            type_display=notification.type_display,
            time_ago=notification.time_ago
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return NotificationSearchResponse(
        notifications=notification_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
        unread_count=stats.unread_count or 0,
        high_priority_count=stats.high_priority_count or 0,
        expired_count=stats.expired_count or 0
    )

@router.post("/mark-read")
async def mark_notifications_read(
    request: MarkNotificationsReadRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Marcar notificaciones como leídas"""
    
    # Construir query base
    query = select(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_deleted == False,
            Notification.is_read == False
        )
    )
    
    if request.mark_all:
        # Marcar todas las notificaciones como leídas
        if request.notification_type:
            query = query.where(Notification.notification_type == request.notification_type)
    elif request.notification_ids:
        # Marcar notificaciones específicas
        query = query.where(Notification.id.in_(request.notification_ids))
    else:
        raise HTTPException(status_code=400, detail="Debe especificar notification_ids o mark_all")
    
    # Obtener notificaciones a marcar
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Marcar como leídas
    marked_count = 0
    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        marked_count += 1
    
    await db.commit()
    
    return {
        "message": f"{marked_count} notificaciones marcadas como leídas",
        "marked_count": marked_count
    }

@router.get("/stats", response_model=UserNotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener estadísticas de notificaciones del usuario"""
    
    # Estadísticas generales
    general_stats = await db.execute(
        select(
            func.count().label('total'),
            func.count().filter(Notification.is_read == False).label('unread'),
            func.count().filter(Notification.is_read == True).label('read')
        ).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False
            )
        )
    )
    general = general_stats.first()
    
    # Estadísticas por tipo
    type_stats = await db.execute(
        select(
            func.count().filter(Notification.notification_type.in_([
                NotificationType.EXCHANGE_REQUEST,
                NotificationType.EXCHANGE_ACCEPTED,
                NotificationType.EXCHANGE_REJECTED,
                NotificationType.EXCHANGE_COMPLETED
            ])).label('exchange'),
            func.count().filter(Notification.notification_type == NotificationType.NEW_MESSAGE).label('message'),
            func.count().filter(Notification.notification_type == NotificationType.RATING_RECEIVED).label('rating'),
            func.count().filter(Notification.notification_type.in_([
                NotificationType.SYSTEM_ANNOUNCEMENT,
                NotificationType.ACCOUNT_UPDATE,
                NotificationType.SECURITY_ALERT
            ])).label('system')
        ).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False
            )
        )
    )
    types = type_stats.first()
    
    # Estadísticas por prioridad
    priority_stats = await db.execute(
        select(
            func.count().filter(Notification.priority == NotificationPriority.HIGH).label('high'),
            func.count().filter(Notification.priority == NotificationPriority.NORMAL).label('normal'),
            func.count().filter(Notification.priority == NotificationPriority.LOW).label('low')
        ).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False
            )
        )
    )
    priorities = priority_stats.first()
    
    # Estadísticas de tiempo
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    time_stats = await db.execute(
        select(
            func.count().filter(Notification.created_at >= today).label('today'),
            func.count().filter(Notification.created_at >= week_ago).label('week'),
            func.count().filter(Notification.created_at >= month_ago).label('month')
        ).where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_deleted == False
            )
        )
    )
    times = time_stats.first()
    
    return UserNotificationStats(
        total_notifications=general.total or 0,
        unread_notifications=general.unread or 0,
        read_notifications=general.read or 0,
        exchange_notifications=types.exchange or 0,
        message_notifications=types.message or 0,
        rating_notifications=types.rating or 0,
        system_notifications=types.system or 0,
        high_priority_notifications=priorities.high or 0,
        normal_priority_notifications=priorities.normal or 0,
        low_priority_notifications=priorities.low or 0,
        notifications_today=times.today or 0,
        notifications_this_week=times.week or 0,
        notifications_this_month=times.month or 0,
        email_delivery_rate=None,  # TODO: Implementar cuando se tenga sistema de email
        push_delivery_rate=None    # TODO: Implementar cuando se tenga sistema push
    )

@router.get("/settings", response_model=NotificationSettings)
async def get_notification_settings(
    current_user: User = Depends(get_current_active_user)
):
    """Obtener configuraciones de notificaciones del usuario"""
    
    return NotificationSettings(
        email_notifications=getattr(current_user, 'email_notifications', True),
        push_notifications=getattr(current_user, 'push_notifications', True),
        sms_notifications=getattr(current_user, 'sms_notifications', False),
        exchange_notifications=getattr(current_user, 'email_exchanges', True),
        message_notifications=getattr(current_user, 'email_messages', True),
        rating_notifications=getattr(current_user, 'email_ratings', True),
        system_notifications=True,
        marketing_notifications=False
    )

@router.put("/settings")
async def update_notification_settings(
    settings: NotificationSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Actualizar configuraciones de notificaciones del usuario"""
    
    # Actualizar configuraciones que existen en el modelo User
    if settings.exchange_notifications is not None:
        current_user.email_exchanges = settings.exchange_notifications
    if settings.message_notifications is not None:
        current_user.email_messages = settings.message_notifications
    if settings.rating_notifications is not None:
        current_user.email_ratings = settings.rating_notifications
    
    current_user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(current_user)
    
    return {"message": "Configuraciones de notificaciones actualizadas exitosamente"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar una notificación específica"""
    
    # Buscar la notificación
    query = select(Notification).where(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    # Marcar como eliminada (soft delete)
    notification.is_deleted = True
    await db.commit()
    
    return {"message": "Notificación eliminada exitosamente"}