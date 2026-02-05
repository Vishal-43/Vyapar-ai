from pydantic import BaseModel, Field
from typing import List, Optional

class CostInput(BaseModel):
    commodity: str
    hectares: float
    costs: List[dict]  # [{category, amount}]
    expected_yield: float
    current_price: float

class CostBreakdown(BaseModel):
    total_cost: float
    breakdown: List[dict]  # [{category, amount}]

class ProfitabilityReport(BaseModel):
    gross_revenue: float
    total_cost: float
    net_profit: float
    breakeven_price: float
    breakeven_yield: float
    safety_margins: dict
    risk_level: str
    alerts: List[str]
    recommendations: List[str]
    cost_breakdown: Optional[CostBreakdown] = None
