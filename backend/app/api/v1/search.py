from fastapi import APIRouter, UploadFile, File
from fastapi import Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.clip_service import clip_service
from app.core.milvus import milvus_service
from app.core.minio_client import minio_client
from app.models.asset import Asset, VideoFrame

router = APIRouter(prefix="/search", tags=["智能搜索"])


@router.post("/text")
async def search_by_text(
    query: str = Query(..., min_length=1),
    top_k: int = Query(20, ge=1, le=100),
    asset_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """文字搜索图片/视频"""
    # 文本向量化
    text_vector = clip_service.encode_text(query)

    # Milvus 搜索
    search_results = milvus_service.search(
        query_vectors=[text_vector],
        top_k=top_k * 2  # 多取一些用于去重
    )

    # 处理结果
    results = await _process_search_results(db, search_results, top_k, asset_type)

    return {"results": results, "query": query, "total": len(results)}


@router.post("/image")
async def search_by_image(
    file: UploadFile = File(...),
    top_k: int = Query(20, ge=1, le=100),
    asset_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """以图搜图"""
    # 读取图片
    image_data = await file.read()

    # 图片向量化
    image_vector = clip_service.encode_image(image_data)

    # Milvus 搜索
    search_results = milvus_service.search(
        query_vectors=[image_vector],
        top_k=top_k * 2
    )

    # 处理结果
    results = await _process_search_results(db, search_results, top_k, asset_type)

    return {"results": results, "total": len(results)}


async def _process_search_results(
    db: AsyncSession,
    search_results: list,
    top_k: int,
    asset_type: Optional[str] = None
) -> list:
    """处理搜索结果，去重并获取素材详情"""
    if not search_results or not search_results[0]:
        return []

    seen_assets = set()
    results = []

    for hit in search_results[0]:
        asset_id = hit.get("asset_id")
        if not asset_id or asset_id in seen_assets:
            continue

        seen_assets.add(asset_id)

        # 获取素材详情
        stmt = select(Asset).where(Asset.id == asset_id)
        if asset_type:
            stmt = stmt.where(Asset.type == asset_type)

        result = await db.execute(stmt)
        asset = result.scalar_one_or_none()

        if asset:
            thumbnail_url = None
            if asset.thumbnail_path:
                thumbnail_url = minio_client.get_presigned_url(
                    "thumbnails", asset.thumbnail_path
                )

            results.append({
                "id": str(asset.id),
                "name": asset.name,
                "type": asset.type,
                "thumbnail_url": thumbnail_url,
                "score": hit.get("score", 0),
                "frame_index": hit.get("frame_index", 0)
            })

        if len(results) >= top_k:
            break

    return results
