from pydantic import BaseModel
from typing import List, Optional

class CropInput(BaseModel):
    name: str
    area: float

class CropMixInput(BaseModel):
    crops: List[CropInput]
    total_area: float
    location: str
    season: str

class OptimizedCrop(BaseModel):
    name: str
    area: float
    expected_profit: float

class CropMixResult(BaseModel):
    optimized_mix: List[OptimizedCrop]
    total_expected_profit: float
    notes: Optional[List[str]] = None
