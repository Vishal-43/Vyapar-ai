
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, AliasChoices

class AlertType(str, Enum):

    PRICE_THRESHOLD = "PRICE_THRESHOLD"
    INVENTORY_LOW = "INVENTORY_LOW"
    INVENTORY_OVERSTOCK = "INVENTORY_OVERSTOCK"
    PRICE_VOLATILITY = "PRICE_VOLATILITY"
    TREND_CHANGE = "TREND_CHANGE"
    EXPIRY_WARNING = "EXPIRY_WARNING"

class AlertPriority(str, Enum):

    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class AlertStatus(str, Enum):

    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

class InventoryAction(str, Enum):

    RESTOCK = "RESTOCK"
    REDUCE = "REDUCE"
    MAINTAIN = "MAINTAIN"
    URGENT_RESTOCK = "URGENT_RESTOCK"

class TrendDirection(str, Enum):

    INCREASING = "INCREASING"
    DECREASING = "DECREASING"
    STABLE = "STABLE"

class BuySellSignal(str, Enum):

    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"

class SignalStrength(str, Enum):

    STRONG = "STRONG"
    MODERATE = "MODERATE"
    WEAK = "WEAK"

class BaseSchema(BaseModel):

    class Config:
        from_attributes = True
        populate_by_name = True

class ModelMetrics(BaseSchema):

    accuracy: float = Field(..., ge=0, le=1, description="Model accuracy")
    rmse: float = Field(..., ge=0, description="Root Mean Square Error")
    mae: float = Field(..., ge=0, description="Mean Absolute Error")
    r2_score: float = Field(..., ge=0, le=1, description="R² score")
    mape: Optional[float] = Field(None, ge=0, description="Mean Absolute Percentage Error")

class IndividualModelMetrics(BaseSchema):

    name: str
    accuracy: float = Field(..., ge=0, le=1)
    weight: float = Field(..., ge=0, le=1)
    status: str = "ACTIVE"

class FeatureImportance(BaseSchema):

    historical_price: float = 0.0
    season: float = 0.0
    market_arrival: float = 0.0
    state: float = 0.0
    day_of_week: float = 0.0

class ModelMetadata(BaseSchema):

    ensemble_accuracy: float
    rmse: float
    mae: float
    r2_score: float
    individual_models: list[IndividualModelMetrics]
    feature_importance: dict[str, float]
    model_version: str
    trained_on: str
    training_samples: int

class PredictionMetadata(BaseSchema):

    timestamp: str
    processing_time_ms: int
    data_freshness: str

class HealthStatus(BaseSchema):

    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Check timestamp")

class HealthResponse(BaseSchema):

    status: str = "healthy"
    version: str
    timestamp: str
    services: dict[str, HealthStatus]

class MarketRequest(BaseSchema):

    state: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)

class CommodityRequest(BaseSchema):

    category: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)

class MarketDataRequest(BaseSchema):

    market: str
    commodity: str
    date: Optional[str] = None

class MarketDataResponse(BaseSchema):

    market: str
    commodity: str
    price: float
    arrival: Optional[float] = None
    date: str
    state: Optional[str] = None

class PredictionRequest(BaseSchema):

    commodity_id: int = Field(..., description="Commodity ID")
    market_id: int = Field(..., description="Market ID")
    prediction_date: str = Field(..., description="Prediction date (YYYY-MM-DD)")
    features: Optional[dict[str, Any]] = Field(default=None, description="Additional features")

class PredictionResponse(BaseSchema):

    predicted_price: float
    confidence_interval: tuple[float, float]
    model_confidence: float = Field(..., ge=0, le=1)
    confidence_score: float | None = Field(default=None, ge=0, le=1)
    models_used: list[str]
    model_metrics: ModelMetadata
    prediction_metadata: PredictionMetadata
    
    def model_dump(self, **kwargs):

        data = super().model_dump(**kwargs)
        data['confidence_score'] = data.get('model_confidence')
        return data

class ForecastPoint(BaseSchema):

    date: str
    predicted_price: float
    lower_bound: float
    upper_bound: float
    confidence: float

class ForecastRequest(BaseSchema):

    state: Optional[str] = None
    city: Optional[str] = None
    market_type: Optional[str] = Field(default=None, alias="marketType")
    market: str
    category: Optional[str] = None
    product: str
    forecast_range: int = Field(default=90, ge=7, le=180, alias="forecastRange")

class ForecastResponse(BaseSchema):

    product: str
    market: str
    state: Optional[str] = None
    range_days: int = Field(alias="rangeDays")
    trend: str
    average_price: float = Field(alias="averagePrice")
    forecasts: list[ForecastPoint]
    model_accuracy: float = Field(alias="modelAccuracy")
    notes: list[str]

