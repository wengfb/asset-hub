"""
向量化异步任务
"""
import uuid
from workers.celery_app import celery_app
from app.core.clip_service import clip_service
from app.core.minio_client import minio_client
from app.core.milvus import milvus_service
from app.core.database import SessionLocal
from app.models.asset import Asset, VideoFrame


@celery_app.task(bind=True, max_retries=3)
def vectorize_image_task(self, asset_id: str):
    """
    图片向量化任务

    Args:
        asset_id: 素材ID
    """
    from sqlalchemy import select

    with SessionLocal() as db:
        # 获取素材信息
        asset = db.execute(
            select(Asset).where(Asset.id == asset_id)
        ).scalar_one_or_none()

        if not asset:
            return {"status": "error", "message": "素材不存在"}

        if asset.type != "image":
            return {"status": "error", "message": "非图片类型"}

        try:
            # 更新状态为处理中
            asset.vector_status = "processing"
            db.commit()

            # 从 MinIO 下载图片
            image_data = minio_client.download_file("assets", asset.file_path)

            # 向量化
            vector = clip_service.encode_image(image_data)

            # 存入 Milvus
            vector_id = str(uuid.uuid4())
            milvus_service.insert(
                ids=[vector_id],
                asset_ids=[str(asset.id)],
                asset_types=["image"],
                frame_indices=[0],
                embeddings=[vector]
            )

            # 更新素材状态
            asset.vector_id = vector_id
            asset.vector_status = "completed"
            db.commit()

            return {"status": "success", "vector_id": vector_id}

        except Exception as e:
            asset.vector_status = "failed"
            db.commit()
            raise self.retry(exc=e, countdown=60)
