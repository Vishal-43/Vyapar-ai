
from typing import Optional, List
from datetime import datetime, date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
import numpy as np

from app.api.dependencies import get_db
from app.models.schemas import (
    MarketTrendAnalysisResponse,
    MarketTrendComparisonResponse,
)
from app.database.repositories import (
    MarketTrendAnalysisRepository,
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)

router = APIRouter(prefix="/market-trends", tags=["Market Trends"])

def get_trend_repo(db: AsyncSession = Depends(get_db)) -> MarketTrendAnalysisRepository:

    return MarketTrendAnalysisRepository(db)

def get_commodity_repo(db: AsyncSession = Depends(get_db)) -> CommodityRepository:

    return CommodityRepository(db)

def get_market_repo(db: AsyncSession = Depends(get_db)) -> MarketRepository:

    return MarketRepository(db)

def get_price_repo(db: AsyncSession = Depends(get_db)) -> MarketPriceRepository:

    return MarketPriceRepository(db)

async def _build_trend_response(
    trend_analysis,
    commodity_repo: CommodityRepository,
    market_repo: MarketRepository,
) -> MarketTrendAnalysisResponse:

    commodity = await commodity_repo.get_by_id(trend_analysis.commodity_id)
    market = await market_repo.get_by_id(trend_analysis.market_id)
    
    trend_label = f"{trend_analysis.trend_direction} ({trend_analysis.trend_strength * 100:.0f}% strength)"
    
    return MarketTrendAnalysisResponse(
        id=trend_analysis.id,
        commodity_id=trend_analysis.commodity_id,
        commodity_name=commodity.name if commodity else "Unknown",
        market_id=trend_analysis.market_id,
        market_name=market.name if market else "Unknown",
        analysis_date=trend_analysis.analysis_date.isoformat(),
        period_days=trend_analysis.period_days,
        avg_price=trend_analysis.avg_price,
        min_price=trend_analysis.min_price,
        max_price=trend_analysis.max_price,
        price_volatility=round(trend_analysis.price_volatility, 4),
        trend_direction=trend_analysis.trend_direction,
        trend_strength=round(trend_analysis.trend_strength, 2),
        momentum=round(trend_analysis.momentum, 4),
        total_volume=trend_analysis.total_volume,
        avg_daily_volume=trend_analysis.avg_daily_volume,
        price_range={"min": trend_analysis.min_price, "max": trend_analysis.max_price},
        trend_label=trend_label,
    )

