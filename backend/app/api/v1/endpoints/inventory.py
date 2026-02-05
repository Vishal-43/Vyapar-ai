
from typing import List, Optional
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger
import numpy as np

from app.api.dependencies import (
    get_inventory_repo,
    get_commodity_repo,
    get_market_repo,
    get_market_price_repo,
    get_predictor,
)
from app.models.schemas import (
    InventoryResponse,
    InventorySuggestionRequest,
    InventorySuggestionResponse,
    InventoryUpdateRequest,
)
from app.database.repositories import (
    InventoryRepository,
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)
from app.ml.predictor import AgriculturalPredictor
from app.database.models import Inventory
from app.core.utils import get_current_timestamp
from app.config import settings

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=List[InventoryResponse])
async def list_inventory(
    commodity_id: Optional[int] = None,
    market_id: Optional[int] = None,
    low_stock_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    inventory_repo: InventoryRepository = Depends(get_inventory_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> List[InventoryResponse]:

    try:
        if low_stock_only:
            threshold = settings.inventory_reorder_threshold
            items = await inventory_repo.get_low_stock_items(threshold_pct=threshold)
        elif commodity_id and market_id:
            item = await inventory_repo.get_by_commodity_market(commodity_id, market_id)
            items = [item] if item else []
        elif commodity_id:
            items = await inventory_repo.get_by_commodity(commodity_id)
        else:
            items = await inventory_repo.get_all(skip=skip, limit=limit)

        responses = []
        for item in items:
            commodity = await commodity_repo.get_by_id(item.commodity_id)
            market = await market_repo.get_by_id(item.market_id)

            responses.append(
                InventoryResponse(
                    id=item.id,
                    commodity_id=item.commodity_id,
                    commodity_name=commodity.name if commodity else "Unknown",
                    market_id=item.market_id,
                    market_name=market.name if market else "Unknown",
                    current_stock=item.current_stock,
                    optimal_stock=item.optimal_stock,
                    min_stock=item.min_stock,
                    max_stock=item.max_stock,
                    reorder_point=item.reorder_point,
                    last_restocked_at=item.last_restocked_at,
                    forecast_demand=getattr(item, "forecast_demand", None),
                    created_at=item.created_at,
                    updated_at=item.updated_at,
                )
            )

        return responses

    except Exception as e:
        logger.error(f"Error listing inventory: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/suggestions", response_model=InventorySuggestionResponse)
async def get_inventory_suggestions(
    request: InventorySuggestionRequest,
    predictor: AgriculturalPredictor = Depends(get_predictor),
    inventory_repo: InventoryRepository = Depends(get_inventory_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
) -> InventorySuggestionResponse:

    try:
        logger.info(
            f"Inventory suggestion request: commodity={request.commodity_id}, "
            f"market={request.market_id}"
        )

        commodity = await commodity_repo.get_by_id(request.commodity_id)
        if not commodity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Commodity {request.commodity_id} not found"
            )

        market = await market_repo.get_by_id(request.market_id)
        if not market:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Market {request.market_id} not found"
            )

        inventory = await inventory_repo.get_by_commodity_market(
            request.commodity_id, request.market_id
        )

        current_stock = inventory.current_stock if inventory else 0

        historical_prices = await market_price_repo.get_price_history(
            commodity_id=request.commodity_id,
            market_id=request.market_id,
            days=90
        )

        if not historical_prices:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insufficient historical data for prediction"
            )

        arrivals = [p.arrival for p in historical_prices if p.arrival and p.arrival > 0]
        if arrivals:
            avg_daily_demand = np.mean(arrivals)
            std_daily_demand = np.std(arrivals)
        else:
            avg_daily_demand = 100
            std_daily_demand = 20

        forecast_days = request.forecast_days or settings.inventory_forecast_days
        forecast_demand = avg_daily_demand * forecast_days

        safety_multiplier = settings.inventory_safety_stock_multiplier
        safety_stock = std_daily_demand * np.sqrt(forecast_days) * safety_multiplier

        optimal_stock = forecast_demand + safety_stock

        lead_time_days = 7
        reorder_point = (avg_daily_demand * lead_time_days) + safety_stock

        needs_reorder = current_stock < reorder_point
        reorder_quantity = max(0, optimal_stock - current_stock) if needs_reorder else 0

        if current_stock > 0 and avg_daily_demand > 0:
            days_until_stockout = int(current_stock / avg_daily_demand)
        else:
            days_until_stockout = 0

        if days_until_stockout < 3:
            priority = "CRITICAL"
        elif days_until_stockout < 7:
            priority = "HIGH"
        elif needs_reorder:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        suggestion = InventorySuggestionResponse(
            commodity_id=request.commodity_id,
            commodity_name=commodity.name,
            market_id=request.market_id,
            market_name=market.name,
            current_stock=current_stock,
            optimal_stock=optimal_stock,
            safety_stock=safety_stock,
            reorder_point=reorder_point,
            reorder_quantity=reorder_quantity,
            needs_reorder=needs_reorder,
            forecast_demand=forecast_demand,
            forecast_days=forecast_days,
            days_until_stockout=days_until_stockout,
            priority=priority,
            confidence=0.85,
            reasoning=[
                f"Average daily demand: {avg_daily_demand:.2f} units",
                f"Forecast period: {forecast_days} days",
                f"Safety stock: {safety_stock:.2f} units",
                f"Current stock covers {days_until_stockout} days" if days_until_stockout > 0 else "Stock depleted",
            ],
            timestamp=get_current_timestamp(),
        )

        logger.info(
            f"Inventory suggestion: optimal={optimal_stock:.0f}, "
            f"reorder={reorder_quantity:.0f}, priority={priority}"
        )

        return suggestion

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating inventory suggestion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: int,
    request: InventoryUpdateRequest,
    inventory_repo: InventoryRepository = Depends(get_inventory_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> InventoryResponse:

    try:
        inventory = await inventory_repo.get_by_id(inventory_id)
        
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Inventory {inventory_id} not found"
            )

        update_data = {}
        if request.current_stock is not None:
            update_data['current_stock'] = request.current_stock
        if request.optimal_stock is not None:
            update_data['optimal_stock'] = request.optimal_stock
        if request.reorder_point is not None:
            update_data['reorder_point'] = request.reorder_point

        updated = await inventory_repo.update(inventory_id, update_data)

        commodity = await commodity_repo.get_by_id(updated.commodity_id)
        market = await market_repo.get_by_id(updated.market_id)

        return InventoryResponse(
            id=updated.id,
            commodity_id=updated.commodity_id,
            commodity_name=commodity.name if commodity else "Unknown",
            market_id=updated.market_id,
            market_name=market.name if market else "Unknown",
            current_stock=updated.current_stock,
            optimal_stock=updated.optimal_stock,
            min_stock=updated.min_stock,
            max_stock=updated.max_stock,
            reorder_point=updated.reorder_point,
            last_restocked_at=updated.last_restocked_at,
            forecast_demand=updated.forecast_demand,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating inventory: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
