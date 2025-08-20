from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user, 
    get_current_active_user,
    validate_uuid
)
from app.models.user import User
from app.models.item import Item, ItemStatus
from app.models.exchange import Exchange, ExchangeStatus
from app.models.message import Message, MessageType
from app.schemas.exchange import (
    ExchangeCreate,
    ExchangeResponse,
    ExchangeDetailResponse,
    ExchangeListItem,
    ExchangeSearchParams,
    ExchangeSearchResponse,
    ExchangeUpdate,
    MeetingInfoUpdate,
    MeetingConfirmation,
    ExchangeCompletion,
    ExchangeCancellation,
    ExchangeTimelineEvent,
    ExchangeTimelineResponse,
    ExchangeNotificationSettings,
    ExchangeReminderSettings,
    ExchangeReportRequest,
    ExchangeMetrics,
    ExchangeSuggestion,
    UserExchangeStats
)
from app.schemas.exchange_simple import ExchangeCreateResponse

router = APIRouter()


@router.post("/", response_model=ExchangeCreateResponse)
async def create_exchange(
    exchange_data: ExchangeCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Crear una nueva solicitud de intercambio"""
    
    # Verificar que el ítem solicitado existe y está disponible
    requested_item_query = select(Item).filter(
        Item.id == exchange_data.owner_item_id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    )
    result = await db.execute(requested_item_query)
    requested_item = result.scalar_one_or_none()
    
    if not requested_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem solicitado no encontrado o no disponible"
        )
    
    # Verificar que no es el propietario del ítem
    if requested_item.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes crear un intercambio con tu propio ítem"
        )
    
    # Verificar que el ítem ofrecido existe y le pertenece
    offered_item_query = select(Item).filter(
        Item.id == exchange_data.requester_item_id,
        Item.owner_id == current_user.id,
        Item.status == ItemStatus.AVAILABLE,
        Item.is_active == True
    )
    result = await db.execute(offered_item_query)
    offered_item = result.scalar_one_or_none()
    
    if not offered_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tu ítem no fue encontrado o no está disponible"
        )
    
    # Verificar que no hay un intercambio pendiente entre los mismos ítems
    existing_exchange_query = select(Exchange).filter(
        Exchange.requested_item_id == exchange_data.owner_item_id,
        Exchange.offered_item_id == exchange_data.requester_item_id,
        Exchange.status.in_([ExchangeStatus.PENDING, ExchangeStatus.ACCEPTED, ExchangeStatus.CONFIRMED])
    )
    result = await db.execute(existing_exchange_query)
    existing_exchange = result.scalar_one_or_none()
    
    if existing_exchange:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un intercambio activo entre estos ítems"
        )
    
    # Validar diferencia en efectivo si se especifica
    # TODO: Implementar campos accepts_cash_difference y max_cash_difference en el modelo Item
    # if exchange_data.cash_difference:
    #     if not owner_item.accepts_cash_difference:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="El propietario del ítem no acepta diferencias en efectivo"
    #         )
    #     
    #     if owner_item.max_cash_difference and abs(exchange_data.cash_difference) > owner_item.max_cash_difference:
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail=f"La diferencia en efectivo excede el máximo permitido ({owner_item.max_cash_difference})"
    #         )
    
    # Crear el intercambio
    new_exchange = Exchange(
        requested_item_id=exchange_data.owner_item_id,
        offered_item_id=exchange_data.requester_item_id,
        requester_id=current_user.id,
        owner_id=requested_item.owner_id,
        initial_message=exchange_data.message,
        status=ExchangeStatus.PENDING
    )
    
    db.add(new_exchange)
    await db.commit()
    await db.refresh(new_exchange)
    
    # Crear mensaje inicial si se proporcionó
    if exchange_data.message:
        initial_message = Message(
            exchange_id=new_exchange.id,
            sender_id=current_user.id,
            receiver_id=requested_item.owner_id,
            content=exchange_data.message,
            message_type=MessageType.TEXT
        )
        db.add(initial_message)
        await db.commit()
    
    # TODO: Enviar notificación al propietario del ítem
    
    return new_exchange


@router.get("/", response_model=ExchangeSearchResponse)
async def get_exchanges(
    search_params: ExchangeSearchParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Obtener intercambios del usuario"""
    
    # Consulta básica para obtener intercambios del usuario
    stmt = select(Exchange).where(
        (Exchange.requester_id == current_user.id) | (Exchange.requested_item_id.in_(
            select(Item.id).where(Item.owner_id == current_user.id)
        ))
    )
    
    # Filtrar por estado si se especifica
    if search_params.status:
        stmt = stmt.where(Exchange.status == search_params.status)
    
    # Ordenar por fecha de creación (más recientes primero)
    stmt = stmt.order_by(Exchange.created_at.desc())
    
    # Ejecutar consulta
    result = await db.execute(stmt)
    exchanges = result.scalars().all()
    
    # Por simplicidad, devolvemos una respuesta básica
    total = len(exchanges)
    
    # Calcular páginas
    total_pages = max(1, (total + search_params.page_size - 1) // search_params.page_size)
    
    # Aplicar paginación manualmente
    start_idx = (search_params.page - 1) * search_params.page_size
    end_idx = start_idx + search_params.page_size
    paginated_exchanges = exchanges[start_idx:end_idx]
    
    # Crear lista simplificada de intercambios
    exchange_list = []
    for exchange in paginated_exchanges:
        exchange_list.append(ExchangeListItem(
            id=exchange.id,
            status=exchange.status,
            requester_item_title="Item solicitado",
            requester_item_image=None,
            owner_item_title="Item ofrecido", 
            owner_item_image=None,
            other_user_id=exchange.requester_id if exchange.requester_id != current_user.id else current_user.id,
            other_user_username="Usuario",
            other_user_rating=None,
            proposed_cash_difference=exchange.additional_payment_amount,
            meeting_date=exchange.meeting_datetime,
            created_at=exchange.created_at,
            updated_at=exchange.updated_at,
            status_display=exchange.status.value,
            requires_action=False,
            days_since_created=0
        ))
    
    return ExchangeSearchResponse(
        exchanges=exchange_list,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=total_pages,
        has_next=search_params.page < total_pages,
        has_prev=search_params.page > 1,
        status_counts={},
        pending_actions=0
    )


@router.get("/{exchange_id}", response_model=ExchangeDetailResponse)
async def get_exchange(
    exchange_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Validate UUID format
    try:
        exchange_uuid = UUID(exchange_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid exchange ID format")
    """Obtener detalles de un intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_uuid,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    # Obtener mensajes del intercambio
    messages = db.query(Message).filter(
        Message.exchange_id == exchange_uuid
    ).order_by(Message.created_at.asc()).all()
    
    # Marcar mensajes como leídos
    unread_messages = db.query(Message).filter(
        Message.exchange_id == exchange_uuid,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).all()
    
    for message in unread_messages:
        message.is_read = True
        message.read_at = datetime.utcnow()
    
    if unread_messages:
        db.commit()
    
    return ExchangeDetailResponse(
        **exchange.__dict__,
        messages=messages,
        unread_count=0  # Ya se marcaron como leídos
    )


@router.put("/{exchange_id}", response_model=ExchangeResponse)
async def update_exchange(
    exchange_update: ExchangeUpdate,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualizar un intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    # Solo el propietario puede aceptar/rechazar
    if exchange_update.status in [ExchangeStatus.ACCEPTED, ExchangeStatus.REJECTED]:
        if current_user.id != exchange.owner_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el propietario puede aceptar o rechazar el intercambio"
            )
        
        if exchange.status != ExchangeStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se pueden aceptar/rechazar intercambios pendientes"
            )
    
    # Actualizar campos permitidos
    if exchange_update.status:
        exchange.status = exchange_update.status
    
    if exchange_update.meeting_date:
        exchange.meeting_date = exchange_update.meeting_date
    
    if exchange_update.meeting_location:
        exchange.meeting_location = exchange_update.meeting_location
    
    if exchange_update.notes:
        exchange.notes = exchange_update.notes
    
    exchange.updated_at = datetime.utcnow()
    
    # Actualizar fecha de estado si cambió
    if exchange_update.status:
        if exchange_update.status == ExchangeStatus.ACCEPTED:
            exchange.accepted_at = datetime.utcnow()
        elif exchange_update.status == ExchangeStatus.REJECTED:
            exchange.rejected_at = datetime.utcnow()
        elif exchange_update.status == ExchangeStatus.COMPLETED:
            exchange.completed_at = datetime.utcnow()
        elif exchange_update.status == ExchangeStatus.CANCELLED:
            exchange.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación a la otra parte
    
    return exchange


@router.post("/{exchange_id}/accept", response_model=ExchangeResponse)
async def accept_exchange(
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Aceptar un intercambio"""
    
    stmt = select(Exchange).where(
        Exchange.id == exchange_id,
        Exchange.owner_id == current_user.id,
        Exchange.status == ExchangeStatus.PENDING
    )
    result = await db.execute(stmt)
    exchange = result.scalar_one_or_none()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado o no puedes aceptarlo"
        )
    
    exchange.status = ExchangeStatus.ACCEPTED
    exchange.accepted_at = datetime.utcnow()
    exchange.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(exchange)
    
    # TODO: Enviar notificación al solicitante
    
    return ExchangeResponse(
        action="accept",
        message="Intercambio aceptado exitosamente",
        counter_cash_difference=None
    )


@router.post("/{exchange_id}/reject", response_model=ExchangeResponse)
async def reject_exchange(
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Rechazar un intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        Exchange.owner_id == current_user.id,
        Exchange.status == ExchangeStatus.PENDING
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado o no puedes rechazarlo"
        )
    
    exchange.status = ExchangeStatus.REJECTED
    exchange.rejected_at = datetime.utcnow()
    exchange.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación al solicitante
    
    return exchange


@router.post("/{exchange_id}/meeting", response_model=ExchangeResponse)
async def arrange_meeting(
    meeting_info: MeetingInfoUpdate,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Organizar encuentro para el intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id),
        Exchange.status == ExchangeStatus.ACCEPTED
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado o no está en estado aceptado"
        )
    
    # Actualizar información del encuentro
    exchange.meeting_date = meeting_info.meeting_date
    exchange.meeting_location = meeting_info.meeting_location
    exchange.meeting_notes = meeting_info.meeting_notes
    exchange.status = ExchangeStatus.MEETING_ARRANGED
    exchange.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación a ambas partes
    
    return exchange


@router.post("/{exchange_id}/confirm", response_model=ExchangeResponse)
async def confirm_exchange(
    confirmation: MeetingConfirmation,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirmar que el intercambio se realizó"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id),
        Exchange.status == ExchangeStatus.MEETING_ARRANGED
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado o no está listo para confirmar"
        )
    
    # Marcar confirmación del usuario actual
    if current_user.id == exchange.requester_id:
        exchange.requester_confirmed = True
        exchange.requester_confirmed_at = datetime.utcnow()
    else:
        exchange.owner_confirmed = True
        exchange.owner_confirmed_at = datetime.utcnow()
    
    # Si ambos confirmaron, marcar como completado
    if exchange.requester_confirmed and exchange.owner_confirmed:
        exchange.status = ExchangeStatus.COMPLETED
        exchange.completed_at = datetime.utcnow()
        
        # Marcar ítems como intercambiados
        requester_item = db.query(Item).filter(Item.id == exchange.requester_item_id).first()
        owner_item = db.query(Item).filter(Item.id == exchange.owner_item_id).first()
        
        if requester_item:
            requester_item.status = ItemStatus.EXCHANGED
            requester_item.is_available_for_exchange = False
        
        if owner_item:
            owner_item.status = ItemStatus.EXCHANGED
            owner_item.is_available_for_exchange = False
    
    exchange.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación a la otra parte
    
    return exchange


@router.post("/{exchange_id}/complete", response_model=ExchangeResponse)
async def complete_exchange(
    completion: ExchangeCompletion,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Completar un intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    if exchange.status != ExchangeStatus.MEETING_ARRANGED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El intercambio debe estar en estado 'encuentro organizado' para completarse"
        )
    
    # Completar intercambio
    exchange.status = ExchangeStatus.COMPLETED
    exchange.completed_at = datetime.utcnow()
    exchange.completion_notes = completion.notes
    exchange.updated_at = datetime.utcnow()
    
    # Marcar ítems como intercambiados
    requester_item = db.query(Item).filter(Item.id == exchange.requester_item_id).first()
    owner_item = db.query(Item).filter(Item.id == exchange.owner_item_id).first()
    
    if requester_item:
        requester_item.status = ItemStatus.EXCHANGED
        requester_item.is_available_for_exchange = False
    
    if owner_item:
        owner_item.status = ItemStatus.EXCHANGED
        owner_item.is_available_for_exchange = False
    
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación para calificar el intercambio
    
    return exchange


@router.post("/{exchange_id}/cancel", response_model=ExchangeResponse)
async def cancel_exchange(
    cancellation: ExchangeCancellation,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancelar un intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    if exchange.status in [ExchangeStatus.COMPLETED, ExchangeStatus.CANCELLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar un intercambio completado o ya cancelado"
        )
    
    # Cancelar intercambio
    exchange.status = ExchangeStatus.CANCELLED
    exchange.cancelled_at = datetime.utcnow()
    exchange.cancellation_reason = cancellation.reason
    exchange.cancellation_notes = cancellation.notes
    exchange.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(exchange)
    
    # TODO: Enviar notificación a la otra parte
    
    return exchange


@router.get("/{exchange_id}/timeline", response_model=List[ExchangeTimelineEvent])
async def get_exchange_timeline(
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener línea de tiempo del intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    timeline = []
    
    # Evento de creación
    timeline.append(ExchangeTimelineEvent(
        event_type="created",
        timestamp=exchange.created_at,
        description="Intercambio creado",
        user_id=exchange.requester_id
    ))
    
    # Evento de aceptación
    if exchange.accepted_at:
        timeline.append(ExchangeTimelineEvent(
            event_type="accepted",
            timestamp=exchange.accepted_at,
            description="Intercambio aceptado",
            user_id=exchange.owner_id
        ))
    
    # Evento de rechazo
    if exchange.rejected_at:
        timeline.append(ExchangeTimelineEvent(
            event_type="rejected",
            timestamp=exchange.rejected_at,
            description="Intercambio rechazado",
            user_id=exchange.owner_id
        ))
    
    # Evento de encuentro organizado
    if exchange.status == ExchangeStatus.MEETING_ARRANGED:
        timeline.append(ExchangeTimelineEvent(
            event_type="meeting_arranged",
            timestamp=exchange.updated_at,
            description="Encuentro organizado",
            user_id=None
        ))
    
    # Evento de finalización
    if exchange.completed_at:
        timeline.append(ExchangeTimelineEvent(
            event_type="completed",
            timestamp=exchange.completed_at,
            description="Intercambio completado",
            user_id=None
        ))
    
    # Evento de cancelación
    if exchange.cancelled_at:
        timeline.append(ExchangeTimelineEvent(
            event_type="cancelled",
            timestamp=exchange.cancelled_at,
            description="Intercambio cancelado",
            user_id=None
        ))
    
    # Ordenar por fecha
    timeline.sort(key=lambda x: x.timestamp)
    
    return timeline


@router.post("/{exchange_id}/report")
async def report_exchange_problem(
    problem_report: ExchangeReportRequest,
    exchange_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reportar un problema con el intercambio"""
    
    exchange = db.query(Exchange).filter(
        Exchange.id == exchange_id,
        (Exchange.requester_id == current_user.id) | (Exchange.owner_id == current_user.id)
    ).first()
    
    if not exchange:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intercambio no encontrado"
        )
    
    # TODO: Implementar sistema de reportes
    # Por ahora, solo retornamos confirmación
    
    return {
        "message": "Reporte enviado exitosamente",
        "reference_number": f"EXC-RPT-{datetime.utcnow().timestamp()}",
        "support_contact": "support@greenloop.com"
    }


@router.get("/stats/user", response_model=UserExchangeStats)
async def get_user_exchange_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de intercambios del usuario"""
    
    # Estadísticas como solicitante
    requester_stats = {
        "total": db.query(Exchange).filter(Exchange.requester_id == current_user.id).count(),
        "pending": db.query(Exchange).filter(
            Exchange.requester_id == current_user.id,
            Exchange.status == ExchangeStatus.PENDING
        ).count(),
        "accepted": db.query(Exchange).filter(
            Exchange.requester_id == current_user.id,
            Exchange.status == ExchangeStatus.ACCEPTED
        ).count(),
        "completed": db.query(Exchange).filter(
            Exchange.requester_id == current_user.id,
            Exchange.status == ExchangeStatus.COMPLETED
        ).count(),
        "cancelled": db.query(Exchange).filter(
            Exchange.requester_id == current_user.id,
            Exchange.status == ExchangeStatus.CANCELLED
        ).count()
    }
    
    # Estadísticas como propietario
    owner_stats = {
        "total": db.query(Exchange).filter(Exchange.owner_id == current_user.id).count(),
        "pending": db.query(Exchange).filter(
            Exchange.owner_id == current_user.id,
            Exchange.status == ExchangeStatus.PENDING
        ).count(),
        "accepted": db.query(Exchange).filter(
            Exchange.owner_id == current_user.id,
            Exchange.status == ExchangeStatus.ACCEPTED
        ).count(),
        "completed": db.query(Exchange).filter(
            Exchange.owner_id == current_user.id,
            Exchange.status == ExchangeStatus.COMPLETED
        ).count(),
        "cancelled": db.query(Exchange).filter(
            Exchange.owner_id == current_user.id,
            Exchange.status == ExchangeStatus.CANCELLED
        ).count()
    }
    
    # Calcular tasas
    total_as_requester = requester_stats["total"]
    total_as_owner = owner_stats["total"]
    
    success_rate_as_requester = (
        (requester_stats["completed"] / total_as_requester * 100) 
        if total_as_requester > 0 else 0
    )
    
    success_rate_as_owner = (
        (owner_stats["completed"] / total_as_owner * 100) 
        if total_as_owner > 0 else 0
    )
    
    acceptance_rate = (
        ((owner_stats["accepted"] + owner_stats["completed"]) / total_as_owner * 100)
        if total_as_owner > 0 else 0
    )
    
    return UserExchangeStats(
        total_exchanges=total_as_requester + total_as_owner,
        completed_exchanges=requester_stats["completed"] + owner_stats["completed"],
        pending_exchanges=requester_stats["pending"] + owner_stats["pending"],
        cancelled_exchanges=requester_stats["cancelled"] + owner_stats["cancelled"],
        success_rate=round((success_rate_as_requester + success_rate_as_owner) / 2, 2),
        as_requester=requester_stats,
        as_owner=owner_stats,
        acceptance_rate=round(acceptance_rate, 2),
        average_completion_time=None  # TODO: Calcular tiempo promedio
    )


@router.get("/suggestions/{item_id}", response_model=List[ExchangeSuggestion])
async def get_exchange_suggestions(
    item_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener sugerencias de intercambio para un ítem"""
    
    # Verificar que el ítem pertenece al usuario
    user_item = db.query(Item).filter(
        Item.id == item_id,
        Item.owner_id == current_user.id
    ).first()
    
    if not user_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ítem no encontrado"
        )
    
    suggestions = []
    
    # Buscar ítems similares en valor
    if user_item.estimated_value:
        value_range = user_item.estimated_value * 0.3  # ±30%
        similar_value_items = db.query(Item).filter(
            Item.owner_id != current_user.id,
            Item.status == ItemStatus.AVAILABLE,
            Item.is_available_for_exchange == True,
            Item.estimated_value.between(
                user_item.estimated_value - value_range,
                user_item.estimated_value + value_range
            )
        ).limit(5).all()
        
        for item in similar_value_items:
            suggestions.append(ExchangeSuggestion(
                item=item,
                match_score=85,
                match_reasons=["Valor similar"],
                estimated_value_difference=abs(item.estimated_value - user_item.estimated_value) if item.estimated_value else None
            ))
    
    # Buscar ítems en categorías preferidas
    if user_item.preferred_categories:
        preferred_items = db.query(Item).filter(
            Item.owner_id != current_user.id,
            Item.status == ItemStatus.AVAILABLE,
            Item.is_active == True,
            Item.category_id.in_(user_item.preferred_categories)
        ).limit(5).all()
        
        for item in preferred_items:
            suggestions.append(ExchangeSuggestion(
                item=item,
                match_score=75,
                match_reasons=["Categoría preferida"],
                estimated_value_difference=abs(item.estimated_value - user_item.estimated_value) if item.estimated_value and user_item.estimated_value else None
            ))
    
    # Buscar ítems cercanos
    if user_item.city:
        nearby_items = db.query(Item).filter(
            Item.owner_id != current_user.id,
            Item.status == ItemStatus.AVAILABLE,
            Item.is_active == True,
            Item.city == user_item.city
        ).limit(5).all()
        
        for item in nearby_items:
            suggestions.append(ExchangeSuggestion(
                item=item,
                match_score=70,
                match_reasons=["Ubicación cercana"],
                estimated_value_difference=abs(item.estimated_value - user_item.estimated_value) if item.estimated_value and user_item.estimated_value else None
            ))
    
    # Eliminar duplicados y ordenar por score
    seen_items = set()
    unique_suggestions = []
    
    for suggestion in suggestions:
        if suggestion.item.id not in seen_items:
            seen_items.add(suggestion.item.id)
            unique_suggestions.append(suggestion)
    
    unique_suggestions.sort(key=lambda x: x.match_score, reverse=True)
    
    return unique_suggestions[:10]  # Máximo 10 sugerencias