@router.get("/{commodity_id}/{market_id}", response_model=MarketTrendComparisonResponse)
async def get_trend_comparison(
    commodity_id: int,
    market_id: int,
    repo: MarketTrendAnalysisRepository = Depends(get_trend_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> MarketTrendComparisonResponse:

    try:
        commodity = await commodity_repo.get_by_id(commodity_id)
        market = await market_repo.get_by_id(market_id)
        
        if not commodity or not market:
            raise HTTPException(status_code=404, detail="Commodity or market not found")
        
        trends_data = await repo.get_trend_comparison(commodity_id, market_id)
        
        trends_7d = await _build_trend_response(trends_data["7d"], commodity_repo, market_repo) if trends_data["7d"] else None
        trends_14d = await _build_trend_response(trends_data["14d"], commodity_repo, market_repo) if trends_data["14d"] else None
        trends_30d = await _build_trend_response(trends_data["30d"], commodity_repo, market_repo) if trends_data["30d"] else None
        
        trend_change = "STABLE"
        recommendation = "HOLD"
        
        if trends_7d and trends_30d:
            if trends_7d.trend_direction != trends_30d.trend_direction:
                trend_change = "REVERSING"
                if trends_7d.trend_direction == "INCREASING":
                    recommendation = "BUY - Uptrend starting"
                elif trends_7d.trend_direction == "DECREASING":
                    recommendation = "SELL - Downtrend starting"
            elif trends_7d.trend_strength > trends_30d.trend_strength:
                trend_change = "ACCELERATING"
            else:
                trend_change = "MODERATING"
        
        return MarketTrendComparisonResponse(
            commodity_id=commodity_id,
            commodity_name=commodity.name,
            market_id=market_id,
            market_name=market.name,
            trends_7d=trends_7d,
            trends_14d=trends_14d,
            trends_30d=trends_30d,
            trend_change=trend_change,
            recommendation=recommendation,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trend comparison: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trend analysis")

@router.get("/period/{commodity_id}/{market_id}/{period_days}", response_model=MarketTrendAnalysisResponse)
async def get_trend_for_period(
    commodity_id: int,
    market_id: int,
    period_days: int = Path(..., ge=1, le=365),
    repo: MarketTrendAnalysisRepository = Depends(get_trend_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> MarketTrendAnalysisResponse:

    try:
        trend_analysis = await repo.get_latest_analysis(commodity_id, market_id, period_days)
        
        if not trend_analysis:
            raise HTTPException(status_code=404, detail="No trend analysis available for this period")
        
        return await _build_trend_response(trend_analysis, commodity_repo, market_repo)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trend analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trend analysis")

@router.get("/history/{commodity_id}/{market_id}", response_model=List[MarketTrendAnalysisResponse])
async def get_trend_history(
    commodity_id: int,
    market_id: int,
    period_days: int = Query(7, ge=7, le=365),
    days_back: int = Query(90, ge=1, le=365),
    repo: MarketTrendAnalysisRepository = Depends(get_trend_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> List[MarketTrendAnalysisResponse]:

    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)
        
        trend_history = await repo.get_by_date_range(
            commodity_id, market_id, start_date, end_date, period_days
        )
        
        responses = []
        for trend in trend_history:
            responses.append(await _build_trend_response(trend, commodity_repo, market_repo))
        
        return responses
    except Exception as e:
        logger.error(f"Error fetching trend history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trend history")

@router.get("/analyze/{commodity_id}/{market_id}", response_model=dict)
async def analyze_market_trends(
    commodity_id: int,
    market_id: int,
    price_repo: MarketPriceRepository = Depends(get_price_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> dict:

    try:
        commodity = await commodity_repo.get_by_id(commodity_id)
        market = await market_repo.get_by_id(market_id)
        
        if not commodity or not market:
            raise HTTPException(status_code=404, detail="Commodity or market not found")
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=90)
        
        prices = await price_repo.get_price_history(commodity_id, market_id, start_date, end_date)
        
        if not prices:
            raise HTTPException(status_code=404, detail="No price data available for analysis")
        
        price_values = [p.price for p in prices]
        
        avg_price = np.mean(price_values)
        min_price = np.min(price_values)
        max_price = np.max(price_values)
        volatility = np.std(price_values) / avg_price if avg_price > 0 else 0
        
        recent_prices = price_values[-14:]
        old_prices = price_values[:14]
        
        recent_avg = np.mean(recent_prices) if recent_prices else avg_price
        old_avg = np.mean(old_prices) if old_prices else avg_price
        
        change_percent = ((recent_avg - old_avg) / old_avg * 100) if old_avg > 0 else 0
        
        if change_percent > 5:
            trend_direction = "INCREASING"
            trend_strength = min(1.0, abs(change_percent) / 20)
        elif change_percent < -5:
            trend_direction = "DECREASING"
            trend_strength = min(1.0, abs(change_percent) / 20)
        else:
            trend_direction = "STABLE"
            trend_strength = 0.3
        
        momentum = (price_values[-1] - price_values[0]) / len(price_values) if len(price_values) > 1 else 0
        
        return {
            "commodity_id": commodity_id,
            "commodity_name": commodity.name,
            "market_id": market_id,
            "market_name": market.name,
            "analysis_date": end_date.isoformat(),
            "analysis_period_days": 90,
            "data_points": len(prices),
            "current_price": price_values[-1],
            "avg_price": round(avg_price, 2),
            "min_price": min_price,
            "max_price": max_price,
            "price_range": max_price - min_price,
            "price_change_percent": round(change_percent, 2),
            "volatility": round(volatility, 4),
            "trend_direction": trend_direction,
            "trend_strength": round(trend_strength, 2),
            "momentum": round(momentum, 4),
            "support_level": round(np.percentile(price_values, 25), 2),
            "resistance_level": round(np.percentile(price_values, 75), 2),
            "recommendation": "BUY" if trend_direction == "INCREASING" and trend_strength > 0.5 else 
                            "SELL" if trend_direction == "DECREASING" and trend_strength > 0.5 else "HOLD",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing market trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze market trends")
