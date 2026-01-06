import uuid
from datetime import datetime
from sqlalchemy import Column, String, BigInteger, Integer
from sqlalchemy import Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Asset(Base):
    """素材模型"""
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    type = Column(String(20), nullable=False)  # image, video, audio

    # 文件信息
    file_path = Column(String(512), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    mime_type = Column(String(100), nullable=False)

    # 元数据
    file_metadata = Column("metadata", JSONB, default={})
    thumbnail_path = Column(String(512))

    # 向量化状态
    vector_status = Column(String(20), default="pending")
    vector_id = Column(String(64))

    # 统计
    view_count = Column(Integer, default=0)
    use_count = Column(Integer, default=0)

    # 时间戳
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime)

    # 关系
    tags = relationship("Tag", secondary="asset_tags", back_populates="assets")
    frames = relationship("VideoFrame", back_populates="asset")


class VideoFrame(Base):
    """视频关键帧模型"""
    __tablename__ = "video_frames"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"))
    frame_index = Column(Integer, nullable=False)
    timestamp_ms = Column(BigInteger, nullable=False)
    frame_path = Column(String(512), nullable=False)
    vector_id = Column(String(64))
    is_scene_start = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="frames")
