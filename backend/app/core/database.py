from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine
from app.config import settings

# 异步引擎 (FastAPI)
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# 同步引擎 (Celery)
sync_database_url = settings.DATABASE_URL.replace("+asyncpg", "")
sync_engine = create_engine(sync_database_url, echo=settings.DEBUG)
SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
