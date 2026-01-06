import hashlib
import io
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends
from fastapi import Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from uuid import UUID, uuid4
from PIL import Image

from app.core.database import get_db
from app.core.minio_client import minio_client
from app.models.asset import Asset
from app.schemas.asset import AssetResponse, AssetUpdate

router = APIRouter(prefix="/assets", tags=["素材管理"])

# 支持的文件类型
ALLOWED_TYPES = {
    "image": ["image/jpeg", "image/png", "image/gif", "image/webp"],
    "video": ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
    "audio": ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac"]
}


def get_asset_type(mime_type: str) -> Optional[str]:
    """根据 MIME 类型判断素材类型"""
    for asset_type, mimes in ALLOWED_TYPES.items():
        if mime_type in mimes:
            return asset_type
    return None


@router.get("/")
async def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """获取素材列表"""
    stmt = select(Asset).where(Asset.deleted_at.is_(None))
    if type:
        stmt = stmt.where(Asset.type == type)

    # 总数
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar()

    # 分页
    stmt = stmt.order_by(Asset.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    assets = result.scalars().all()

    items = []
    for asset in assets:
        thumbnail_url = None
        if asset.thumbnail_path:
            thumbnail_url = minio_client.get_presigned_url("thumbnails", asset.thumbnail_path)
        items.append({
            "id": str(asset.id),
            "name": asset.name,
            "type": asset.type,
            "thumbnail_url": thumbnail_url,
            "file_size": asset.file_size,
            "created_at": asset.created_at.isoformat()
        })

    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/")
async def upload_asset(
    file: UploadFile = File(...),
    name: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """上传素材"""
    # 验证文件类型
    mime_type = file.content_type
    asset_type = get_asset_type(mime_type)
    if not asset_type:
        raise HTTPException(400, f"不支持的文件类型: {mime_type}")

    # 读取文件
    file_data = await file.read()
    file_size = len(file_data)

    # 计算哈希
    file_hash = hashlib.sha256(file_data).hexdigest()

    # 检查重复
    existing = await db.execute(
        select(Asset).where(Asset.file_hash == file_hash, Asset.deleted_at.is_(None))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "文件已存在")

    # 生成存储路径
    asset_id = uuid4()
    now = datetime.now()
    ext = file.filename.split(".")[-1] if "." in file.filename else ""
    file_path = f"{asset_type}/{now.year}/{now.month:02d}/{asset_id}.{ext}"

    # 上传到 MinIO
    minio_client.upload_file("assets", file_path, file_data, mime_type)

    # 生成缩略图
    thumbnail_path = None
    if asset_type == "image":
        thumbnail_path = await _create_image_thumbnail(asset_id, file_data)

    # 创建数据库记录
    asset = Asset(
        id=asset_id,
        name=name or file.filename,
        type=asset_type,
        file_path=file_path,
        file_size=file_size,
        file_hash=file_hash,
        mime_type=mime_type,
        thumbnail_path=thumbnail_path,
        vector_status="pending"
    )
    db.add(asset)
    await db.commit()

    # 触发异步向量化任务
    _trigger_vectorize_task(str(asset_id), asset_type)

    return {"id": str(asset_id), "name": asset.name, "type": asset_type}


async def _create_image_thumbnail(asset_id: UUID, image_data: bytes) -> str:
    """创建图片缩略图"""
    img = Image.open(io.BytesIO(image_data))
    img.thumbnail((400, 400), Image.Resampling.LANCZOS)

    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    thumb_data = buffer.getvalue()

    thumb_path = f"{asset_id}.jpg"
    minio_client.upload_file("thumbnails", thumb_path, thumb_data, "image/jpeg")
    return thumb_path


def _trigger_vectorize_task(asset_id: str, asset_type: str):
    """触发向量化任务"""
    try:
        if asset_type == "image":
            from workers.tasks import vectorize_image_task
            vectorize_image_task.delay(asset_id)
        elif asset_type == "video":
            from workers.tasks import extract_video_frames_task
            extract_video_frames_task.delay(asset_id)
    except Exception as e:
        print(f"触发任务失败: {e}")


@router.get("/{asset_id}")
async def get_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """获取素材详情"""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.deleted_at.is_(None))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "素材不存在")

    file_url = minio_client.get_presigned_url("assets", asset.file_path)
    thumbnail_url = None
    if asset.thumbnail_path:
        thumbnail_url = minio_client.get_presigned_url("thumbnails", asset.thumbnail_path)

    return {
        "id": str(asset.id),
        "name": asset.name,
        "type": asset.type,
        "file_url": file_url,
        "thumbnail_url": thumbnail_url,
        "file_size": asset.file_size,
        "mime_type": asset.mime_type,
        "metadata": asset.metadata,
        "vector_status": asset.vector_status,
        "created_at": asset.created_at.isoformat()
    }


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """删除素材（软删除）"""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.deleted_at.is_(None))
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(404, "素材不存在")

    asset.deleted_at = datetime.now()
    await db.commit()

    return {"message": "删除成功"}
