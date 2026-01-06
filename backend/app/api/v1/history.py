from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.core.minio_client import minio_client
from app.models.history import UsageHistory
from app.models.asset import Asset

router = APIRouter(prefix="/history", tags=["使用历史"])


class HistoryCreate(BaseModel):
    asset_id: UUID
    action_type: str
    context: Optional[dict] = None


@router.get("/")
async def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    action_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取使用历史"""
    stmt = select(UsageHistory).order_by(desc(UsageHistory.created_at))
    if action_type:
        stmt = stmt.where(UsageHistory.action_type == action_type)

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    records = result.scalars().all()

    items = []
    for r in records:
        asset = await db.get(Asset, r.asset_id)
        if not asset:
            continue

        thumbnail_url = None
        if asset.thumbnail_path:
            thumbnail_url = minio_client.get_presigned_url(
                "thumbnails", asset.thumbnail_path
            )

        items.append({
            "id": str(r.id),
            "asset_id": str(r.asset_id),
            "asset_name": asset.name,
            "asset_type": asset.type,
            "thumbnail_url": thumbnail_url,
            "action_type": r.action_type,
            "created_at": r.created_at.isoformat()
        })

    return {"items": items, "page": page}


@router.get("/recent")
async def get_recent(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    """获取最近使用的素材"""
    stmt = select(UsageHistory).order_by(
        desc(UsageHistory.created_at)
    ).limit(limit * 2)

    result = await db.execute(stmt)
    records = result.scalars().all()

    seen = set()
    items = []
    for r in records:
        if r.asset_id in seen:
            continue
        seen.add(r.asset_id)

        asset = await db.get(Asset, r.asset_id)
        if not asset:
            continue

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

        if len(items) >= limit:
            break

    return items


@router.post("/")
async def record_history(
    data: HistoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """记录使用历史"""
    asset = await db.get(Asset, data.asset_id)
    if not asset:
        return {"message": "素材不存在"}

    history = UsageHistory(
        asset_id=data.asset_id,
        action_type=data.action_type,
        context=data.context or {}
    )
    db.add(history)

    # 更新素材统计
    if data.action_type == "view":
        asset.view_count += 1
    elif data.action_type in ["use", "download", "copy"]:
        asset.use_count += 1

    await db.commit()
    return {"id": str(history.id)}
