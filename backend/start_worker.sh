#!/bin/bash
# Celery Worker 启动脚本

cd /home/wengfb/IdeaProjects/asset-hub/backend

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "启动 Celery Worker..."
celery -A workers.celery_app worker --loglevel=info
