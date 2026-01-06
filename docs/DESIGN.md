# Asset Hub 系统设计文档

## 1. 项目概述

### 1.1 项目背景
Asset Hub 是一个 AI 驱动的素材管理系统，旨在帮助用户高效管理和检索图片、视频、音频等多媒体素材。

### 1.2 核心功能
- 素材上传与管理
- 文字搜索图片/视频
- 以图搜图
- 标签分类管理
- 收藏夹组织
- 使用历史追踪

### 1.3 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Next.js 14 | React 服务端渲染框架 |
| 样式 | Tailwind CSS | 原子化 CSS 框架 |
| 状态 | Zustand | 轻量级状态管理 |
| 后端 | FastAPI | 高性能 Python Web 框架 |
| 数据库 | PostgreSQL | 关系型数据库 |
| 向量库 | Milvus | 向量相似度搜索 |
| 存储 | MinIO | S3 兼容对象存储 |
| 队列 | Celery + Redis | 异步任务处理 |
| AI | CN-CLIP | 中文多模态模型 |

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    前端 (Next.js)                        │
│              localhost:3000                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  后端 API (FastAPI)                      │
│              localhost:8000                              │
└─────────────────────────────────────────────────────────┘
          │              │              │
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Milvus    │ │    MinIO     │
│   元数据     │ │   向量存储    │ │   文件存储   │
└──────────────┘ └──────────────┘ └──────────────┘
```

## 3. 数据库设计

### 3.1 assets 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(255) | 素材名称 |
| type | VARCHAR(20) | 类型: image/video/audio |
| file_path | VARCHAR(512) | MinIO 存储路径 |
| file_size | BIGINT | 文件大小 |
| file_hash | VARCHAR(64) | SHA256 哈希 |
| vector_status | VARCHAR(20) | 向量化状态 |
| created_at | TIMESTAMP | 创建时间 |

### 3.2 video_frames 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| asset_id | UUID | 关联素材 |
| frame_index | INT | 帧序号 |
| timestamp_ms | BIGINT | 时间戳 |
| frame_path | VARCHAR(512) | 帧图片路径 |
| vector_id | VARCHAR(64) | Milvus 向量 ID |

### 3.3 tags 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | 标签名称 |
| slug | VARCHAR(100) | URL 友好标识 |
| color | VARCHAR(7) | 颜色代码 |
| asset_count | INT | 素材数量 |

### 3.4 collections 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(255) | 收藏夹名称 |
| description | TEXT | 描述 |
| asset_count | INT | 素材数量 |

## 4. Milvus 向量设计

```python
COLLECTION_NAME = "image_vectors"
VECTOR_DIM = 512

index_params = {
    "metric_type": "IP",
    "index_type": "IVF_FLAT",
    "params": {"nlist": 1024}
}
```

## 5. 核心流程

### 5.1 素材上传流程
1. 接收文件 → 验证类型
2. 计算哈希 → 去重检查
3. 上传 MinIO → 生成缩略图
4. 写入数据库 → 触发异步任务

### 5.2 搜索流程
1. 接收查询（文本/图片）
2. CN-CLIP 编码为 512 维向量
3. Milvus 相似度搜索
4. 关联 PostgreSQL 获取详情

### 5.3 视频处理流程
1. 每 2 秒抽取一帧
2. 最少 5 帧，最多 50 帧
3. 每帧独立向量化存储

## 6. MinIO 存储结构

```
assets/
├── image/2024/01/{uuid}.jpg
├── video/2024/01/{uuid}.mp4
└── audio/2024/01/{uuid}.mp3

thumbnails/
└── {uuid}.jpg

frames/
└── {asset_id}/{frame_index}.jpg
```

## 7. API 设计原则

- RESTful 风格
- 统一响应格式
- 分页支持
- 软删除机制
