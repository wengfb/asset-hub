"""
视频关键帧抽取异步任务
"""
import uuid
import tempfile
import os
from workers.celery_app import celery_app
from app.core.clip_service import clip_service
from app.core.minio_client import minio_client
from app.core.milvus import milvus_service
from app.core.video_processor import video_processor
from app.core.database import SessionLocal
from app.models.asset import Asset, VideoFrame


@celery_app.task(bind=True, max_retries=3)
def extract_video_frames_task(self, asset_id: str):
    """
    视频关键帧抽取和向量化任务

    Args:
        asset_id: 素材ID
    """
    from sqlalchemy import select

    with SessionLocal() as db:
        asset = db.execute(
            select(Asset).where(Asset.id == asset_id)
        ).scalar_one_or_none()

        if not asset:
            return {"status": "error", "message": "素材不存在"}

        if asset.type != "video":
            return {"status": "error", "message": "非视频类型"}

        try:
            asset.vector_status = "processing"
            db.commit()

            # 下载视频到临时文件
            video_data = minio_client.download_file("assets", asset.file_path)

            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_data)
                tmp_path = tmp.name

            # 抽取关键帧
            frames = video_processor.extract_frames(tmp_path)
            os.unlink(tmp_path)

            # 处理每一帧
            vector_ids = []
            for frame in frames:
                # 上传帧图片到 MinIO
                frame_path = f"frames/{asset_id}/{frame['frame_index']}.jpg"
                minio_client.upload_file(
                    "frames", frame_path,
                    frame["image_data"], "image/jpeg"
                )

                # 向量化
                vector = clip_service.encode_image(frame["image_data"])
                vector_id = str(uuid.uuid4())

                # 存入 Milvus
                milvus_service.insert(
                    ids=[vector_id],
                    asset_ids=[str(asset.id)],
                    asset_types=["video"],
                    frame_indices=[frame["frame_index"]],
                    embeddings=[vector]
                )

                # 创建帧记录
                video_frame = VideoFrame(
                    asset_id=asset.id,
                    frame_index=frame["frame_index"],
                    timestamp_ms=frame["timestamp_ms"],
                    frame_path=frame_path,
                    vector_id=vector_id
                )
                db.add(video_frame)
                vector_ids.append(vector_id)

            asset.vector_status = "completed"
            db.commit()

            return {"status": "success", "frame_count": len(frames)}

        except Exception as e:
            asset.vector_status = "failed"
            db.commit()
            raise self.retry(exc=e, countdown=60)
