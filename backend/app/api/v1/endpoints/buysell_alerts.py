
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import (
    get_alert_repo,
    get_commodity_repo,
    get_market_repo,
    get_market_price_repo,
)
from app.models.schemas import (
    BuySellAlertRequest,
    BuySellAlertResponse,
    BuySellAlertUpdateRequest,
    BuySellAlertListResponse,
    BuySellSignalResponse,
    BuySellSignal,
    SignalStrength,
    TrendDirection,
    AlertPriority,
)
from app.database.repositories import (
    AlertRepository,
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)
from app.database.models import Alert
from app.core.utils import get_current_timestamp

router = APIRouter(prefix="/buysell-alerts", tags=["buy-sell-alerts"])

def calculate_signal_strength(
    current_price: float,
    buy_threshold: float,
    sell_threshold: float,
) -> SignalStrength:

    if current_price < buy_threshold:
        distance = buy_threshold - current_price
        threshold_range = buy_threshold * 0.1
    else:
        distance = current_price - sell_threshold
        threshold_range = sell_threshold * 0.1
    
    if distance >= threshold_range * 0.5:
        return SignalStrength.STRONG
    elif distance >= threshold_range * 0.2:
        return SignalStrength.MODERATE
    else:
        return SignalStrength.WEAK

def determine_price_trend(
    historical_prices: list[dict],
) -> TrendDirection:

    if len(historical_prices) < 2:
        return TrendDirection.STABLE
    
    prices = [p.get("price") for p in historical_prices[-7:]]
    if not prices:
        return TrendDirection.STABLE
    
    first_price = prices[0]
    last_price = prices[-1]
    
    if last_price > first_price * 1.02:
        return TrendDirection.INCREASING
    elif last_price < first_price * 0.98:
        return TrendDirection.DECREASING
    else:
        return TrendDirection.STABLE

