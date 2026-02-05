
from typing import AsyncGenerator, Generator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, Request
from loguru import logger

from app.database.connection import get_async_session
from app.database.repositories import (
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
    AlertRepository,
    InventoryRepository,
    PredictionMetricsRepository,
    PredictionRepository,
    DiscussionRepository,
    WatchlistRepository,
    MarketTrendAnalysisRepository,
)
from app.ml.predictor import AgriculturalPredictor

async def get_db() -> AsyncGenerator[AsyncSession, None]:

    async for session in get_async_session():
        yield session

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:

    async for session in get_async_session():
        yield session

async def get_current_user(request: Request) -> dict:

    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "") if auth_header else None
    if not token:
        return {}
    return {"user_id": token, "token": token}

async def get_commodity_repo(db: AsyncSession = Depends(get_db)) -> CommodityRepository:

    return CommodityRepository(db)

async def get_market_repo(db: AsyncSession = Depends(get_db)) -> MarketRepository:

    return MarketRepository(db)

async def get_market_price_repo(db: AsyncSession = Depends(get_db)) -> MarketPriceRepository:

    return MarketPriceRepository(db)

async def get_alert_repo(db: AsyncSession = Depends(get_db)) -> AlertRepository:

    return AlertRepository(db)

async def get_inventory_repo(db: AsyncSession = Depends(get_db)) -> InventoryRepository:

    return InventoryRepository(db)

async def get_prediction_metrics_repo(
    db: AsyncSession = Depends(get_db)
) -> PredictionMetricsRepository:

    return PredictionMetricsRepository(db)

async def get_prediction_repo(db: AsyncSession = Depends(get_db)) -> PredictionRepository:

    return PredictionRepository(db)

async def get_discussion_repo(db: AsyncSession = Depends(get_db)) -> DiscussionRepository:

    return DiscussionRepository(db)

async def get_watchlist_repo(db: AsyncSession = Depends(get_db)) -> WatchlistRepository:

    return WatchlistRepository(db)

async def get_market_trend_analysis_repo(
    db: AsyncSession = Depends(get_db)
) -> MarketTrendAnalysisRepository:

    return MarketTrendAnalysisRepository(db)

_predictor_instance = None

@lru_cache()
def get_predictor() -> AgriculturalPredictor:

    global _predictor_instance
    
    if _predictor_instance is None:
        logger.info("Initializing AgriculturalPredictor singleton")
        _predictor_instance = AgriculturalPredictor()
        
        try:
            _predictor_instance.load_latest_models()
            logger.info("Loaded latest ML models")
        except Exception as e:
            logger.warning(f"Could not load ML models: {e}")
    
    return _predictor_instance

def reset_predictor() -> None:

    global _predictor_instance
    _predictor_instance = None
    get_predictor.cache_clear()
    logger.info("Predictor instance reset")
