import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.models.tag import Tag, asset_tags
from app.models.asset import Asset

router = APIRouter(prefix="/tags", tags=["标签管理"])


class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#6366f1"
    parent_id: Optional[UUID] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


def generate_slug(name: str) -> str:
    """生成 slug"""
    slug = re.sub(r'[^\w\u4e00-\u9fff]', '-', name.lower())
    return slug.strip('-')


@router.get("/")
async def list_tags(
    db: AsyncSession = Depends(get_db)
):
    """获取所有标签"""
    result = await db.execute(
        select(Tag).order_by(Tag.asset_count.desc())
    )
    tags = result.scalars().all()

    return [{
        "id": str(t.id),
        "name": t.name,
        "slug": t.slug,
        "color": t.color,
        "asset_count": t.asset_count
    } for t in tags]


@router.post("/")
async def create_tag(
    data: TagCreate,
    db: AsyncSession = Depends(get_db)
):
    """创建标签"""
    slug = generate_slug(data.name)

    # 检查重复
    existing = await db.execute(select(Tag).where(Tag.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "标签已存在")

    tag = Tag(
        name=data.name,
        slug=slug,
        color=data.color,
        parent_id=data.parent_id
    )
    db.add(tag)
    await db.commit()

    return {"id": str(tag.id), "name": tag.name, "slug": tag.slug}


@router.put("/{tag_id}")
async def update_tag(
    tag_id: UUID,
    data: TagUpdate,
    db: AsyncSession = Depends(get_db)
):
    """更新标签"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(404, "标签不存在")

    if data.name:
        tag.name = data.name
        tag.slug = generate_slug(data.name)
    if data.color:
        tag.color = data.color

    await db.commit()
    return {"id": str(tag.id), "name": tag.name}


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """删除标签"""
    result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(404, "标签不存在")

    await db.delete(tag)
    await db.commit()
    return {"message": "删除成功"}


class BatchAssign(BaseModel):
    asset_ids: list[UUID]
    tag_ids: list[UUID]


@router.post("/batch-assign")
async def batch_assign_tags(
    data: BatchAssign,
    db: AsyncSession = Depends(get_db)
):
    """批量为素材分配标签"""
    for asset_id in data.asset_ids:
        asset_result = await db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        if not asset:
            continue

        for tag_id in data.tag_ids:
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tag_id)
            )
            tag = tag_result.scalar_one_or_none()
            if tag and tag not in asset.tags:
                asset.tags.append(tag)
                tag.asset_count += 1

    await db.commit()
    return {"message": "分配成功"}