class InsightItemResponse(BaseSchema):

    id: str
    title: str
    reason: str
    priority: str
    confidence: int
    time_horizon: str = Field(alias="timeHorizon")

class ModelGraphPoint(BaseSchema):
    day: str
    actual: float
    aiForecast: float
    traditionalForecast: float

class ModelAccuracySummary(BaseSchema):

    forecastAccuracy: float
    improvement: float
    mae: float
    maeTraditional: float
    mape: float
    mapeTraditional: float
    aiAccuracy: float
    traditionalAccuracy: float
    graphData: list[ModelGraphPoint] = []

class InventoryDashboardItem(BaseSchema):

    id: int
    market: str
    category: Optional[str] = None
    product: str
    current: float
    suggested: float
    risk: str

class InventoryUpdateRequest(BaseSchema):

    items: List[dict]

class InventoryUpdateResponse(BaseSchema):

    status: str
    message: str
    timestamp: str
    items_updated: int

class SelectorData(BaseSchema):

    market: str
    product: str
    forecastRange: str

class StockMetrics(BaseSchema):

    predictedDemand: int
    stockNeeded: int
    overstockRisk: int
    understockRisk: int

class DemandGraphPoint(BaseSchema):

    day: str
    actual: int
    forecast: int

class ImpactItem(BaseSchema):

    title: str = Field(validation_alias=AliasChoices("title", "event", "condition"))
    subtitle: Optional[str] = None
    delta: Optional[str] = Field(default=None, validation_alias=AliasChoices("delta", "impact"))
    positive: Optional[bool] = None

class ImpactData(BaseSchema):

    festival: list["ImpactItem"]
    weather: list["ImpactItem"]

class RecommendationRow(BaseSchema):

    product: str
    current: int
    suggested: int
    buffer: int
    risk: str

class ProductAnalysisResponse(BaseSchema):

    selectorData: SelectorData
    stockMetrics: StockMetrics
    demandGraphData: list[DemandGraphPoint]
    impactData: ImpactData
    recommendationTable: list[RecommendationRow]

class InventorySuggestionRequest(BaseSchema):

    commodity_id: int
    market_id: int
    forecast_days: int = Field(default=30, ge=1, le=90)
    current_stock: Optional[float] = Field(default=None, ge=0)

class InventoryRecommendation(BaseSchema):

    action: InventoryAction
    suggested_quantity: float
    optimal_stock_level: float
    urgency: AlertPriority
    estimated_stockout_date: Optional[str] = None

class InventoryForecast(BaseSchema):

    predicted_demand_30d: float
    predicted_price_trend: TrendDirection
    price_increase_percentage: float

class InventorySuggestionDetailedResponse(BaseSchema):

    recommendation: InventoryRecommendation
    forecast: InventoryForecast
    reasoning: list[str]
    model_metrics: ModelMetrics

class InventoryOptimization(BaseSchema):

    commodity: str
    current_stock: float
    optimal_stock: float
    adjustment: float
    cost_savings: float
    waste_reduction: str

class InventoryOptimizationResponse(BaseSchema):

    optimized_inventory: list[InventoryOptimization]
    total_cost_savings: float
    model_confidence: float

class AlertConditions(BaseSchema):

    price_above: Optional[float] = None
    price_below: Optional[float] = None
    inventory_below: Optional[float] = None
    inventory_above: Optional[float] = None
    volatility_threshold: Optional[float] = None

class AlertConfigRequest(BaseSchema):

    alert_type: AlertType
    commodity: str
    market: Optional[str] = None
    conditions: AlertConditions
    priority: AlertPriority = AlertPriority.MEDIUM
    channels: list[str] = Field(default=["in_app"])

class AlertConfigResponse(BaseSchema):

    alert_id: str
    status: str
    created_at: str

class Alert(BaseSchema):

    alert_id: str
    type: AlertType
    commodity: str
    market: Optional[str] = None
    message: str
    priority: AlertPriority
    triggered_at: str
    status: AlertStatus
    recommendation: Optional[str] = None
    current_price: Optional[float] = None
    previous_price: Optional[float] = None

class AlertListResponse(BaseSchema):

    alerts: list[Alert]
    count: int
    model_metrics: Optional[ModelMetrics] = None

class AlertStatistics(BaseSchema):

    total_alerts: int
    critical: int
    high: int
    medium: int
    low: int
    false_positive_rate: float

class AlertHistoryResponse(BaseSchema):

    alerts: list[Alert]
    statistics: AlertStatistics

class DriftDetection(BaseSchema):

    status: str
    last_checked: str
    accuracy_change: float

class PredictionStats(BaseSchema):

    total_predictions: int
    avg_confidence: float
    avg_processing_time_ms: int

