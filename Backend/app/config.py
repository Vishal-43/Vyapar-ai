
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    app_name: str = "Agri-Tech Backend"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = Field(default="development", pattern="^(development|staging|production)$")
    
    api_v1_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://*.devtunnel.com",
            "*"
        ]
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]
    
    database_url: str = "sqlite+aiosqlite:///./data/agritech.db"
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10
    
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    log_level: str = Field(default="INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    log_format: str = "json"
    log_file: str = "logs/app.log"
    log_rotation: str = "1 day"
    log_retention: str = "30 days"
    log_compression: str = "zip"
    
    model_dir: str = "data/models"
    model_version: str = "v1.0.0"
    ensemble_weights: dict[str, float] = {
        "xgboost": 0.35,
        "lightgbm": 0.35,
        "random_forest": 0.30
    }
    model_retrain_interval_days: int = 7
    
    scrape_timeout: int = 30
    scrape_retry_attempts: int = 3
    scrape_retry_delay: int = 5
    scrape_rate_limit: int = 10
    scrape_user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    agmarknet_base_url: str = "https://agmarknet.gov.in"
    
    data_raw_dir: str = "data/raw"
    data_processed_dir: str = "data/processed"
    data_retention_days: int = 90
    
    alert_check_interval_minutes: int = 5
    alert_batch_size: int = 100
    alert_max_retries: int = 3
    
    inventory_forecast_days: int = 30
    inventory_safety_stock_multiplier: float = 1.2
    inventory_reorder_threshold: float = 0.2
    
    rate_limit_per_minute: int = 100
    rate_limit_per_hour: int = 1000
    
    cache_ttl_seconds: int = 300
    cache_enabled: bool = True
    
    prediction_confidence_threshold: float = 0.7
    prediction_timeout_seconds: int = 10
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:

        if v is None:
            return ["http://localhost:3000", "http://localhost:8000"]
        if isinstance(v, str):
            cleaned = v.strip()
            if not cleaned:
                return ["http://localhost:3000", "http://localhost:8000"]
            return [origin.strip() for origin in cleaned.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000", "http://localhost:8000"]

    @property
    def redis_url(self) -> str:

        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def is_production(self) -> bool:

        return self.environment == "production"

    @property
    def is_development(self) -> bool:

        return self.environment == "development"

@lru_cache
def get_settings() -> Settings:

    return Settings()

settings = get_settings()
