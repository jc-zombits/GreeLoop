from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class RewardEvent(Base):
    __tablename__ = "reward_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    actor_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    actor_type = Column(String(10), nullable=False)  # 'user' | 'company'
    event_type = Column(String(50), nullable=False)  # publish_item, complete_exchange, rating_update, recompute
    points_delta = Column(Integer, nullable=False, default=0)
    points_total = Column(Integer, nullable=False, default=0)
    tier_before = Column(String(20), nullable=True)
    tier_after = Column(String(20), nullable=True)
    description = Column(Text, nullable=True)
    meta = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
