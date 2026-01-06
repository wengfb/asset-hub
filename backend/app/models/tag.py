import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer
from sqlalchemy import DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


# 素材-标签关联表
asset_tags = Table(
    "asset_tags",
    Base.metadata,
    Column("asset_id", UUID(as_uuid=True), ForeignKey("assets.id")),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id")),
)


class Tag(Base):
    """标签模型"""
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    color = Column(String(7), default="#6366f1")
    parent_id = Column(UUID(as_uuid=True), ForeignKey("tags.id"))
    asset_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    assets = relationship("Asset", secondary=asset_tags, back_populates="tags")
