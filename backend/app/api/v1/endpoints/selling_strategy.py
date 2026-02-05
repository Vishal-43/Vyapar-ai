from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_sync_session
from app.engines.selling_strategy.selling_strategy_engine import SellingStrategyEngine
from app.engines.selling_strategy.strategy_models import SellingStrategyInput, SellingRecommendation

router = APIRouter()

@router.post("/get-strategy", response_model=SellingRecommendation)
def get_strategy(
    input_data: SellingStrategyInput,
    db: Session = Depends(get_sync_session)
):
    try:
        engine = SellingStrategyEngine(db)
        result = engine.get_selling_strategy(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
