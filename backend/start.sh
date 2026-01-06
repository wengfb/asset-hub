#!/bin/bash
# Asset Hub 后端启动脚本

cd /home/wengfb/IdeaProjects/asset-hub/backend

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# 运行数据库迁移
echo "运行数据库迁移..."
alembic upgrade head

# 启动 FastAPI
echo "启动 FastAPI 服务..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
