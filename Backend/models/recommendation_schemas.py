
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

class RecommendationType(str, Enum):

    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    STOCK_UP = "STOCK_UP"
    STOCK_DOWN = "STOCK_DOWN"

class ConfidenceLevel(str, Enum):

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class TimeHorizon(str, Enum):

    SHORT_TERM = "SHORT_TERM"
    MID_TERM = "MID_TERM"
    LONG_TERM = "LONG_TERM"

class AccuracyRating(str, Enum):

    CORRECT = "CORRECT"
    INCORRECT = "INCORRECT"
    PARTIAL = "PARTIAL"
    PENDING = "PENDING"

class RecommendationBase(BaseModel):

    commodity_id: Optional[int] = Field(default=None, description="Commodity identifier")
    commodity_name: str = Field(..., description="Commodity name")
    market_id: Optional[int] = Field(default=None, description="Market identifier")
    market_name: Optional[str] = Field(default=None, description="Market name")
    recommendation_type: RecommendationType = Field(..., description="Recommendation action")
    confidence: ConfidenceLevel = Field(..., description="Confidence level")
    reasoning: str = Field(..., description="Short reasoning summary")
    current_price: Optional[float] = Field(
        default=None, description="Current price at recommendation time"
    )
    target_price: Optional[float] = Field(default=None, description="Target price")
    expected_change_pct: Optional[float] = Field(
        default=None,
        description="Expected change percentage",
    )
    time_horizon: TimeHorizon = Field(..., description="Expected time horizon")
    created_at: datetime = Field(..., description="Creation timestamp")
    expires_at: Optional[datetime] = Field(default=None, description="Expiration timestamp")
    model_version: Optional[str] = Field(default="v1.0", description="Model version")

    model_config = {
        "json_schema_extra": {
            "example": {
                "commodity_id": 101,
                "commodity_name": "Wheat",
                "market_id": 22,
                "market_name": "Delhi",
                "recommendation_type": "BUY",
                "confidence": "HIGH",
                "reasoning": "Seasonal demand spike and supply tightening.",
                "current_price": 2120.5,
                "target_price": 2285.0,
                "expected_change_pct": 7.8,
                "time_horizon": "SHORT_TERM",
                "created_at": "2026-01-29T09:15:00Z",
                "expires_at": "2026-02-10T09:15:00Z",
                "model_version": "v1.0",
            }
        }
    }

class RecommendationResponse(RecommendationBase):

    id: int = Field(..., description="Recommendation id")
    acknowledged: bool = Field(default=False, description="Whether user acknowledged")
    acknowledgement_note: Optional[str] = Field(
        default=None, description="Optional acknowledgement note"
    )
    last_evaluated_at: Optional[datetime] = Field(
        default=None, description="Last evaluation timestamp"
    )

class RecommendationListResponse(BaseModel):

    recommendations: List[RecommendationResponse]
    total: int
    generated_at: datetime

class RecommendationHistoryItem(BaseModel):

    id: int
    commodity_name: str
    recommendation_type: RecommendationType
    confidence: ConfidenceLevel
    created_at: datetime
    outcome: AccuracyRating
    actual_change_pct: Optional[float] = Field(default=None, ge=-100, le=100)
    roi_pct: Optional[float] = Field(default=None, ge=-100, le=500)
    note: Optional[str] = Field(default=None, max_length=280)

class RecommendationHistoryResponse(BaseModel):

    history: List[RecommendationHistoryItem]
    total: int

class AcknowledgeRecommendationRequest(BaseModel):

    note: Optional[str] = Field(default=None, max_length=280)

class RecordRecommendationAccuracyRequest(BaseModel):

    outcome: AccuracyRating
    actual_change_pct: Optional[float] = Field(default=None, ge=-100, le=100)
    roi_pct: Optional[float] = Field(default=None, ge=-100, le=500)
    note: Optional[str] = Field(default=None, max_length=280)

class RecommendationMetricsResponse(BaseModel):

    total_recommendations: int
    correct_count: int
    incorrect_count: int
    partial_count: int
    accuracy_rate: float = Field(..., ge=0, le=1)
    average_roi_pct: float
    by_type_accuracy: dict[str, float]
    generated_at: datetime
