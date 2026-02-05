from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_sync_session
from app.engines.cost_breakeven.breakeven_engine import CostBreakevenEngine
from app.engines.cost_breakeven.cost_models import CostInput, ProfitabilityReport

router = APIRouter()

@router.post("/breakeven-analysis", response_model=ProfitabilityReport)
def breakeven_analysis(
    input_data: CostInput,
    db: Session = Depends(get_sync_session)
):
    try:
        engine = CostBreakevenEngine()
        result = engine.analyze_profitability(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
