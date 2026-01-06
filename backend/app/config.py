from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置"""

    # 应用信息
    APP_NAME: str = "Asset Hub"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@192.168.1.77:5432/asset_hub"

    # Milvus
    MILVUS_HOST: str = "192.168.1.77"
    MILVUS_PORT: int = 19530

    # MinIO
    MINIO_ENDPOINT: str = "192.168.1.77:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_SECURE: bool = False

    # Redis
    REDIS_URL: str = "redis://192.168.1.77:6379/0"

    # CN-CLIP
    CLIP_MODEL_NAME: str = "ViT-B-16"
    CLIP_MODEL_PATH: str = "./models/cn-clip"

    # 文件上传限制
    MAX_UPLOAD_SIZE: int = 500 * 1024 * 1024  # 500MB

    # 视频处理
    VIDEO_FRAME_INTERVAL: float = 2.0  # 每2秒抽取一帧
    VIDEO_MIN_FRAMES: int = 5  # 最少5帧
    VIDEO_MAX_FRAMES: int = 50  # 最多50帧

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
