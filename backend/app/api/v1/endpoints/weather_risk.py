from fastapi import APIRouter, HTTPException
from ...engines.weather_risk.weather_risk_engine import WeatherRiskEngine
from ...engines.weather_risk.risk_models import WeatherRiskInput, WeatherRiskReport

router = APIRouter()
engine = WeatherRiskEngine()

@router.post("/assess-risk", response_model=WeatherRiskReport)
def assess_risk(input_data: WeatherRiskInput):
    try:
        result = engine.assess_weather_risk(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
