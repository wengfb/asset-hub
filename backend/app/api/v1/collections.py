from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.minio_client import minio_client
from app.models.collection import Collection
from app.models.asset import Asset

router = APIRouter(prefix="/collections", tags=["收藏夹管理"])


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[UUID] = None


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("")
async def list_collections(
    db: AsyncSession = Depends(get_db)
):
    """获取收藏夹列表"""
    result = await db.execute(
        select(Collection).order_by(Collection.created_at.desc())
    )
    collections = result.scalars().all()

    items = []
    for c in collections:
        cover_url = None
        if c.cover_asset_id:
            asset_result = await db.execute(
                select(Asset).where(Asset.id == c.cover_asset_id)
            )
            asset = asset_result.scalar_one_or_none()
            if asset and asset.thumbnail_path:
                cover_url = minio_client.get_presigned_url("thumbnails", asset.thumbnail_path)

        items.append({
            "id": str(c.id),
            "name": c.name,
            "description": c.description,
            "asset_count": c.asset_count,
            "cover_url": cover_url
        })

    return items


@router.post("")
async def create_collection(
    data: CollectionCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建收藏夹"""
    collection = Collection(
        name=data.name,
        description=data.description,
        parent_id=data.parent_id
    )
    db.add(collection)
    await db.commit()

    return {"id": str(collection.id), "name": collection.name}


@router.get("/{collection_id}")
async def get_collection(
    collection_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """获取收藏夹详情"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    return {
        "id": str(collection.id),
        "name": collection.name,
        "description": collection.description,
        "asset_count": collection.asset_count
    }


@router.put("/{collection_id}")
async def update_collection(
    collection_id: UUID,
    data: CollectionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新收藏夹"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    if data.name:
        collection.name = data.name
    if data.description is not None:
        collection.description = data.description

    await db.commit()
    return {"id": str(collection.id), "name": collection.name}


@router.delete("/{collection_id}")
async def delete_collection(
    collection_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """删除收藏夹"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    await db.delete(collection)
    await db.commit()
    return {"message": "删除成功"}


class AssetIds(BaseModel):
    asset_ids: list[UUID]


@router.post("/{collection_id}/assets")
async def add_assets(
    collection_id: UUID,
    data: AssetIds,
    db: AsyncSession = Depends(get_db)
):
    """添加素材到收藏夹"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    added = 0
    for asset_id in data.asset_ids:
        asset_result = await db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        if asset and asset not in collection.assets:
            collection.assets.append(asset)
            added += 1

    collection.asset_count += added
    if not collection.cover_asset_id and collection.assets:
        collection.cover_asset_id = collection.assets[0].id

    await db.commit()
    return {"message": f"添加了 {added} 个素材"}


@router.delete("/{collection_id}/assets")
async def remove_assets(
    collection_id: UUID,
    data: AssetIds,
    db: AsyncSession = Depends(get_db)
):
    """从收藏夹移除素材"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    removed = 0
    for asset_id in data.asset_ids:
        asset_result = await db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        if asset and asset in collection.assets:
            collection.assets.remove(asset)
            removed += 1

    collection.asset_count = max(0, collection.asset_count - removed)
    await db.commit()
    return {"message": f"移除了 {removed} 个素材"}


@router.get("/{collection_id}/assets")
async def get_collection_assets(
    collection_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """获取收藏夹中的素材"""
    result = await db.execute(
        select(Collection).where(Collection.id == collection_id)
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(404, "收藏夹不存在")

    items = []
    for asset in collection.assets:
        thumbnail_url = None
        if asset.thumbnail_path:
            thumbnail_url = minio_client.get_presigned_url(
                "thumbnails", asset.thumbnail_path
            )
        items.append({
            "id": str(asset.id),
            "name": asset.name,
            "type": asset.type,
            "thumbnail_url": thumbnail_url
        })

    return items
