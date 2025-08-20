from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from ..models.exchange import ExchangeStatus

# Esquema simple para respuesta de creación de intercambio
class ExchangeCreateResponse(BaseModel):
    id: UUID
    status: ExchangeStatus
    requester_id: UUID
    requested_item_id: UUID
    offered_item_id: UUID
    initial_message: Optional[str] = None
    proposed_cash_difference: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True