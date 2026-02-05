"""
Direct Buyer Engine logic: match sellers to buyers based on commodity, location, and quantity
"""
from .buyer_engine_models import BuyerProfile, SellerProfile, MatchResult
from typing import List

def match_buyers_to_sellers(buyers: List[BuyerProfile], sellers: List[SellerProfile]) -> List[MatchResult]:
    results = []
    for buyer in buyers:
        for seller in sellers:
            for commodity in set(buyer.commodities) & set(seller.commodities):
                quantity = min(buyer.max_quantity, seller.available_quantity)
                if quantity >= buyer.min_quantity:
                    match_score = 1.0  # Dummy score, can be improved
                    results.append(MatchResult(
                        buyer_id=buyer.id,
                        seller_id=seller.id,
                        commodity=commodity,
                        quantity=quantity,
                        match_score=match_score
                    ))
    return results
