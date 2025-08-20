from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, desc, func
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_active_user
from app.models.user import User
from app.models.message import Message, MessageType
from app.models.exchange import Exchange
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessageListItem,
    ConversationResponse,
    ConversationListResponse,
    MessageSearchParams,
    MessageSearchResponse,
    MarkMessagesReadRequest,
    UserMessageStats
)

router = APIRouter()

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener lista de conversaciones del usuario"""
    
    # Obtener conversaciones donde el usuario es participante
    conversations_query = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).distinct(Message.sender_id, Message.receiver_id)
    
    # Agrupar por conversación (combinación de usuarios)
    conversations = []
    processed_pairs = set()
    
    # Obtener todos los mensajes del usuario
    user_messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).order_by(desc(Message.created_at)).all()
    
    for message in user_messages:
        other_user_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
        
        # Crear identificador único para la conversación
        pair_id = tuple(sorted([str(current_user.id), str(other_user_id)]))
        
        if pair_id not in processed_pairs:
            processed_pairs.add(pair_id)
            
            # Obtener información del otro usuario
            other_user = db.query(User).filter(User.id == other_user_id).first()
            if not other_user:
                continue
            
            # Obtener último mensaje de la conversación
            last_message = db.query(Message).filter(
                or_(
                    and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                    and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
                )
            ).order_by(desc(Message.created_at)).first()
            
            # Contar mensajes no leídos
            unread_count = db.query(Message).filter(
                Message.sender_id == other_user_id,
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).count()
            
            # Contar total de mensajes
            total_messages = db.query(Message).filter(
                or_(
                    and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                    and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
                )
            ).count()
            
            # Buscar intercambio relacionado si existe
            exchange = None
            if last_message and last_message.exchange_id:
                exchange = db.query(Exchange).filter(Exchange.id == last_message.exchange_id).first()
            
            conversation = ConversationResponse(
                conversation_id=f"{min(current_user.id, other_user_id)}_{max(current_user.id, other_user_id)}",
                other_user={
                    "id": other_user.id,
                    "name": f"{other_user.first_name} {other_user.last_name}",
                    "username": other_user.username,
                    "avatar": other_user.avatar_url,
                    "is_online": False  # TODO: Implementar estado online
                },
                exchange={
                    "id": exchange.id,
                    "status": exchange.status.value if exchange else None
                } if exchange else None,
                last_message=MessageListItem(
                    id=last_message.id,
                    content=last_message.content,
                    sender_id=last_message.sender_id,
                    message_type=last_message.message_type,
                    created_at=last_message.created_at,
                    is_read=last_message.is_read
                ) if last_message else None,
                total_messages=total_messages,
                unread_count=unread_count,
                created_at=last_message.created_at if last_message else datetime.utcnow(),
                updated_at=last_message.created_at if last_message else datetime.utcnow()
            )
            
            conversations.append(conversation)
    
    # Ordenar por último mensaje
    conversations.sort(key=lambda x: x.updated_at, reverse=True)
    
    # Paginación
    start = (page - 1) * limit
    end = start + limit
    paginated_conversations = conversations[start:end]
    
    # Calcular estadísticas
    total_unread = sum(conv.unread_count for conv in conversations)
    unread_conversations = sum(1 for conv in conversations if conv.unread_count > 0)
    
    return ConversationListResponse(
        conversations=paginated_conversations,
        total=len(conversations),
        unread_conversations=unread_conversations,
        total_unread_messages=total_unread
    )

@router.get("/conversation/{user_id}", response_model=List[MessageResponse])
async def get_conversation_messages(
    user_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener mensajes de una conversación específica"""
    
    # Verificar que el otro usuario existe
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Obtener mensajes de la conversación
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).offset((page - 1) * limit).limit(limit).all()
    
    # Marcar mensajes como leídos
    unread_messages = db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).all()
    
    for message in unread_messages:
        message.is_read = True
        message.read_at = datetime.utcnow()
    
    if unread_messages:
        db.commit()
    
    # Convertir a respuesta
    message_responses = []
    for message in messages:
        sender = db.query(User).filter(User.id == message.sender_id).first()
        receiver = db.query(User).filter(User.id == message.receiver_id).first()
        
        message_responses.append(MessageResponse(
            id=message.id,
            content=message.content,
            message_type=message.message_type,
            sender_id=message.sender_id,
            receiver_id=message.receiver_id,
            exchange_id=message.exchange_id,
            reply_to_id=message.reply_to_id,
            is_read=message.is_read,
            is_deleted_by_sender=message.is_deleted_by_sender,
            is_deleted_by_receiver=message.is_deleted_by_receiver,
            metadata=message.metadata,
            created_at=message.created_at,
            updated_at=message.updated_at,
            read_at=message.read_at,
            sender={
                "id": sender.id,
                "name": f"{sender.first_name} {sender.last_name}",
                "username": sender.username,
                "avatar": sender.avatar_url
            },
            receiver={
                "id": receiver.id,
                "name": f"{receiver.first_name} {receiver.last_name}",
                "username": receiver.username,
                "avatar": receiver.avatar_url
            }
        ))
    
    return message_responses

