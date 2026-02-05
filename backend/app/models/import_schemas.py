
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator

class ImportStatus(str, Enum):

    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    VALIDATING = "VALIDATING"
    IMPORTING = "IMPORTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"

class ImportType(str, Enum):

    SALES_DATA = "SALES_DATA"
    MARKET_PRICES = "MARKET_PRICES"
    INVENTORY = "INVENTORY"

class ValidationErrorDetail(BaseModel):

    row: int
    column: str
    value: Any
    error_message: str
    suggestion: Optional[str] = None

class ImportStats(BaseModel):

    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    inserted_records: int
    skipped_records: int
    validation_errors: List[ValidationErrorDetail] = []

    class Config:

        json_schema_extra = {
            "example": {
                "total_records": 100,
                "valid_records": 95,
                "invalid_records": 5,
                "duplicate_records": 0,
                "inserted_records": 95,
                "skipped_records": 0,
                "validation_errors": [],
            }
        }

class ImportJobResponse(BaseModel):

    job_id: str
    status: ImportStatus
    import_type: ImportType
    filename: str
    progress_percentage: int
    stats: Optional[ImportStats] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_time_remaining: Optional[int] = None

    class Config:

        json_schema_extra = {
            "example": {
                "job_id": "import_20260129_123456",
                "status": "PROCESSING",
                "import_type": "SALES_DATA",
                "filename": "sales_data_jan.csv",
                "progress_percentage": 45,
                "stats": {
                    "total_records": 1000,
                    "valid_records": 950,
                    "invalid_records": 50,
                    "duplicate_records": 0,
                    "inserted_records": 950,
                    "skipped_records": 0,
                    "validation_errors": [],
                },
                "error_message": None,
                "created_at": "2026-01-29T10:00:00Z",
                "started_at": "2026-01-29T10:00:05Z",
                "completed_at": None,
                "estimated_time_remaining": 30,
            }
        }

class FileUploadRequest(BaseModel):

    filename: str
    import_type: ImportType
    market_id: Optional[int] = None
    commodity_id: Optional[int] = None
    skip_duplicates: bool = True
    auto_validate: bool = True

    class Config:

        json_schema_extra = {
            "example": {
                "filename": "sales_data.csv",
                "import_type": "SALES_DATA",
                "market_id": 1,
                "commodity_id": None,
                "skip_duplicates": True,
                "auto_validate": True,
            }
        }

class ImportStartRequest(BaseModel):

    job_id: str
    proceed_with_errors: bool = False

class SalesDataRow(BaseModel):

    date: str
    market_name: str
    commodity_name: str
    price: float
    quantity: float
    unit: str = "kg"
    grade: Optional[str] = None

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:

        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Date must be in YYYY-MM-DD format, got {v}")
        return v

    @field_validator("price", "quantity", mode="before")
    @classmethod
    def validate_numeric(cls, v: Any) -> float:

        if isinstance(v, str):
            v = v.strip()
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Expected numeric value, got {v}")

class MarketPriceRow(BaseModel):

    date: str
    market_name: str
    commodity_name: str
    min_price: float
    max_price: float
    modal_price: float
    arrival_quantity: float

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:

        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Date must be in YYYY-MM-DD format, got {v}")
        return v

    @field_validator("min_price", "max_price", "modal_price", "arrival_quantity", mode="before")
    @classmethod
    def validate_numeric(cls, v: Any) -> float:

        if isinstance(v, str):
            v = v.strip()
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Expected numeric value, got {v}")

class InventoryRow(BaseModel):

    date: str
    market_name: str
    commodity_name: str
    quantity_in_stock: float
    quantity_sold: float
    quantity_damaged: float
    unit: str = "kg"
    notes: Optional[str] = None

    @field_validator("date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:

        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Date must be in YYYY-MM-DD format, got {v}")
        return v

    @field_validator("quantity_in_stock", "quantity_sold", "quantity_damaged", mode="before")
    @classmethod
    def validate_numeric(cls, v: Any) -> float:

        if isinstance(v, str):
            v = v.strip()
        try:
            return float(v)
        except (ValueError, TypeError):
            raise ValueError(f"Expected numeric value, got {v}")
