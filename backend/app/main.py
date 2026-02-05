
import time
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app import __version__
from app.api.frontend import router as frontend_router
from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import AgriTechException
from app.core.logging_config import setup_logging
from app.core.utils import get_current_timestamp
from app.services.scheduler import get_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    logger.info(f"{settings.app_name} v{settings.app_version} starting up")
    logger.info(f"Running in {settings.environment} mode")
    
    import os
    if os.getenv("TESTING") != "1":
        scheduler = get_scheduler()
        scheduler.start()
        logger.info("Background data collection and training scheduler activated")
    else:
        logger.info("Scheduler disabled during testing")
        scheduler = None
    
    yield
    
    if scheduler:
        scheduler.stop()
    logger.info(f"{settings.app_name} shutting down gracefully")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Industry-level Agricultural Market Data Analysis API with ML predictions",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    try:
        logger.opt(lazy=True).info(
            f"{request.method} {request.url.path} completed in {process_time:.3f}s with status {response.status_code}"
        )
    except Exception:
        pass
    
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-API-Version"] = settings.app_version
    
    return response

@app.exception_handler(AgriTechException)
async def agritech_exception_handler(request: Request, exc: AgriTechException):
    
    logger.error(
        f"{exc.message} at {request.url.path}",
        extra={"status": exc.status_code, "details": exc.details}
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "details": exc.details,
            "timestamp": get_current_timestamp().isoformat(),
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):

    logger.warning(
        f"Validation error",
        extra={
            "errors": exc.errors(),
            "url": str(request.url),
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Request validation failed",
            "details": {"errors": exc.errors()},
            "timestamp": get_current_timestamp().isoformat(),
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):

    logger.exception(
        f"Unexpected error: {str(exc)}",
        extra={
            "url": str(request.url),
            "exception_type": type(exc).__name__,
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "details": {"error": str(exc)} if settings.debug else {},
            "timestamp": get_current_timestamp().isoformat(),
        }
    )

@app.get("/", tags=["Root"])
async def root() -> dict[str, Any]:

    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc",
        "timestamp": get_current_timestamp().isoformat(),
    }

app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(frontend_router, prefix="/api")
app.include_router(frontend_router, prefix=settings.api_v1_prefix)
app.include_router(frontend_router)

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
    )
