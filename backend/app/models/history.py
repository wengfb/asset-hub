import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class UsageHistory(Base):
    """使用历史模型"""
    __tablename__ = "usage_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"))
    action_type = Column(String(50), nullable=False)  # view, download, copy, use
    context = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset")
