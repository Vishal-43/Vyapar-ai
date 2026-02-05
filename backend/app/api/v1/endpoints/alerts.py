
from typing import List, Optional
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from loguru import logger

from app.api.dependencies import (
    get_alert_repo,
    get_commodity_repo,
    get_market_repo,
)
from app.models.schemas import (
    AlertRequest,
    AlertResponse,
    AlertUpdateRequest,
)
from app.database.repositories import (
    AlertRepository,
    CommodityRepository,
    MarketRepository,
)
from app.database.models import Alert
from app.core.utils import get_current_timestamp

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    request: AlertRequest,
    alert_repo: AlertRepository = Depends(get_alert_repo),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
) -> AlertResponse:

    try:
        if request.commodity_id:
            commodity = await commodity_repo.get_by_id(request.commodity_id)
            if not commodity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Commodity {request.commodity_id} not found"
                )

        if request.market_id:
            market = await market_repo.get_by_id(request.market_id)
            if not market:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Market {request.market_id} not found"
                )

        alert = Alert(
            alert_type=request.alert_type,
            commodity_id=request.commodity_id,
            market_id=request.market_id,
            priority=request.priority,
            status="ACTIVE",
            conditions=request.conditions,
            notification_channels=request.notification_channels or ["email"],
            message=request.message,
        )

        created = await alert_repo.create(alert)

        logger.info(
            f"Alert created: type={created.alert_type}, "
            f"priority={created.priority}, id={created.id}"
        )

        return AlertResponse(
            id=created.id,
            alert_type=created.alert_type,
            commodity_id=created.commodity_id,
            market_id=created.market_id,
            priority=created.priority,
            status=created.status,
            conditions=created.conditions,
            notification_channels=created.notification_channels,
            message=created.message,
            triggered_at=created.triggered_at,
            resolved_at=created.resolved_at,
            created_at=created.created_at,
            updated_at=created.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating alert: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    alert_type: Optional[str] = None,
    priority: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    commodity_id: Optional[int] = None,
    market_id: Optional[int] = None,
    active_only: bool = True,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> List[AlertResponse]:

    try:
        if active_only and not status_filter:
            alerts = await alert_repo.get_active_alerts()
        elif status_filter:
            alerts = await alert_repo.get_alerts_by_status(status_filter)
        elif commodity_id:
            alerts = await alert_repo.get_alerts_by_commodity(commodity_id)
        else:
            alerts = await alert_repo.get_all(skip=skip, limit=limit)

        if alert_type:
            alerts = [a for a in alerts if a.alert_type == alert_type]
        if priority:
            alerts = [a for a in alerts if a.priority == priority]
        if market_id:
            alerts = [a for a in alerts if a.market_id == market_id]

        alerts = alerts[skip:skip + limit]

        return [
            AlertResponse(
                id=a.id,
                alert_type=a.alert_type,
                commodity_id=a.commodity_id,
                market_id=a.market_id,
                priority=a.priority,
                status=a.status,
                conditions=a.conditions,
                notification_channels=a.notification_channels,
                message=a.message,
                triggered_at=a.triggered_at,
                resolved_at=a.resolved_at,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in alerts
        ]

    except Exception as e:
        logger.error(f"Error listing alerts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> AlertResponse:

    alert = await alert_repo.get_by_id(alert_id)
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )

    return AlertResponse(
        id=alert.id,
        alert_type=alert.alert_type,
        commodity_id=alert.commodity_id,
        market_id=alert.market_id,
        priority=alert.priority,
        status=alert.status,
        conditions=alert.conditions,
        notification_channels=alert.notification_channels,
        message=alert.message,
        triggered_at=alert.triggered_at,
        resolved_at=alert.resolved_at,
        created_at=alert.created_at,
        updated_at=alert.updated_at,
    )

@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    request: AlertUpdateRequest,
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> AlertResponse:

    try:
        alert = await alert_repo.get_by_id(alert_id)
        
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert {alert_id} not found"
            )

        update_data = {}
        if request.status is not None:
            update_data['status'] = request.status
            if request.status == "RESOLVED":
                update_data['resolved_at'] = get_current_timestamp()
        if request.priority is not None:
            update_data['priority'] = request.priority
        if request.conditions is not None:
            update_data['conditions'] = request.conditions
        if request.notification_channels is not None:
            update_data['notification_channels'] = request.notification_channels

        updated = await alert_repo.update(alert_id, update_data)

        logger.info(f"Alert updated: id={alert_id}, status={updated.status}")

        return AlertResponse(
            id=updated.id,
            alert_type=updated.alert_type,
            commodity_id=updated.commodity_id,
            market_id=updated.market_id,
            priority=updated.priority,
            status=updated.status,
            conditions=updated.conditions,
            notification_channels=updated.notification_channels,
            message=updated.message,
            triggered_at=updated.triggered_at,
            resolved_at=updated.resolved_at,
            created_at=updated.created_at,
            updated_at=updated.updated_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating alert: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    alert_repo: AlertRepository = Depends(get_alert_repo),
):

    try:
        alert = await alert_repo.get_by_id(alert_id)
        
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert {alert_id} not found"
            )

        await alert_repo.delete(alert_id)
        logger.info(f"Alert deleted: id={alert_id}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting alert: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/recent", response_model=List[AlertResponse])
async def get_recent_alerts(
    hours: int = Query(24, ge=1, le=168),
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> List[AlertResponse]:

    try:
        alerts = await alert_repo.get_recent_alerts(hours=hours)

        return [
            AlertResponse(
                id=a.id,
                alert_type=a.alert_type,
                commodity_id=a.commodity_id,
                market_id=a.market_id,
                priority=a.priority,
                status=a.status,
                conditions=a.conditions,
                notification_channels=a.notification_channels,
                message=a.message,
                triggered_at=a.triggered_at,
                resolved_at=a.resolved_at,
                created_at=a.created_at,
                updated_at=a.updated_at,
            )
            for a in alerts
        ]

    except Exception as e:
        logger.error(f"Error getting recent alerts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