@router.post("", response_model=BuySellAlertResponse, status_code=status.HTTP_201_CREATED)
async def create_buysell_alert(
    request: BuySellAlertRequest,
    alert_repo: AlertRepository = Depends(get_alert_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> BuySellAlertResponse:

    try:
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

        if request.buy_threshold >= request.sell_threshold:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Buy threshold must be less than sell threshold"
            )

        conditions = {
            "buy_threshold": request.buy_threshold,
            "sell_threshold": request.sell_threshold,
            "alert_type": "BUY_SELL",
        }

        alert = Alert(
            alert_type="BUY_SELL",
            commodity_id=request.commodity_id,
            market_id=request.market_id,
            priority=request.priority.value,
            status="ACTIVE" if request.enabled else "INACTIVE",
            conditions=conditions,
            notification_channels=request.notification_channels or ["in_app"],
            message=request.message or f"Buy/Sell alert for {commodity.name} at {market.name}",
        )

        created = await alert_repo.create(alert)
        await alert_repo.db.commit()

        logger.info(
            f"Buy/Sell alert created: commodity={commodity.name}, "
            f"market={market.name}, buy={request.buy_threshold}, "
            f"sell={request.sell_threshold}, id={created.id}"
        )

        return BuySellAlertResponse(
            id=created.id,
            commodity_id=created.commodity_id,
            commodity_name=commodity.name,
            market_id=created.market_id,
            market_name=market.name,
            buy_threshold=request.buy_threshold,
            sell_threshold=request.sell_threshold,
            priority=created.priority,
            enabled=created.status == "ACTIVE",
            notification_channels=created.notification_channels,
            message=created.message,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating buy/sell alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create alert: {str(e)}"
        )

@router.get("/{alert_id}", response_model=BuySellAlertResponse)
async def get_buysell_alert(
    alert_id: int,
    alert_repo: AlertRepository = Depends(get_alert_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
) -> BuySellAlertResponse:

    try:
        alert = await alert_repo.get_by_id(alert_id)
        if not alert or alert.alert_type != "BUY_SELL":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Buy/Sell alert {alert_id} not found"
            )

        commodity = await commodity_repo.get_by_id(alert.commodity_id)
        market = await market_repo.get_by_id(alert.market_id)

        current_price_record = await market_price_repo.get_latest_price(
            commodity_id=alert.commodity_id,
            market_id=alert.market_id,
        )
        current_price = current_price_record.price if current_price_record else None

        buy_threshold = alert.conditions.get("buy_threshold")
        sell_threshold = alert.conditions.get("sell_threshold")
        signal = None
        signal_strength = None

        if current_price and buy_threshold and sell_threshold:
            if current_price <= buy_threshold:
                signal = BuySellSignal.BUY
                signal_strength = calculate_signal_strength(current_price, buy_threshold, sell_threshold)
            elif current_price >= sell_threshold:
                signal = BuySellSignal.SELL
                signal_strength = calculate_signal_strength(current_price, buy_threshold, sell_threshold)
            else:
                signal = BuySellSignal.HOLD

        return BuySellAlertResponse(
            id=alert.id,
            commodity_id=alert.commodity_id,
            commodity_name=commodity.name if commodity else None,
            market_id=alert.market_id,
            market_name=market.name if market else None,
            buy_threshold=buy_threshold,
            sell_threshold=sell_threshold,
            current_price=current_price,
            signal=signal,
            signal_strength=signal_strength,
            priority=alert.priority,
            enabled=alert.status == "ACTIVE",
            notification_channels=alert.notification_channels,
            message=alert.message,
            triggered_at=alert.triggered_at,
            last_checked_at=alert.updated_at,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching buy/sell alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch alert: {str(e)}"
        )

@router.get("", response_model=BuySellAlertListResponse)
async def list_buysell_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    enabled_only: bool = Query(True),
    alert_repo: AlertRepository = Depends(get_alert_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
) -> BuySellAlertListResponse:

    try:
        alerts = await alert_repo.get_all()
        buysell_alerts = [
            a for a in alerts 
            if a.alert_type == "BUY_SELL" and (not enabled_only or a.status == "ACTIVE")
        ]

        paginated = buysell_alerts[skip : skip + limit]

        alert_responses = []
        active_count = 0
        triggered_count = 0

        for alert in paginated:
            commodity = await commodity_repo.get_by_id(alert.commodity_id)
            market = await market_repo.get_by_id(alert.market_id)

            current_price_record = await market_price_repo.get_latest_price(
                commodity_id=alert.commodity_id,
                market_id=alert.market_id,
            )
            current_price = current_price_record.price if current_price_record else None

            buy_threshold = alert.conditions.get("buy_threshold")
            sell_threshold = alert.conditions.get("sell_threshold")
            signal = None
            signal_strength = None

            if current_price and buy_threshold and sell_threshold:
                if current_price <= buy_threshold:
                    signal = BuySellSignal.BUY
                    signal_strength = calculate_signal_strength(current_price, buy_threshold, sell_threshold)
                    triggered_count += 1
                elif current_price >= sell_threshold:
                    signal = BuySellSignal.SELL
                    signal_strength = calculate_signal_strength(current_price, buy_threshold, sell_threshold)
                    triggered_count += 1
                else:
                    signal = BuySellSignal.HOLD

            if alert.status == "ACTIVE":
                active_count += 1

            alert_responses.append(
                BuySellAlertResponse(
                    id=alert.id,
                    commodity_id=alert.commodity_id,
                    commodity_name=commodity.name if commodity else None,
                    market_id=alert.market_id,
                    market_name=market.name if market else None,
                    buy_threshold=buy_threshold,
                    sell_threshold=sell_threshold,
                    current_price=current_price,
                    signal=signal,
                    signal_strength=signal_strength,
                    priority=alert.priority,
                    enabled=alert.status == "ACTIVE",
                    notification_channels=alert.notification_channels,
                    message=alert.message,
                    triggered_at=alert.triggered_at,
                    last_checked_at=alert.updated_at,
                    created_at=alert.created_at,
                    updated_at=alert.updated_at,
                )
            )

        return BuySellAlertListResponse(
            alerts=alert_responses,
            total=len(buysell_alerts),
            active=active_count,
            triggered=triggered_count,
        )
    except Exception as e:
        logger.error(f"Error listing buy/sell alerts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list alerts: {str(e)}"
        )

@router.patch("/{alert_id}", response_model=BuySellAlertResponse)
async def update_buysell_alert(
    alert_id: int,
    request: BuySellAlertUpdateRequest,
    alert_repo: AlertRepository = Depends(get_alert_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
) -> BuySellAlertResponse:

    try:
        alert = await alert_repo.get_by_id(alert_id)
        if not alert or alert.alert_type != "BUY_SELL":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Buy/Sell alert {alert_id} not found"
            )

        if request.buy_threshold is not None or request.sell_threshold is not None:
            buy_threshold = request.buy_threshold or alert.conditions.get("buy_threshold")
            sell_threshold = request.sell_threshold or alert.conditions.get("sell_threshold")
            
            if buy_threshold >= sell_threshold:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Buy threshold must be less than sell threshold"
                )
            
            alert.conditions["buy_threshold"] = buy_threshold
            alert.conditions["sell_threshold"] = sell_threshold

        if request.priority is not None:
            alert.priority = request.priority.value
        if request.enabled is not None:
            alert.status = "ACTIVE" if request.enabled else "INACTIVE"
        if request.notification_channels is not None:
            alert.notification_channels = request.notification_channels
        if request.message is not None:
            alert.message = request.message

        alert.updated_at = get_current_timestamp()
        await alert_repo.db.flush()
        await alert_repo.db.commit()

        commodity = await commodity_repo.get_by_id(updated.commodity_id)
        market = await market_repo.get_by_id(updated.market_id)

        current_price_record = await market_price_repo.get_latest(
            commodity_id=updated.commodity_id,
            market_id=updated.market_id,
        )
        current_price = current_price_record.price if current_price_record else None

        logger.info(f"Buy/Sell alert updated: id={alert_id}")

        return BuySellAlertResponse(
            id=alert.id,
            commodity_id=alert.commodity_id,
            commodity_name=commodity.name if commodity else None,
            market_id=alert.market_id,
            market_name=market.name if market else None,
            buy_threshold=alert.conditions.get("buy_threshold"),
            sell_threshold=alert.conditions.get("sell_threshold"),
            current_price=current_price,
            priority=alert.priority,
            enabled=alert.status == "ACTIVE",
            notification_channels=alert.notification_channels,
            message=alert.message,
            created_at=alert.created_at,
            updated_at=alert.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating buy/sell alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update alert: {str(e)}"
        )

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_buysell_alert(
    alert_id: int,
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> None:

    try:
        alert = await alert_repo.get_by_id(alert_id)
        if not alert or alert.alert_type != "BUY_SELL":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Buy/Sell alert {alert_id} not found"
            )

        await alert_repo.delete(alert_id)
        await alert_repo.db.commit()
        logger.info(f"Buy/Sell alert deleted: id={alert_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting buy/sell alert: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete alert: {str(e)}"
        )
