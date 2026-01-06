import io
from datetime import timedelta
from minio import Minio
from app.config import settings


class MinIOClient:
    """MinIO对象存储客户端"""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self._ensure_buckets()

    def _ensure_buckets(self):
        """确保必要的存储桶存在"""
        buckets = ["assets", "thumbnails", "frames"]
        for bucket in buckets:
            if not self.client.bucket_exists(bucket):
                self.client.make_bucket(bucket)

    def upload_file(
        self,
        bucket: str,
        object_name: str,
        data: bytes,
        content_type: str
    ) -> str:
        """上传文件"""
        self.client.put_object(
            bucket,
            object_name,
            io.BytesIO(data),
            len(data),
            content_type=content_type
        )
        return object_name

    def get_presigned_url(
        self,
        bucket: str,
        object_name: str,
        expires: int = 3600
    ) -> str:
        """获取预签名URL"""
        return self.client.presigned_get_object(
            bucket,
            object_name,
            expires=timedelta(seconds=expires)
        )

    def delete_file(self, bucket: str, object_name: str):
        """删除文件"""
        self.client.remove_object(bucket, object_name)

    def download_file(self, bucket: str, object_name: str) -> bytes:
        """下载文件"""
        response = self.client.get_object(bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()


minio_client = MinIOClient()
