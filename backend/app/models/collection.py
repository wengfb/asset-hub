import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text
from sqlalchemy import DateTime, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


# 收藏夹-素材关联表
collection_assets = Table(
    "collection_assets",
    Base.metadata,
    Column("collection_id", UUID(as_uuid=True), ForeignKey("collections.id")),
    Column("asset_id", UUID(as_uuid=True), ForeignKey("assets.id")),
)


class Collection(Base):
    """收藏夹模型"""
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(20), default="folder")
    parent_id = Column(UUID(as_uuid=True), ForeignKey("collections.id"))
    cover_asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"))
    asset_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    assets = relationship("Asset", secondary=collection_assets)
