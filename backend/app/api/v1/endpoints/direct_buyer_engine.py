from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.database.connection import get_sync_session
from app.engines.direct_buyer_engine.buyer_engine_models import BuyerProfile, SellerProfile, MatchResult
from app.engines.direct_buyer_engine.direct_buyer_engine import match_buyers_to_sellers

router = APIRouter()

class MatchRequest(BaseModel):
    buyers: List[BuyerProfile]
    sellers: List[SellerProfile]

@router.post("/match", response_model=List[MatchResult])
def match_buyers(
    match_request: MatchRequest,
    db: Session = Depends(get_sync_session)
):
    return match_buyers_to_sellers(match_request.buyers, match_request.sellers)
