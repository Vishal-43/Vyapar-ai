from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_sync_session
from app.engines.weather_risk.weather_risk_engine import WeatherRiskEngine
from app.engines.weather_risk.risk_models import WeatherRiskInput, WeatherRiskReport

router = APIRouter()

@router.post("/assess-risk", response_model=WeatherRiskReport)
def assess_risk(
    input_data: WeatherRiskInput,
    db: Session = Depends(get_sync_session)
):
    try:
        engine = WeatherRiskEngine()
        result = engine.assess_weather_risk(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
