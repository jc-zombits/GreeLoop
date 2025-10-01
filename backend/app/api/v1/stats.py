from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, and_, select
from typing import Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.user import User
from app.models.item import Item, ItemStatus
from app.models.exchange import Exchange, ExchangeStatus

router = APIRouter()

@router.get("/education-impact", response_model=Dict[str, Any])
async def get_education_impact_stats(db: AsyncSession = Depends(get_db)):
    """
    Obtener estadísticas dinámicas para la página de educación
    """
    try:
        # 1. Calcular CO₂ evitado (basado en intercambios completados)
        # Asumimos que cada intercambio completado evita aproximadamente 2.7 kg de CO₂
        # (promedio basado en la reducción de producción de nuevos objetos)
        completed_exchanges_result = await db.execute(
            select(func.count(Exchange.id)).where(Exchange.status == ExchangeStatus.COMPLETED)
        )
        completed_exchanges = completed_exchanges_result.scalar() or 0
        
        co2_saved_kg = completed_exchanges * 2.7  # kg por intercambio
        co2_saved_tons = co2_saved_kg / 1000  # convertir a toneladas
        
        # Formatear para mostrar (ej: 2.3M si es mayor a 1M, 850K si es mayor a 1K)
        if co2_saved_tons >= 1000000:
            co2_display = f"{co2_saved_tons / 1000000:.1f}M"
        elif co2_saved_tons >= 1000:
            co2_display = f"{co2_saved_tons / 1000:.0f}K"
        else:
            co2_display = f"{co2_saved_tons:.1f}"
        
        # 2. Objetos intercambiados (total de intercambios completados)
        objects_exchanged = completed_exchanges
        
        if objects_exchanged >= 1000000:
            objects_display = f"{objects_exchanged / 1000000:.1f}M"
        elif objects_exchanged >= 1000:
            objects_display = f"{objects_exchanged / 1000:.0f}K"
        else:
            objects_display = str(objects_exchanged)
        
        # 3. Usuarios educados (usuarios que han completado al menos un intercambio)
        # Contar usuarios únicos que han participado como requester o owner
        requesters_query = select(Exchange.requester_id.distinct()).where(
            and_(
                Exchange.status == ExchangeStatus.COMPLETED,
                Exchange.requester_id.isnot(None)
            )
        )
        
        owners_query = select(Exchange.owner_id.distinct()).where(
            and_(
                Exchange.status == ExchangeStatus.COMPLETED,
                Exchange.owner_id.isnot(None)
            )
        )
        
        # Ejecutar las consultas
        requesters_result = await db.execute(requesters_query)
        owners_result = await db.execute(owners_query)
        
        requesters_ids = set(row[0] for row in requesters_result.fetchall())
        owners_ids = set(row[0] for row in owners_result.fetchall())
        
        # Unir ambos conjuntos para obtener usuarios únicos
        educated_users = len(requesters_ids.union(owners_ids))
        
        if educated_users >= 1000000:
            users_display = f"{educated_users / 1000000:.1f}M"
        elif educated_users >= 1000:
            users_display = f"{educated_users / 1000:.0f}K"
        else:
            users_display = str(educated_users)
        
        # 4. Comunidades activas (ciudades con al menos 5 usuarios activos)
        # Usuarios activos: han creado al menos un ítem o participado en un intercambio
        active_communities_result = await db.execute(
            select(func.count(func.distinct(User.city))).where(
                and_(
                    User.city.isnot(None),
                    User.city != ""
                )
            ).group_by(User.city).having(func.count(User.id) >= 5)
        )
        active_communities = len(active_communities_result.fetchall())
        
        if active_communities >= 1000000:
            communities_display = f"{active_communities / 1000000:.1f}M"
        elif active_communities >= 1000:
            communities_display = f"{active_communities / 1000:.1f}K"
        else:
            communities_display = f"{active_communities:.1f}K" if active_communities > 0 else "0"
        
        # Estadísticas adicionales para contexto
        total_users_result = await db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0
        
        total_items_result = await db.execute(
            select(func.count(Item.id)).where(Item.is_active == True)
        )
        total_items = total_items_result.scalar() or 0
        
        pending_exchanges_result = await db.execute(
            select(func.count(Exchange.id)).where(Exchange.status == ExchangeStatus.PENDING)
        )
        pending_exchanges = pending_exchanges_result.scalar() or 0
        
        return {
            "impact_stats": [
                {
                    "id": "co2-saved",
                    "title": "Toneladas de CO₂ evitadas",
                    "value": co2_display,
                    "raw_value": co2_saved_tons,
                    "icon": "Leaf",
                    "color": "green"
                },
                {
                    "id": "objects-exchanged", 
                    "title": "Objetos intercambiados",
                    "value": objects_display,
                    "raw_value": objects_exchanged,
                    "icon": "Recycle",
                    "color": "blue"
                },
                {
                    "id": "users-educated",
                    "title": "Usuarios educados", 
                    "value": users_display,
                    "raw_value": educated_users,
                    "icon": "Users",
                    "color": "purple"
                },
                {
                    "id": "active-communities",
                    "title": "Comunidades activas",
                    "value": communities_display,
                    "raw_value": active_communities,
                    "icon": "Globe",
                    "color": "orange"
                }
            ],
            "additional_stats": {
                "total_users": total_users,
                "total_items": total_items,
                "pending_exchanges": pending_exchanges,
                "last_updated": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/platform-metrics", response_model=Dict[str, Any])
async def get_platform_metrics(db: AsyncSession = Depends(get_db)):
    """
    Obtener métricas generales de la plataforma
    """
    try:
        # Métricas de los últimos 30 días
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        recent_exchanges_result = await db.execute(
            select(func.count(Exchange.id)).where(Exchange.created_at >= thirty_days_ago)
        )
        recent_exchanges = recent_exchanges_result.scalar() or 0
        
        recent_users_result = await db.execute(
            select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
        )
        recent_users = recent_users_result.scalar() or 0
        
        recent_items_result = await db.execute(
            select(func.count(Item.id)).where(
                and_(
                    Item.created_at >= thirty_days_ago,
                    Item.is_active == True
                )
            )
        )
        recent_items = recent_items_result.scalar() or 0
        
        # Tasa de éxito de intercambios
        total_exchanges_result = await db.execute(select(func.count(Exchange.id)))
        total_exchanges = total_exchanges_result.scalar() or 0
        
        completed_exchanges_result = await db.execute(
            select(func.count(Exchange.id)).where(Exchange.status == ExchangeStatus.COMPLETED)
        )
        completed_exchanges = completed_exchanges_result.scalar() or 0
        
        success_rate = (completed_exchanges / total_exchanges * 100) if total_exchanges > 0 else 0
        
        return {
            "recent_activity": {
                "new_exchanges_30d": recent_exchanges,
                "new_users_30d": recent_users,
                "new_items_30d": recent_items
            },
            "platform_health": {
                "exchange_success_rate": round(success_rate, 1),
                "total_exchanges": total_exchanges,
                "completed_exchanges": completed_exchanges
            },
            "growth_metrics": {
                "daily_avg_exchanges": round(recent_exchanges / 30, 1),
                "daily_avg_users": round(recent_users / 30, 1),
                "daily_avg_items": round(recent_items / 30, 1)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener métricas: {str(e)}"
        )