class TrainingInfo(BaseSchema):

    last_trained: str
    training_samples: int
    validation_samples: int
    test_samples: int
    training_duration_minutes: int

class ModelMetricsDetailedResponse(BaseSchema):

    model_name: str
    version: str
    performance_metrics: ModelMetrics
    component_models: list[IndividualModelMetrics]
    training_info: TrainingInfo
    feature_importance: dict[str, float]
    drift_detection: DriftDetection
    prediction_stats_7d: PredictionStats

class TrendRequest(BaseSchema):

    commodity: str
    period: str = Field(default="30d", pattern=r"^\d+[dwmy]$")

class TrendDataPoint(BaseSchema):

    date: str
    value: float

class TrendResponse(BaseSchema):

    commodity: str
    period: str
    data: list[TrendDataPoint]
    trend_direction: TrendDirection
    change_percentage: float

class VolatilityResponse(BaseSchema):

    market: str
    volatility_index: float
    risk_level: str
    recent_changes: list[dict[str, Any]]

class SeasonalAnalysisResponse(BaseSchema):

    commodity: str
    seasonal_patterns: dict[str, float]
    peak_season: str
    low_season: str
    recommendations: list[str]

class ErrorResponse(BaseSchema):

    error: str
    message: str
    details: Optional[dict[str, Any]] = None
    timestamp: str

class BatchPredictionRequest(BaseSchema):

    predictions: list[PredictionRequest]

class BatchPredictionResponse(BaseSchema):

    predictions: list[PredictionResponse]
    total_predictions: int
    successful: int
    failed: int
    timestamp: datetime

class CommodityResponse(BaseSchema):

    id: int
    name: str
    category: str
    unit: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MarketResponse(BaseSchema):

    id: int
    name: str
    state: str
    district: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class MarketPriceResponse(BaseSchema):

    id: int
    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    date: Any
    price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    modal_price: Optional[float] = None
    arrival: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class MarketDataListResponse(BaseSchema):

    data: list[MarketPriceResponse]
    total: int
    skip: int
    limit: int
    timestamp: datetime

class InventoryResponse(BaseSchema):

    id: int
    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    current_stock: float
    optimal_stock: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    reorder_point: Optional[float] = None
    last_restocked_at: Optional[datetime] = None
    forecast_demand: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class InventorySuggestionResponse(BaseSchema):

    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    current_stock: float
    optimal_stock: float
    safety_stock: float
    reorder_point: float
    reorder_quantity: float
    needs_reorder: bool
    forecast_demand: float
    forecast_days: int
    days_until_stockout: int
    priority: str
    confidence: float
    reasoning: list[str]
    timestamp: datetime

class InventoryUpdateRequest(BaseSchema):

    current_stock: Optional[float] = None
    optimal_stock: Optional[float] = None
    reorder_point: Optional[float] = None

class AlertRequest(BaseSchema):

    alert_type: str
    commodity_id: Optional[int] = None
    market_id: Optional[int] = None
    priority: str
    conditions: dict[str, Any]
    notification_channels: Optional[list[str]] = None
    message: Optional[str] = None

class AlertResponse(BaseSchema):

    id: int
    alert_type: str
    commodity_id: Optional[int] = None
    market_id: Optional[int] = None
    priority: str
    status: str
    conditions: dict[str, Any]
    notification_channels: list[str]
    message: Optional[str] = None
    triggered_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class AlertUpdateRequest(BaseSchema):

    status: Optional[str] = None
    priority: Optional[str] = None
    conditions: Optional[dict[str, Any]] = None
    notification_channels: Optional[list[str]] = None

class BuySellAlertRequest(BaseSchema):

    commodity_id: int = Field(..., description="Commodity ID")
    market_id: int = Field(..., description="Market ID")
    buy_threshold: float = Field(..., ge=0, description="Price threshold for BUY signal")
    sell_threshold: float = Field(..., ge=0, description="Price threshold for SELL signal")
    priority: AlertPriority = Field(default=AlertPriority.MEDIUM)
    notification_channels: Optional[list[str]] = Field(default=["in_app"])
    message: Optional[str] = None
    enabled: bool = Field(default=True)

class BuySellAlertResponse(BaseSchema):

    id: int
    commodity_id: int
    commodity_name: Optional[str] = None
    market_id: int
    market_name: Optional[str] = None
    buy_threshold: float
    sell_threshold: float
    current_price: Optional[float] = None
    signal: Optional[BuySellSignal] = None
    signal_strength: Optional[SignalStrength] = None
    priority: str
    enabled: bool
    notification_channels: list[str]
    message: Optional[str] = None
    triggered_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class BuySellAlertUpdateRequest(BaseSchema):

    buy_threshold: Optional[float] = None
    sell_threshold: Optional[float] = None
    priority: Optional[AlertPriority] = None
    enabled: Optional[bool] = None
    notification_channels: Optional[list[str]] = None
    message: Optional[str] = None

