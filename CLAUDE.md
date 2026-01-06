# Asset Hub - AI 素材管理系统

## 项目概述

Asset Hub 是一个基于 AI 的素材管理系统，支持图片、视频、音频的智能搜索和管理。

## 技术栈

### 后端
- **框架**: Python + FastAPI
- **数据库**: PostgreSQL (asyncpg)
- **向量数据库**: Milvus
- **对象存储**: MinIO
- **任务队列**: Celery + Redis
- **AI 模型**: CN-CLIP ViT-B/16

### 前端
- **框架**: Next.js 14
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **HTTP 客户端**: Axios

## 项目结构

```
asset-hub/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/v1/         # API 路由
│   │   ├── core/           # 核心模块
│   │   ├── models/         # 数据库模型
│   │   └── schemas/        # Pydantic 模式
│   ├── workers/            # Celery 任务
│   └── migrations/         # 数据库迁移
├── frontend/               # 前端应用
│   └── src/
│       ├── app/            # Next.js 页面
│       ├── components/     # React 组件
│       ├── stores/         # Zustand 状态
│       └── lib/            # 工具函数
└── docker/                 # Docker 配置
```

## 服务器配置

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | 192.168.1.77:5432 | 数据库 asset_hub |
| MinIO | 192.168.1.77:9000 | 对象存储 |
| Milvus | 192.168.1.77:19530 | 向量数据库 |
| Redis | 192.168.1.77:6379 | 任务队列 |

## 开发命令

```bash
# 后端启动
cd backend
./start.sh              # 启动 API 服务
./start_worker.sh       # 启动 Celery Worker

# 前端启动
cd frontend
npm run dev

# 数据库迁移
cd backend
alembic upgrade head
```

## API 端点

### 素材管理 `/api/v1/assets`
- `GET /` - 素材列表
- `POST /` - 上传素材
- `GET /{id}` - 素材详情
- `DELETE /{id}` - 删除素材

### 智能搜索 `/api/v1/search`
- `POST /text` - 文字搜索
- `POST /image` - 以图搜图

### 标签管理 `/api/v1/tags`
- `GET /` - 标签列表
- `POST /` - 创建标签
- `PUT /{id}` - 更新标签
- `DELETE /{id}` - 删除标签
- `POST /batch-assign` - 批量分配

### 收藏夹 `/api/v1/collections`
- `GET /` - 收藏夹列表
- `POST /` - 创建收藏夹
- `GET /{id}` - 收藏夹详情
- `PUT /{id}` - 更新收藏夹
- `DELETE /{id}` - 删除收藏夹
- `POST /{id}/assets` - 添加素材
- `DELETE /{id}/assets` - 移除素材
- `GET /{id}/assets` - 获取素材

### 使用历史 `/api/v1/history`
- `GET /` - 历史列表
- `GET /recent` - 最近使用
- `POST /` - 记录历史

## 核心模块

| 模块 | 路径 | 说明 |
|------|------|------|
| clip_service | `app/core/clip_service.py` | CN-CLIP 向量编码 |
| milvus | `app/core/milvus.py` | 向量数据库操作 |
| minio_client | `app/core/minio_client.py` | 对象存储 |
| video_processor | `app/core/video_processor.py` | 视频关键帧抽取 |

## 异步任务

| 任务 | 路径 | 说明 |
|------|------|------|
| vectorize_image_task | `workers/tasks/vectorize_task.py` | 图片向量化 |
| extract_video_frames_task | `workers/tasks/video_extract_task.py` | 视频抽帧 |

## 注意事项

- CN-CLIP 模型首次使用时自动下载
- 向量维度: 512
- 视频抽帧间隔: 2秒
- 支持格式: jpg/png/gif/webp/mp4/mov/avi/mp3/wav
