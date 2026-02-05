from pydantic import BaseModel
from typing import List, Optional

class WeatherAlert(BaseModel):
    alert_type: str
    severity: str
    description: str

class ProtectiveMeasure(BaseModel):
    measure: str
    cost: Optional[float] = None
    effectiveness: Optional[str] = None

class WeatherRiskInput(BaseModel):
    commodity: str
    sowing_date: str  # ISO date
    location: str

class WeatherRiskReport(BaseModel):
    risk_level: str
    alerts: List[WeatherAlert]
    insurance: Optional[str]
    protective_measures: Optional[List[ProtectiveMeasure]]
