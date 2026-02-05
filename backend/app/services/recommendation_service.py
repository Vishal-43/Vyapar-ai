
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from loguru import logger
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Recommendation
from app.models.recommendation_schemas import (
    AccuracyRating,
    RecommendationHistoryItem,
    RecommendationMetricsResponse,
    RecommendationResponse,
    RecommendationType,
)

class RecommendationService:

    @staticmethod
    async def _generate_recommendations_from_predictions(
        session: AsyncSession,
        user_id: str
    ) -> List[RecommendationResponse]:
        """Generate recommendations from market predictions and trends."""
        from app.database.repositories import (
            PredictionRepository,
            CommodityRepository,
            MarketRepository,
            MarketPriceRepository
        )
        
        pred_repo = PredictionRepository(session)
        commodity_repo = CommodityRepository(session)
        market_repo = MarketRepository(session)
        price_repo = MarketPriceRepository(session)
        
        recommendations = []
        now = datetime.now(tz=timezone.utc)
        
        # Get recent predictions with good confidence
        recent_predictions = await pred_repo.get_recent(days=7, limit=50)
        
        for pred in recent_predictions:
            if not pred.confidence or pred.confidence < 0.70:
                continue
                
            commodity = await commodity_repo.get_by_id(pred.commodity_id)
            market = await market_repo.get_by_id(pred.market_id)
            
            if not commodity or not market:
                continue
            
            # Get current price
            price_history = await price_repo.get_price_history(
                commodity_id=pred.commodity_id,
                market_id=pred.market_id,
                days=7
            )
            
            if not price_history:
                continue
                
            current_price = float(price_history[-1].price or price_history[-1].modal_price or 0)
            predicted_price = float(pred.predicted_price)
            
            if current_price == 0:
                continue
            
            # Calculate expected change
            expected_change_pct = ((predicted_price - current_price) / current_price) * 100
            
            # Determine recommendation type based on price change
            if expected_change_pct > 5:
                rec_type = RecommendationType.BUY
                reasoning = f"Price expected to rise {expected_change_pct:.1f}% based on market trends"
            elif expected_change_pct < -5:
                rec_type = RecommendationType.SELL
                reasoning = f"Price expected to fall {abs(expected_change_pct):.1f}% based on market analysis"
            elif abs(expected_change_pct) > 3:
                rec_type = RecommendationType.STOCK_UP
                reasoning = f"Moderate price movement expected ({expected_change_pct:+.1f}%)"
            else:
                rec_type = RecommendationType.HOLD
                reasoning = f"Stable price expected ({expected_change_pct:+.1f}%)"
            
            # Map confidence to level
            if pred.confidence >= 0.85:
                confidence_level = ConfidenceLevel.HIGH
            elif pred.confidence >= 0.70:
                confidence_level = ConfidenceLevel.MEDIUM
            else:
                confidence_level = ConfidenceLevel.LOW
            
            # Time horizon based on prediction date
            days_ahead = (pred.prediction_date - now.date()).days
            if days_ahead <= 7:
                time_horizon = TimeHorizon.SHORT_TERM
            elif days_ahead <= 30:
                time_horizon = TimeHorizon.MID_TERM
            else:
                time_horizon = TimeHorizon.LONG_TERM
            
            recommendations.append(
                RecommendationResponse(
                    id=pred.id,
                    commodity_id=commodity.id,
                    commodity_name=commodity.name,
                    market_id=market.id,
                    market_name=market.name,
                    recommendation_type=rec_type,
                    confidence=confidence_level,
                    reasoning=reasoning,
                    current_price=current_price,
                    target_price=predicted_price,
                    expected_change_pct=expected_change_pct,
                    time_horizon=time_horizon,
                    created_at=pred.created_at or now,
                    expires_at=now + timedelta(days=14),
                    model_version="v1.0",
                    acknowledged=False,
                    last_evaluated_at=now,
                )
            )
        
        return recommendations[:10]  # Return top 10 recommendations

    @staticmethod
    async def _generate_recommendations_from_predictions(
        session: AsyncSession,
        user_id: str
    ) -> List[RecommendationResponse]:
        """Generate recommendations from market predictions and trends."""
        from app.database.repositories import (
            PredictionRepository,
            CommodityRepository,
            MarketRepository,
            MarketPriceRepository
        )
        
        pred_repo = PredictionRepository(session)
        commodity_repo = CommodityRepository(session)
        market_repo = MarketRepository(session)
        price_repo = MarketPriceRepository(session)
        
        recommendations = []
        now = datetime.now(tz=timezone.utc)
        
        # Get recent predictions with good confidence
        recent_predictions = await pred_repo.get_recent(days=7, limit=50)
        
        for pred in recent_predictions:
            if not pred.confidence or pred.confidence < 0.70:
                continue
                
            commodity = await commodity_repo.get_by_id(pred.commodity_id)
            market = await market_repo.get_by_id(pred.market_id)
            
            if not commodity or not market:
                continue
            
            # Get current price
            price_history = await price_repo.get_price_history(
                commodity_id=pred.commodity_id,
                market_id=pred.market_id,
                days=7
            )
            
            if not price_history:
                continue
                
            current_price = float(price_history[-1].price or price_history[-1].modal_price or 0)
            predicted_price = float(pred.predicted_price)
            
            if current_price == 0:
                continue
            
            # Calculate expected change
            expected_change_pct = ((predicted_price - current_price) / current_price) * 100
            
            # Determine recommendation type based on price change
            if expected_change_pct > 5:
                rec_type = RecommendationType.BUY
                reasoning = f"Price expected to rise {expected_change_pct:.1f}% based on market trends"
            elif expected_change_pct < -5:
                rec_type = RecommendationType.SELL
                reasoning = f"Price expected to fall {abs(expected_change_pct):.1f}% based on market analysis"
            elif abs(expected_change_pct) > 3:
                rec_type = RecommendationType.STOCK_UP
                reasoning = f"Moderate price movement expected ({expected_change_pct:+.1f}%)"
            else:
                rec_type = RecommendationType.HOLD
                reasoning = f"Stable price expected ({expected_change_pct:+.1f}%)"
            
            # Map confidence to level
            if pred.confidence >= 0.85:
                confidence_level = ConfidenceLevel.HIGH
            elif pred.confidence >= 0.70:
                confidence_level = ConfidenceLevel.MEDIUM
            else:
                confidence_level = ConfidenceLevel.LOW
            
            # Time horizon based on prediction date
            days_ahead = (pred.prediction_date - now.date()).days
            if days_ahead <= 7:
                time_horizon = TimeHorizon.SHORT_TERM
            elif days_ahead <= 30:
                time_horizon = TimeHorizon.MID_TERM
            else:
                time_horizon = TimeHorizon.LONG_TERM
            
            recommendations.append(
                RecommendationResponse(
                    id=pred.id,
                    commodity_id=commodity.id,
                    commodity_name=commodity.name,
                    market_id=market.id,
                    market_name=market.name,
                    recommendation_type=rec_type,
                    confidence=confidence_level,
                    reasoning=reasoning,
                    current_price=current_price,
                    target_price=predicted_price,
                    expected_change_pct=expected_change_pct,
                    time_horizon=time_horizon,
                    created_at=pred.created_at or now,
                    expires_at=now + timedelta(days=14),
                    model_version="v1.0",
                    acknowledged=False,
                    last_evaluated_at=now,
                )
            )
        
        return recommendations[:10]  # Return top 10 recommendations

    @staticmethod
    def _to_response(rec: Recommendation) -> RecommendationResponse:
        return RecommendationResponse(
            id=rec.id,
            commodity_id=rec.commodity_id,
            commodity_name=rec.commodity_name,
            market_id=rec.market_id,
            market_name=rec.market_name,
            recommendation_type=rec.recommendation_type,
            confidence=rec.confidence,
            reasoning=rec.reasoning,
            current_price=rec.current_price,
            target_price=rec.target_price,
            expected_change_pct=rec.expected_change_pct,
            time_horizon=rec.time_horizon,
            created_at=rec.created_at,
            expires_at=rec.expires_at,
            model_version=rec.model_version,
            acknowledged=rec.acknowledged,
            acknowledgement_note=rec.acknowledgement_note,
            last_evaluated_at=rec.last_evaluated_at,
        )

    @classmethod
    async def get_active_recommendations(
        cls,
        session: AsyncSession,
        user_id: str,
    ) -> List[RecommendationResponse]:

        logger.info(f"Fetching active recommendations for user {user_id}")
        try:
            return await cls._generate_recommendations_from_predictions(session, user_id)
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []

    @classmethod
    async def get_recommendation_by_id(
        cls,
        session: AsyncSession,
        user_id: str,
        recommendation_id: int,
    ) -> Optional[RecommendationResponse]:

        logger.info(f"Fetching recommendation {recommendation_id} for user {user_id}")
        recommendations = await cls.get_active_recommendations(session, user_id)
        for rec in recommendations:
            if rec.id == recommendation_id:
                return rec
        return None

    @classmethod
    async def get_recommendation_history(
        cls,
        session: AsyncSession,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> List[RecommendationHistoryItem]:

        logger.info(f"Fetching recommendation history for user {user_id}")
        from app.database.repositories import PredictionRepository, CommodityRepository
        
        pred_repo = PredictionRepository(session)
        commodity_repo = CommodityRepository(session)
        
        history = []
        # Get predictions with actual prices (completed predictions)
        predictions = await pred_repo.get_with_actuals(limit=limit + offset)
        
        for pred in predictions[offset:offset + limit]:
            if pred.actual_price is None or pred.predicted_price is None:
                continue
                
            commodity = await commodity_repo.get_by_id(pred.commodity_id)
            if not commodity:
                continue
            
            # Calculate outcome based on prediction accuracy
            if pred.accuracy and pred.accuracy >= 0.90:
                outcome = AccuracyRating.CORRECT
            elif pred.accuracy and pred.accuracy >= 0.70:
                outcome = AccuracyRating.PARTIAL
            else:
                outcome = AccuracyRating.INCORRECT
            
            # Calculate actual change percentage
            actual_change = ((pred.actual_price - pred.predicted_price) / pred.predicted_price) * 100 if pred.predicted_price else 0
            
            # Determine recommendation type from historical prediction
            if actual_change > 5:
                rec_type = RecommendationType.BUY
            elif actual_change < -5:
                rec_type = RecommendationType.SELL
            else:
                rec_type = RecommendationType.HOLD
            
            confidence = ConfidenceLevel.HIGH if pred.confidence and pred.confidence >= 0.85 else ConfidenceLevel.MEDIUM
            
            history.append(
                RecommendationHistoryItem(
                    id=pred.id,
                    commodity_name=commodity.name,
                    recommendation_type=rec_type,
                    confidence=confidence,
                    created_at=pred.created_at or datetime.now(tz=timezone.utc),
                    outcome=outcome,
                    actual_change_pct=actual_change,
                    roi_pct=actual_change * 0.8,  # Estimated ROI
                    note=f"Prediction accuracy: {pred.accuracy:.1%}" if pred.accuracy else None,
                )
            )
        
        return history

    @classmethod
    async def acknowledge_recommendation(
        cls,
        session: AsyncSession,
        user_id: str,
        recommendation_id: int,
        note: Optional[str] = None,
    ) -> bool:

        logger.info(
            "Acknowledging recommendation %s for user %s", recommendation_id, user_id
        )
        query = select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == user_id,
        )
        result = await session.execute(query)
        rec = result.scalar_one_or_none()
        if not rec:
            return False
        rec.acknowledged = True
        rec.acknowledgement_note = note
        rec.last_evaluated_at = datetime.utcnow()
        await session.commit()
        return True

    @classmethod
    async def record_recommendation_accuracy(
        cls,
        session: AsyncSession,
        user_id: str,
        recommendation_id: int,
        outcome: AccuracyRating,
        actual_change_pct: Optional[float] = None,
        roi_pct: Optional[float] = None,
        note: Optional[str] = None,
    ) -> bool:

        logger.info(
            "Recording accuracy for recommendation %s user %s outcome %s",
            recommendation_id,
            user_id,
            outcome,
        )
        query = select(Recommendation).where(
            Recommendation.id == recommendation_id,
            Recommendation.user_id == user_id,
        )
        result = await session.execute(query)
        rec = result.scalar_one_or_none()
        if not rec:
            return False
        rec.outcome = outcome.value
        rec.actual_change_pct = actual_change_pct
        rec.roi_pct = roi_pct
        rec.note = note
        rec.last_evaluated_at = datetime.utcnow()
        rec.status = "ARCHIVED"
        await session.commit()
        return True

    @classmethod
    async def get_accuracy_metrics(
        cls,
        session: AsyncSession,
        user_id: str,
    ) -> RecommendationMetricsResponse:

        logger.info(f"Fetching recommendation metrics for user {user_id}")
        history = await cls.get_recommendation_history(session, user_id, limit=100)
        
        if not history:
            return RecommendationMetricsResponse(
                total_recommendations=0,
                correct_count=0,
                incorrect_count=0,
                partial_count=0,
                accuracy_rate=0.0,
                avg_roi_pct=0.0,
                high_confidence_accuracy=0.0,
                medium_confidence_accuracy=0.0,
                low_confidence_accuracy=0.0,
            )
        
        correct = sum(1 for item in history if item.outcome == AccuracyRating.CORRECT)
        incorrect = sum(1 for item in history if item.outcome == AccuracyRating.INCORRECT)
        partial = sum(1 for item in history if item.outcome == AccuracyRating.PARTIAL)
        total = len(history)
        accuracy_rate = correct / total if total else 0.0
        avg_roi = (sum(item.roi_pct or 0 for item in history) / total) if total else 0.0

        # Calculate confidence-based accuracy
        high_conf = [h for h in history if h.confidence == ConfidenceLevel.HIGH]
        med_conf = [h for h in history if h.confidence == ConfidenceLevel.MEDIUM]
        low_conf = [h for h in history if h.confidence == ConfidenceLevel.LOW]
        
        high_accuracy = (
            sum(1 for h in high_conf if h.outcome == AccuracyRating.CORRECT) / len(high_conf)
            if high_conf else 0.0
        )
        med_accuracy = (
            sum(1 for h in med_conf if h.outcome == AccuracyRating.CORRECT) / len(med_conf)
            if med_conf else 0.0
        )
        low_accuracy = (
            sum(1 for h in low_conf if h.outcome == AccuracyRating.CORRECT) / len(low_conf)
            if low_conf else 0.0
        )

        return RecommendationMetricsResponse(
            total_recommendations=total,
            correct_count=correct,
            incorrect_count=incorrect,
            partial_count=partial,
            accuracy_rate=accuracy_rate,
            avg_roi_pct=avg_roi,
            high_confidence_accuracy=high_accuracy,
            medium_confidence_accuracy=med_accuracy,
            low_confidence_accuracy=low_accuracy,
        )
