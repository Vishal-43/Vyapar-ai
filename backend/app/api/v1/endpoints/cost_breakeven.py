from fastapi import APIRouter, HTTPException
from ...engines.cost_breakeven.breakeven_engine import CostBreakevenEngine
from ...engines.cost_breakeven.cost_models import CostInput, ProfitabilityReport

router = APIRouter()
engine = CostBreakevenEngine()

@router.post("/breakeven-analysis", response_model=ProfitabilityReport)
def breakeven_analysis(input_data: CostInput):
    try:
        result = engine.analyze_profitability(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
