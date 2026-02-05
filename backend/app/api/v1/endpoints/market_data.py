
from typing import List, Optional
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import (
    get_commodity_repo,
    get_market_repo,
    get_market_price_repo,
)
from app.models.schemas import (
    CommodityResponse,
    MarketResponse,
    MarketPriceResponse,
    MarketDataListResponse,
)
from app.database.repositories import (
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)
from app.core.utils import get_current_timestamp

router = APIRouter(prefix="/market-data", tags=["market-data"])

@router.get("/commodities", response_model=List[CommodityResponse])
async def list_commodities(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
) -> List[CommodityResponse]:

    try:
        if search:
            commodities = await commodity_repo.search(search_term=search, limit=limit)
        elif category:
            commodities = await commodity_repo.get_by_category(category=category)
            commodities = commodities[skip:skip + limit]
        else:
            commodities = await commodity_repo.get_all(skip=skip, limit=limit)

        return [
            CommodityResponse(
                id=c.id,
                name=c.name,
                category=c.category,
                unit=c.unit,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in commodities
        ]

    except Exception as e:
        logger.error(f"Error listing commodities: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/commodities/{commodity_id}", response_model=CommodityResponse)
async def get_commodity(
    commodity_id: int,
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
) -> CommodityResponse:

    commodity = await commodity_repo.get_by_id(commodity_id)
    
    if not commodity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commodity {commodity_id} not found"
        )

    return CommodityResponse(
        id=commodity.id,
        name=commodity.name,
        category=commodity.category,
        unit=commodity.unit,
        created_at=commodity.created_at,
        updated_at=commodity.updated_at,
    )

@router.get("/markets", response_model=List[MarketResponse])
async def list_markets(
    state: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> List[MarketResponse]:

    try:
        if search:
            markets = await market_repo.search(search_term=search, limit=limit)
        elif state:
            markets = await market_repo.get_by_state(state=state)
            markets = markets[skip:skip + limit]
        else:
            markets = await market_repo.get_all(skip=skip, limit=limit)

        return [
            MarketResponse(
                id=m.id,
                name=m.name,
                state=m.state,
                district=m.district,
                address=getattr(m, "address", None),
                latitude=m.latitude,
                longitude=m.longitude,
                created_at=m.created_at,
                updated_at=m.updated_at,
            )
            for m in markets
        ]

    except Exception as e:
        logger.error(f"Error listing markets: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/markets/{market_id}", response_model=MarketResponse)
async def get_market(
    market_id: int,
    market_repo: MarketRepository = Depends(get_market_repo),
) -> MarketResponse:

    market = await market_repo.get_by_id(market_id)
    
    if not market:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market {market_id} not found"
        )

    return MarketResponse(
        id=market.id,
        name=market.name,
        state=market.state,
        district=market.district,
        address=getattr(market, "address", None),
        latitude=market.latitude,
        longitude=market.longitude,
        created_at=market.created_at,
        updated_at=market.updated_at,
    )

@router.get("/prices", response_model=MarketDataListResponse)
async def get_market_prices(
    commodity_id: Optional[int] = None,
    market_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> MarketDataListResponse:

    try:
        if not end_date:
            end_date = get_current_timestamp().date()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        if commodity_id and market_id:
            prices = await market_price_repo.get_price_history(
                commodity_id=commodity_id,
                market_id=market_id,
                days=(end_date - start_date).days
            )
        elif market_id:
            prices = await market_price_repo.get_market_prices(
                market_id=market_id,
                date=end_date
            )
        else:
            prices = await market_price_repo.get_all(skip=skip, limit=limit)

        total = len(prices)
        prices = prices[skip:skip + limit]

        commodity_map = {}
        market_map = {}

        for price in prices:
            if price.commodity_id not in commodity_map:
                commodity = await commodity_repo.get_by_id(price.commodity_id)
                if commodity:
                    commodity_map[price.commodity_id] = commodity.name

            if price.market_id not in market_map:
                market = await market_repo.get_by_id(price.market_id)
                if market:
                    market_map[price.market_id] = market.name

        price_responses = [
            MarketPriceResponse(
                id=p.id,
                commodity_id=p.commodity_id,
                commodity_name=commodity_map.get(p.commodity_id, "Unknown"),
                market_id=p.market_id,
                market_name=market_map.get(p.market_id, "Unknown"),
                date=p.date,
                price=p.price,
                min_price=p.min_price,
                max_price=p.max_price,
                modal_price=p.modal_price,
                arrival=p.arrival,
                created_at=p.created_at,
                updated_at=p.updated_at,
            )
            for p in prices
        ]

        return MarketDataListResponse(
            data=price_responses,
            total=total,
            skip=skip,
            limit=limit,
            timestamp=get_current_timestamp(),
        )

    except Exception as e:
        logger.error(f"Error querying market prices: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/prices/{commodity_id}/{market_id}/latest", response_model=MarketPriceResponse)
async def get_latest_price(
    commodity_id: int,
    market_id: int,
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> MarketPriceResponse:

    try:
        price = await market_price_repo.get_latest_price(
            commodity_id=commodity_id,
            market_id=market_id
        )

        if not price:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No price data found for commodity {commodity_id} in market {market_id}"
            )

        commodity = await commodity_repo.get_by_id(commodity_id)
        market = await market_repo.get_by_id(market_id)

        return MarketPriceResponse(
            id=price.id,
            commodity_id=price.commodity_id,
            commodity_name=commodity.name if commodity else "Unknown",
            market_id=price.market_id,
            market_name=market.name if market else "Unknown",
            date=price.date,
            price=price.price,
            min_price=price.min_price,
            max_price=price.max_price,
            modal_price=price.modal_price,
            arrival=price.arrival,
            created_at=price.created_at,
            updated_at=price.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest price: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
