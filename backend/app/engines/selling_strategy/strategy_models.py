"""
Pydantic models for Selling Strategy feature
"""

from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field
from enum import Enum


class StrategyType(str, Enum):
    """Types of selling strategies"""
    IMMEDIATE = "IMMEDIATE"  # Sell right away
    WAIT_SHORT = "WAIT_SHORT"  # Wait 2-4 weeks
    WAIT_MEDIUM = "WAIT_MEDIUM"  # Wait 1-3 months
    WAIT_LONG = "WAIT_LONG"  # Wait 3+ months


class SellingStrategyInput(BaseModel):
    """Input for selling strategy recommendation"""
    
    commodity_id: int = Field(..., description="ID of the commodity")
    commodity_name: str = Field(..., description="Name of the commodity")
    quantity_quintals: float = Field(..., description="Quantity to sell in quintals", gt=0)
    current_price: float = Field(..., description="Current market price per quintal", gt=0)
    market_id: Optional[int] = Field(None, description="Preferred market ID")
    farmer_location: Optional[str] = Field(None, description="Farmer's location")
    sowing_date: Optional[date] = Field(None, description="Date when crop was sown")
    expected_harvest_date: Optional[date] = Field(None, description="Expected/actual harvest date")
    
    class Config:
        json_schema_extra = {
            "example": {
                "commodity_id": 1,
                "commodity_name": "Wheat",
                "quantity_quintals": 100,
                "current_price": 2050,
                "market_id": 5,
                "farmer_location": "Punjab",
                "sowing_date": "2025-11-01",
                "expected_harvest_date": "2026-04-15"
            }
        }


class AlternativeSellWindow(BaseModel):
    """Alternative selling window option"""
    
    month: int = Field(..., description="Month number (1-12)")
    month_name: str = Field(..., description="Month name")
    days_from_now: int = Field(..., description="Days from current date")
    expected_price: float = Field(..., description="Expected price per quintal")
    price_increase_percent: float = Field(..., description="% increase from current price")
    total_storage_cost: float = Field(..., description="Total storage cost for this period")
    net_profit: float = Field(..., description="Net profit after storage costs")
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH")
    reason: str = Field(..., description="Why this window might be good")


class SellingRecommendation(BaseModel):
    """Selling strategy recommendation output"""
    
    strategy: StrategyType = Field(..., description="Recommended strategy type")
    recommended_action: str = Field(..., description="Clear action recommendation")
    reasoning: str = Field(..., description="Detailed explanation of the recommendation")
    confidence_score: float = Field(..., description="Confidence in recommendation (0-1)", ge=0, le=1)
    
    # Price information
    current_price: float = Field(..., description="Current market price per quintal")
    expected_price: Optional[float] = Field(None, description="Expected price at recommended sell time")
    price_increase_percent: Optional[float] = Field(None, description="Expected price increase %")
    
    # Financial analysis
    current_revenue: float = Field(..., description="Revenue if sold now")
    expected_revenue: Optional[float] = Field(None, description="Expected revenue if waiting")
    storage_cost: Optional[float] = Field(None, description="Total storage cost if waiting")
    net_profit_gain: Optional[float] = Field(None, description="Net profit gain after storage costs")
    
    # Timing information
    days_to_wait: Optional[int] = Field(None, description="Days to wait before selling")
    recommended_sell_date: Optional[date] = Field(None, description="Recommended sell date")
    peak_month: Optional[int] = Field(None, description="Peak price month (1-12)")
    peak_month_name: Optional[str] = Field(None, description="Peak price month name")
    
    # Risk factors
    price_volatility: float = Field(..., description="Price volatility score (0-1)")
    risk_level: str = Field(..., description="Overall risk level: LOW, MEDIUM, HIGH")
    price_trend: str = Field(..., description="Price trend: INCREASING, DECREASING, STABLE")
    
    # Alternative options
    alternative_windows: List[AlternativeSellWindow] = Field(
        default_factory=list,
        description="Alternative selling windows"
    )
    
    # Warnings and tips
    warnings: List[str] = Field(default_factory=list, description="Important warnings")
    tips: List[str] = Field(default_factory=list, description="Helpful tips")
    
    class Config:
        json_schema_extra = {
            "example": {
                "strategy": "WAIT_SHORT",
                "recommended_action": "Wait 2-3 weeks before selling",
                "reasoning": "Prices are showing an upward trend and will peak in March...",
                "confidence_score": 0.85,
                "current_price": 2050,
                "expected_price": 2280,
                "price_increase_percent": 11.2,
                "current_revenue": 205000,
                "expected_revenue": 228000,
                "storage_cost": 3000,
                "net_profit_gain": 20000,
                "days_to_wait": 21,
                "recommended_sell_date": "2026-03-15",
                "peak_month": 3,
                "peak_month_name": "March",
                "price_volatility": 0.15,
                "risk_level": "LOW",
                "price_trend": "INCREASING",
                "alternative_windows": [],
                "warnings": ["Storage facility must maintain proper temperature"],
                "tips": ["Consider advance payment contracts with buyers"]
            }
        }
