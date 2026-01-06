from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class AssetBase(BaseModel):
    name: str
    description: Optional[str] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AssetResponse(AssetBase):
    id: UUID
    type: str
    file_path: str
    file_size: int
    mime_type: str
    metadata: dict
    thumbnail_url: Optional[str] = None
    vector_status: str
    view_count: int
    use_count: int
    created_at: datetime

    class Config:
        from_attributes = True