@router.post("/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Enviar un nuevo mensaje"""
    
    # Verificar que el receptor existe
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario receptor no encontrado"
        )
    
    # Crear el mensaje
    new_message = Message(
        content=message_data.content,
        message_type=message_data.message_type,
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        exchange_id=message_data.exchange_id,
        reply_to_id=message_data.reply_to_id,
        metadata=message_data.metadata or {}
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Crear respuesta
    return MessageResponse(
        id=new_message.id,
        content=new_message.content,
        message_type=new_message.message_type,
        sender_id=new_message.sender_id,
        receiver_id=new_message.receiver_id,
        exchange_id=new_message.exchange_id,
        reply_to_id=new_message.reply_to_id,
        is_read=new_message.is_read,
        is_deleted_by_sender=new_message.is_deleted_by_sender,
        is_deleted_by_receiver=new_message.is_deleted_by_receiver,
        metadata=new_message.metadata,
        created_at=new_message.created_at,
        updated_at=new_message.updated_at,
        read_at=new_message.read_at,
        sender={
            "id": current_user.id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "username": current_user.username,
            "avatar": current_user.avatar_url
        },
        receiver={
            "id": receiver.id,
            "name": f"{receiver.first_name} {receiver.last_name}",
            "username": receiver.username,
            "avatar": receiver.avatar_url
        }
    )

@router.put("/mark-read", response_model=dict)
async def mark_messages_as_read(
    request: MarkMessagesReadRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Marcar mensajes como leídos"""
    
    if request.message_ids:
        # Marcar mensajes específicos
        messages = db.query(Message).filter(
            Message.id.in_(request.message_ids),
            Message.receiver_id == current_user.id
        ).all()
    elif request.conversation_with:
        # Marcar todos los mensajes de una conversación
        messages = db.query(Message).filter(
            Message.sender_id == request.conversation_with,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).all()
    else:
        # Marcar todos los mensajes no leídos
        messages = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).all()
    
    marked_count = 0
    for message in messages:
        if not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
            marked_count += 1
    
    if marked_count > 0:
        db.commit()
    
    return {
        "message": f"{marked_count} mensajes marcados como leídos",
        "marked_count": marked_count
    }

@router.get("/search", response_model=MessageSearchResponse)
async def search_messages(
    search_params: MessageSearchParams = Depends(),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Buscar mensajes"""
    
    query = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    )
    
    # Aplicar filtros
    if search_params.query:
        query = query.filter(Message.content.ilike(f"%{search_params.query}%"))
    
    if search_params.conversation_with:
        query = query.filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == search_params.conversation_with),
                and_(Message.sender_id == search_params.conversation_with, Message.receiver_id == current_user.id)
            )
        )
    
    if search_params.exchange_id:
        query = query.filter(Message.exchange_id == search_params.exchange_id)
    
    if search_params.message_type:
        query = query.filter(Message.message_type == search_params.message_type)
    
    if search_params.unread_only:
        query = query.filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        )
    
    if search_params.created_after:
        query = query.filter(Message.created_at >= search_params.created_after)
    
    if search_params.created_before:
        query = query.filter(Message.created_at <= search_params.created_before)
    
    # Ordenamiento
    if search_params.sort_order == "asc":
        query = query.order_by(getattr(Message, search_params.sort_by).asc())
    else:
        query = query.order_by(getattr(Message, search_params.sort_by).desc())
    
    # Paginación
    total = query.count()
    messages = query.offset((search_params.page - 1) * search_params.page_size).limit(search_params.page_size).all()
    
    # Convertir a lista de items
    message_items = []
    for message in messages:
        sender = db.query(User).filter(User.id == message.sender_id).first()
        
        message_items.append(MessageListItem(
            id=message.id,
            content=message.content,
            sender_id=message.sender_id,
            message_type=message.message_type,
            created_at=message.created_at,
            is_read=message.is_read,
            sender_name=f"{sender.first_name} {sender.last_name}" if sender else "Usuario desconocido"
        ))
    
    return MessageSearchResponse(
        messages=message_items,
        total=total,
        page=search_params.page,
        page_size=search_params.page_size,
        total_pages=(total + search_params.page_size - 1) // search_params.page_size
    )

@router.get("/stats", response_model=UserMessageStats)
async def get_user_message_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de mensajes del usuario"""
    
    # Mensajes enviados
    sent_messages = db.query(Message).filter(Message.sender_id == current_user.id).count()
    
    # Mensajes recibidos
    received_messages = db.query(Message).filter(Message.receiver_id == current_user.id).count()
    
    # Conversaciones únicas
    conversations = set()
    user_messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        )
    ).all()
    
    for message in user_messages:
        other_user_id = message.receiver_id if message.sender_id == current_user.id else message.sender_id
        conversations.add(other_user_id)
    
    # Mensajes no leídos
    unread_messages = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    # Mensajes por tipo
    text_messages = db.query(Message).filter(
        or_(
            Message.sender_id == current_user.id,
            Message.receiver_id == current_user.id
        ),
        Message.message_type == MessageType.TEXT
    ).count()
    
    return UserMessageStats(
        total_messages_sent=sent_messages,
        total_messages_received=received_messages,
        total_conversations=len(conversations),
        unread_messages=unread_messages,
        text_messages=text_messages,
        image_messages=0,  # TODO: Implementar cuando se agreguen imágenes
        system_messages=0,  # TODO: Implementar mensajes del sistema
        messages_today=0,  # TODO: Implementar filtros de fecha
        messages_this_week=0,
        messages_this_month=0,
        average_response_time_minutes=None  # TODO: Calcular tiempo de respuesta
    )