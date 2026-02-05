from fastapi import APIRouter, HTTPException
from ...engines.selling_strategy.selling_strategy_engine import SellingStrategyEngine
from ...engines.selling_strategy.strategy_models import SellingStrategyInput, SellingRecommendation

router = APIRouter()
engine = SellingStrategyEngine()

@router.post("/get-strategy", response_model=SellingRecommendation)
def get_strategy(input_data: SellingStrategyInput):
    try:
        result = engine.get_selling_strategy(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
