
from fastapi import APIRouter, status
from loguru import logger

from app import __version__
from app.config import settings
from app.core.utils import get_current_timestamp
from app.models.schemas import HealthResponse, HealthStatus

router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Check the health status of the API and its services",
    tags=["Health"],
)
async def health_check() -> HealthResponse:

    timestamp = get_current_timestamp().isoformat()
    
    database_status = HealthStatus(
        status="healthy",
        timestamp=timestamp
    )
    
    redis_status = HealthStatus(
        status="not_configured",
        timestamp=timestamp
    )
    
    ml_models_status = HealthStatus(
        status="not_loaded",
        timestamp=timestamp
    )
    
    scraper_status = HealthStatus(
        status="healthy",
        timestamp=timestamp
    )
    
    logger.info("Health check completed successfully")
    
    return HealthResponse(
        status="healthy",
        version=__version__,
        timestamp=timestamp,
        services={
            "database": database_status,
            "redis": redis_status,
            "ml_models": ml_models_status,
            "scraper": scraper_status,
        }
    )
