from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    predictions,
    market_data,
    inventory,
    alerts,
    buysell_alerts,
    model_metrics,
    scheduler,
    data_import,
    user_settings,
    recommendations,
    discussions,
    watchlist,
    market_trends,
    cost_breakeven,
    selling_strategy,
    weather_risk,
    crop_mix_optimizer,
    direct_buyer_engine,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(predictions.router, tags=["Predictions"])
api_router.include_router(market_data.router, tags=["Market Data"])
api_router.include_router(inventory.router, tags=["Inventory"])
api_router.include_router(alerts.router, tags=["Alerts"])
api_router.include_router(buysell_alerts.router, tags=["Buy/Sell Alerts"])
api_router.include_router(model_metrics.router, tags=["Model Metrics"])
api_router.include_router(scheduler.router, prefix="/scheduler", tags=["Scheduler"])
api_router.include_router(data_import.router, tags=["Data Import"])
api_router.include_router(user_settings.router, tags=["User Settings"])
api_router.include_router(recommendations.router, tags=["Recommendations"])
api_router.include_router(discussions.router, tags=["Discussions"])
api_router.include_router(watchlist.router, tags=["Watchlist"])
api_router.include_router(market_trends.router, tags=["Market Trends"])
api_router.include_router(cost_breakeven.router, prefix="/cost-analysis", tags=["Cost Breakeven"])
api_router.include_router(selling_strategy.router, prefix="/selling-strategies", tags=["Selling Strategy"])
api_router.include_router(weather_risk.router, prefix="/weather-risk", tags=["Weather Risk"])
api_router.include_router(crop_mix_optimizer.router, prefix="/crop-mix", tags=["Crop Mix Optimizer"])
api_router.include_router(direct_buyer_engine.router, prefix="/direct-buyer", tags=["Direct Buyer Engine"])
