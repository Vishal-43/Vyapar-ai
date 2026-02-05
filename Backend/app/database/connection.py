
from typing import Generator, AsyncGenerator, Optional

from loguru import logger
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool, QueuePool

from app.config import settings
from app.database.models import Base

async_engine = None
async_session_factory = None

sync_engine = None
sync_session_factory = None

def get_sync_db_url() -> str:

    url = settings.database_url
    
    if "aiosqlite" in url:
        return url.replace("sqlite+aiosqlite", "sqlite")
    elif "asyncpg" in url:
        return url.replace("postgresql+asyncpg", "postgresql")
    
    return url

async def init_async_db() -> None:

    global async_engine, async_session_factory
    
    logger.info(f"Initializing async database: {settings.database_url}")
    
    async_engine = create_async_engine(
        settings.database_url,
        echo=settings.db_echo,
        pool_pre_ping=True,
    )
    
    async_session_factory = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Async database initialized successfully")

def init_sync_db() -> None:

    global sync_engine, sync_session_factory
    
    db_url = get_sync_db_url()
    logger.info(f"Initializing sync database: {db_url}")
    
    if "sqlite" in db_url:
        sync_engine = create_engine(
            db_url,
            echo=settings.db_echo,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,
        )
    else:
        sync_engine = create_engine(
            db_url,
            echo=settings.db_echo,
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_pre_ping=True,
        )
    
    sync_session_factory = sessionmaker(
        bind=sync_engine,
        expire_on_commit=False,
    )
    
    Base.metadata.create_all(bind=sync_engine)
    
    logger.info("Sync database initialized successfully")

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:

    if async_session_factory is None:
        await init_async_db()
    
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.exception(f"Database session error: {str(e)}")
            await session.rollback()
            raise
        finally:
            await session.close()

def get_sync_session() -> Generator[Session, None, None]:

    if sync_session_factory is None:
        init_sync_db()
    
    session = sync_session_factory()
    try:
        yield session
    except Exception as e:
        logger.exception(f"Database session error: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()

async def close_async_db() -> None:

    global async_engine
    
    if async_engine is not None:
        logger.info("Closing async database connections...")
        await async_engine.dispose()
        logger.info("Async database connections closed")

def close_sync_db() -> None:

    global sync_engine
    
    if sync_engine is not None:
        logger.info("Closing sync database connections...")
        sync_engine.dispose()
        logger.info("Sync database connections closed")

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async for session in get_async_session():
        yield session
