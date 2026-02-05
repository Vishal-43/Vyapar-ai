from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_sync_session
from app.engines.crop_mix_optimizer.crop_mix_optimizer import CropMixOptimizer
from app.engines.crop_mix_optimizer.optimizer_models import CropMixInput, CropMixResult

router = APIRouter()

@router.post("/optimize", response_model=CropMixResult)
def optimize_crop_mix(
    input_data: CropMixInput,
    db: Session = Depends(get_sync_session)
):
    try:
        optimizer = CropMixOptimizer()
        result = optimizer.optimize(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
