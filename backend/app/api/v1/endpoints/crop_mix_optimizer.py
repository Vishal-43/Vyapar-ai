from fastapi import APIRouter, HTTPException
from ...engines.crop_mix_optimizer.crop_mix_optimizer import CropMixOptimizer
from ...engines.crop_mix_optimizer.optimizer_models import CropMixInput, CropMixResult

router = APIRouter()
optimizer = CropMixOptimizer()

@router.post("/optimize", response_model=CropMixResult)
def optimize_crop_mix(input_data: CropMixInput):
    try:
        result = optimizer.optimize(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
