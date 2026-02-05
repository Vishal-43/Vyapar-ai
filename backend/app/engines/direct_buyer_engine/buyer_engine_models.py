"""
Pydantic and ORM models for Direct Buyer Engine
"""
from pydantic import BaseModel
from typing import List, Optional

class BuyerProfile(BaseModel):
    id: int
    name: str
    location: str
    commodities: List[str]
    min_quantity: float
    max_quantity: float
    contact: Optional[str]

class SellerProfile(BaseModel):
    id: int
    name: str
    location: str
    commodities: List[str]
    available_quantity: float
    contact: Optional[str]

class MatchResult(BaseModel):
    buyer_id: int
    seller_id: int
    commodity: str
    quantity: float
    match_score: float
