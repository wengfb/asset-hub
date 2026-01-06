"""初始化数据库表

Revision ID: 001_initial
Revises:
Create Date: 2024-01-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建 assets 表
    op.create_table(
        'assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('file_size', sa.BigInteger, nullable=False),
        sa.Column('file_hash', sa.String(64), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('metadata', postgresql.JSONB, default={}),
        sa.Column('thumbnail_path', sa.String(512)),
        sa.Column('vector_status', sa.String(20), default='pending'),
        sa.Column('vector_id', sa.String(64)),
        sa.Column('view_count', sa.Integer, default=0),
        sa.Column('use_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_assets_type', 'assets', ['type'])
    op.create_index('ix_assets_file_hash', 'assets', ['file_hash'])

    # 创建 video_frames 表
    op.create_table(
        'video_frames',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('frame_index', sa.Integer, nullable=False),
        sa.Column('timestamp_ms', sa.BigInteger, nullable=False),
        sa.Column('frame_path', sa.String(512), nullable=False),
        sa.Column('vector_id', sa.String(64)),
        sa.Column('is_scene_start', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_video_frames_asset_id', 'video_frames', ['asset_id'])

    # 创建 tags 表
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('color', sa.String(7), default='#6366f1'),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tags.id')),
        sa.Column('asset_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 创建 asset_tags 关联表
    op.create_table(
        'asset_tags',
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    )

    # 创建 collections 表
    op.create_table(
        'collections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('type', sa.String(20), default='folder'),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('collections.id')),
        sa.Column('cover_asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id')),
        sa.Column('asset_count', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # 创建 collection_assets 关联表
    op.create_table(
        'collection_assets',
        sa.Column('collection_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('collections.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE'), primary_key=True),
    )

    # 创建 usage_history 表
    op.create_table(
        'usage_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('assets.id', ondelete='CASCADE')),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('context', postgresql.JSONB, default={}),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_usage_history_asset_id', 'usage_history', ['asset_id'])


def downgrade() -> None:
    op.drop_table('usage_history')
    op.drop_table('collection_assets')
    op.drop_table('collections')
    op.drop_table('asset_tags')
    op.drop_table('tags')
    op.drop_table('video_frames')
    op.drop_table('assets')