class BuySellSignalResponse(BaseSchema):

    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    current_price: float
    buy_threshold: float
    sell_threshold: float
    signal: BuySellSignal
    signal_strength: SignalStrength
    confidence: float = Field(..., ge=0, le=1)
    reasoning: list[str]
    price_trend: TrendDirection
    days_to_buy_signal: Optional[int] = None
    days_to_sell_signal: Optional[int] = None
    timestamp: datetime

class BuySellAlertListResponse(BaseSchema):

    alerts: list[BuySellAlertResponse]
    total: int
    active: int
    triggered: int

class BuySellAlertHistoryResponse(BaseSchema):

    alert_id: int
    commodity_name: str
    market_name: str
    signals: list[BuySellSignalResponse]
    total_buys: int
    total_sells: int
    success_rate: float = Field(..., ge=0, le=1)
    profit_loss: Optional[float] = None

class ModelMetricsResponse(BaseSchema):

    id: int
    model_name: str
    model_version: str
    accuracy: float
    rmse: float
    mae: float
    r2_score: float
    mape: float
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    feature_importance: Optional[dict[str, Any]] = None
    training_samples: Optional[int] = None
    test_samples: Optional[int] = None
    training_date: Optional[datetime] = None
    hyperparameters: Optional[dict[str, Any]] = None
    cross_validation_scores: Optional[list[float]] = None
    created_at: datetime

class DiscussionCreate(BaseSchema):

    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10, max_length=5000)
    commodity: str = Field(..., min_length=1, max_length=255)
    market: Optional[str] = Field(None, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    tags: list[str] = Field(default_factory=list, max_length=10)

class DiscussionUpdate(BaseSchema):

    title: Optional[str] = Field(None, min_length=5, max_length=255)
    content: Optional[str] = Field(None, min_length=10, max_length=5000)
    tags: Optional[list[str]] = None

class DiscussionResponse(BaseSchema):

    id: int
    title: str
    content: str
    commodity: str
    market: Optional[str] = None
    author: str
    avatar_url: Optional[str] = None
    likes_count: int
    replies_count: int
    views_count: int
    is_pinned: bool
    tags: list[str]
    status: str
    created_at: datetime
    updated_at: datetime

class DiscussionListResponse(BaseSchema):

    discussions: list[DiscussionResponse]
    total: int
    page: int
    page_size: int

class CommentCreate(BaseSchema):
    content: str
    author: Optional[str] = None
    author_id: Optional[str] = None
    avatar_url: Optional[str] = None

class CommentResponse(BaseSchema):
    id: int
    discussion_id: int
    content: str
    author: Optional[str] = None
    author_id: Optional[str] = None
    avatar_url: Optional[str] = None
    likes_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

class CommentListResponse(BaseSchema):
    comments: list[CommentResponse]
    total: int

class WatchlistCreate(BaseSchema):

    user_id: str
    commodity_id: int
    market_id: Optional[int] = None
    notes: Optional[str] = None
    alert_on_price_change: bool = False
    price_change_threshold: Optional[float] = Field(None, ge=0.1, le=100)

class WatchlistUpdate(BaseSchema):

    notes: Optional[str] = None
    alert_on_price_change: Optional[bool] = None
    price_change_threshold: Optional[float] = Field(None, ge=0.1, le=100)

class WatchlistResponse(BaseSchema):

    id: int
    user_id: str
    commodity_id: int
    commodity_name: Optional[str] = None
    market_id: Optional[int] = None
    market_name: Optional[str] = None
    current_price: Optional[float] = None
    notes: Optional[str] = None
    alert_on_price_change: bool
    price_change_threshold: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class WatchlistListResponse(BaseSchema):

    watchlist: list[WatchlistResponse]
    total: int

class MarketTrendAnalysisResponse(BaseSchema):

    id: int
    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    analysis_date: str
    period_days: int
    avg_price: float
    min_price: float
    max_price: float
    price_volatility: float
    trend_direction: str
    trend_strength: float
    momentum: float
    total_volume: Optional[float] = None
    avg_daily_volume: Optional[float] = None
    price_range: dict = Field(default_factory=dict)
    trend_label: str = ""

class MarketTrendComparisonResponse(BaseSchema):

    commodity_id: int
    commodity_name: str
    market_id: int
    market_name: str
    trends_7d: Optional[MarketTrendAnalysisResponse] = None
    trends_14d: Optional[MarketTrendAnalysisResponse] = None
    trends_30d: Optional[MarketTrendAnalysisResponse] = None
    trend_change: str
    recommendation: str
