
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.schemas import (
    WatchlistCreate,
    WatchlistUpdate,
    WatchlistResponse,
    WatchlistListResponse,
)
from app.database.repositories import (
    WatchlistRepository,
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)
from app.core.utils import get_current_timestamp
from datetime import datetime, timedelta

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

def get_watchlist_repo(db: AsyncSession = Depends(get_db)) -> WatchlistRepository:

    return WatchlistRepository(db)

def get_commodity_repo(db: AsyncSession = Depends(get_db)) -> CommodityRepository:

    return CommodityRepository(db)

def get_market_repo(db: AsyncSession = Depends(get_db)) -> MarketRepository:

    return MarketRepository(db)

def get_market_price_repo(db: AsyncSession = Depends(get_db)) -> MarketPriceRepository:

    return MarketPriceRepository(db)

@router.get("/{user_id}", response_model=WatchlistListResponse)
async def get_user_watchlist(
    user_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    repo: WatchlistRepository = Depends(get_watchlist_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    price_repo: MarketPriceRepository = Depends(get_market_price_repo),
) -> WatchlistListResponse:

    try:
        watchlist_items = await repo.get_user_watchlist(user_id, skip, limit)
        
        responses = []
        for item in watchlist_items:
            commodity = await commodity_repo.get_by_id(item.commodity_id)
            market = await market_repo.get_by_id(item.market_id) if item.market_id else None
            
            current_price = None
            if market and commodity:
                latest_price = await price_repo.get_latest_price(item.commodity_id, item.market_id)
                current_price = latest_price.price if latest_price else None
            
            responses.append(
                WatchlistResponse(
                    id=item.id,
                    user_id=item.user_id,
                    commodity_id=item.commodity_id,
                    commodity_name=commodity.name if commodity else None,
                    market_id=item.market_id,
                    market_name=market.name if market else None,
                    current_price=current_price,
                    notes=item.notes,
                    alert_on_price_change=item.alert_on_price_change,
                    price_change_threshold=item.price_change_threshold,
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )
        
        return WatchlistListResponse(
            watchlist=responses,
            total=len(responses),
        )
    except Exception as e:
        logger.error(f"Error fetching watchlist for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch watchlist")

@router.post("", response_model=WatchlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    request: WatchlistCreate,
    repo: WatchlistRepository = Depends(get_watchlist_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> WatchlistResponse:

    try:
        commodity = await commodity_repo.get_by_id(request.commodity_id)
        if not commodity:
            raise HTTPException(status_code=404, detail="Commodity not found")
        
        market = None
        if request.market_id:
            market = await market_repo.get_by_id(request.market_id)
            if not market:
                raise HTTPException(status_code=404, detail="Market not found")
        
        if await repo.exists(request.user_id, request.commodity_id, request.market_id):
            raise HTTPException(status_code=400, detail="Item already in watchlist")
        
        watchlist_item = await repo.create(
            user_id=request.user_id,
            commodity_id=request.commodity_id,
            market_id=request.market_id,
            notes=request.notes,
            alert_on_price_change=request.alert_on_price_change,
            price_change_threshold=request.price_change_threshold,
        )
        
        logger.info(f"Added to watchlist: user={request.user_id}, commodity={request.commodity_id}")
        
        return WatchlistResponse(
            id=watchlist_item.id,
            user_id=watchlist_item.user_id,
            commodity_id=watchlist_item.commodity_id,
            commodity_name=commodity.name,
            market_id=watchlist_item.market_id,
            market_name=market.name if market else None,
            notes=watchlist_item.notes,
            alert_on_price_change=watchlist_item.alert_on_price_change,
            price_change_threshold=watchlist_item.price_change_threshold,
            created_at=watchlist_item.created_at,
            updated_at=watchlist_item.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding to watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add to watchlist")

@router.put("/{watchlist_id}", response_model=WatchlistResponse)
async def update_watchlist_entry(
    watchlist_id: int,
    request: WatchlistUpdate,
    repo: WatchlistRepository = Depends(get_watchlist_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> WatchlistResponse:

    try:
        watchlist_item = await repo.get_by_id(watchlist_id)
        if not watchlist_item:
            raise HTTPException(status_code=404, detail="Watchlist entry not found")
        
        if request.notes is not None:
            watchlist_item.notes = request.notes
        if request.alert_on_price_change is not None:
            watchlist_item.alert_on_price_change = request.alert_on_price_change
        if request.price_change_threshold is not None:
            watchlist_item.price_change_threshold = request.price_change_threshold
        
        watchlist_item.updated_at = get_current_timestamp()
        await repo.db.flush()
        
        commodity = await commodity_repo.get_by_id(watchlist_item.commodity_id)
        market = await market_repo.get_by_id(watchlist_item.market_id) if watchlist_item.market_id else None
        
        logger.info(f"Updated watchlist entry: {watchlist_id}")
        
        return WatchlistResponse(
            id=watchlist_item.id,
            user_id=watchlist_item.user_id,
            commodity_id=watchlist_item.commodity_id,
            commodity_name=commodity.name if commodity else None,
            market_id=watchlist_item.market_id,
            market_name=market.name if market else None,
            notes=watchlist_item.notes,
            alert_on_price_change=watchlist_item.alert_on_price_change,
            price_change_threshold=watchlist_item.price_change_threshold,
            created_at=watchlist_item.created_at,
            updated_at=watchlist_item.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating watchlist entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update watchlist entry")

@router.delete("/{watchlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    watchlist_id: int,
    repo: WatchlistRepository = Depends(get_watchlist_repo),
):

    try:
        watchlist_item = await repo.get_by_id(watchlist_id)
        if not watchlist_item:
            raise HTTPException(status_code=404, detail="Watchlist entry not found")
        
        await repo.db.delete(watchlist_item)
        await repo.db.flush()
        
        logger.info(f"Removed from watchlist: {watchlist_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing from watchlist: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove from watchlist")
