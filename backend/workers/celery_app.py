"""
Celery 应用配置
"""
from celery import Celery

import sys
sys.path.insert(0, '/home/wengfb/IdeaProjects/asset-hub/backend')

from app.config import settings

celery_app = Celery(
    "asset_hub",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "workers.tasks.vectorize_task",
        "workers.tasks.video_extract_task"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1小时超时
    worker_prefetch_multiplier=1,
    worker_concurrency=2,
)
