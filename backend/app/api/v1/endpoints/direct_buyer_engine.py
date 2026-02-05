from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from ...engines.direct_buyer_engine.buyer_engine_models import BuyerProfile, SellerProfile, MatchResult
from ...engines.direct_buyer_engine.direct_buyer_engine import match_buyers_to_sellers

router = APIRouter()

class MatchRequest(BaseModel):
    buyers: List[BuyerProfile]
    sellers: List[SellerProfile]

@router.post("/direct-buyer/match", response_model=List[MatchResult])
def match_buyers(match_request: MatchRequest):
    return match_buyers_to_sellers(match_request.buyers, match_request.sellers)
