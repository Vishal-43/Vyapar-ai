
from datetime import datetime, timedelta
from typing import Any, List, Optional

from loguru import logger
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.utils import get_current_timestamp
from app.database.models import (
    Commodity,
    Market,
    MarketPrice,
    Alert,
    Inventory,
    PredictionMetrics,
    Prediction,
    Discussion,
    Watchlist,
    MarketTrendAnalysis,
)

class BaseRepository:

    def __init__(self, db: AsyncSession, model):
        self.db = db
        self.model = model

    async def create(self, instance_or_kwargs=None, **kwargs) -> Any:

        if instance_or_kwargs is not None and not kwargs:
            instance = instance_or_kwargs
        else:
            if instance_or_kwargs is not None:
                kwargs.update(instance_or_kwargs)
            instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.flush()
        return instance

    async def get_by_id(self, id: int) -> Optional[Any]:

        query = select(self.model).where(self.model.id == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Any]:

        query = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def update(self, id: int, **kwargs) -> Optional[Any]:

        instance = await self.get_by_id(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            await self.db.flush()
        return instance

    async def delete(self, id: int) -> bool:

        instance = await self.get_by_id(id)
        if instance:
            await self.db.delete(instance)
            await self.db.flush()
            return True
        return False

    async def count(self) -> int:

        query = select(self.model)
        result = await self.db.execute(query)
        return len(result.scalars().all())

class CommodityRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Commodity)

    async def get_by_name(self, name: str) -> Optional[Commodity]:

        query = select(Commodity).where(Commodity.name.ilike(name))
        result = await self.db.execute(query)
        commodity = result.scalars().first()
        
        # If not found, try partial match
        if not commodity:
            query = select(Commodity).where(Commodity.name.ilike(f"%{name}%"))
            result = await self.db.execute(query)
            commodity = result.scalar_one_or_none()
        
        return commodity

    async def get_by_category(self, category: str) -> List[Commodity]:

        query = select(Commodity).where(Commodity.category.ilike(category))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def search(self, query_str: str) -> List[Commodity]:

        query = select(Commodity).where(
            or_(
                Commodity.name.ilike(f"%{query_str}%"),
                Commodity.category.ilike(f"%{query_str}%"),
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()

class MarketRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Market)

    async def get_by_name(self, name: str) -> Optional[Market]:

        query = select(Market).where(Market.name.ilike(name))
        result = await self.db.execute(query)
        market = result.scalars().first()
        
        # If not found, try partial match
        if not market:
            query = select(Market).where(Market.name.ilike(f"%{name}%"))
            result = await self.db.execute(query)
            market = result.scalar_one_or_none()
        
        return market

    async def get_by_state(self, state: str) -> List[Market]:

        query = select(Market).where(Market.state.ilike(state))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_location(self, state: str, district: Optional[str] = None) -> List[Market]:

        conditions = [Market.state.ilike(state)]
        if district:
            conditions.append(Market.district.ilike(district))
        
        query = select(Market).where(and_(*conditions))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def search(self, query_str: str) -> List[Market]:

        query = select(Market).where(
            or_(
                Market.name.ilike(f"%{query_str}%"),
                Market.state.ilike(f"%{query_str}%"),
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()

class MarketPriceRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, MarketPrice)

    async def get_by_commodity_market_date(
        self,
        commodity_id: int,
        market_id: int,
        date: str,
    ) -> Optional[MarketPrice]:

        query = select(MarketPrice).where(
            and_(
                MarketPrice.commodity_id == commodity_id,
                MarketPrice.market_id == market_id,
                MarketPrice.date == datetime.strptime(date, "%Y-%m-%d").date(),
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_latest_price(self, commodity_id: int, market_id: int) -> Optional[MarketPrice]:

        query = (
            select(MarketPrice)
            .where(
                and_(
                    MarketPrice.commodity_id == commodity_id,
                    MarketPrice.market_id == market_id,
                )
            )
            .order_by(desc(MarketPrice.date))
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_price_history(
        self,
        commodity_id: int,
        market_id: int,
        days: int = 30,
    ) -> List[MarketPrice]:

        start_date = (get_current_timestamp() - timedelta(days=days)).date()
        
        query = (
            select(MarketPrice)
            .where(
                and_(
                    MarketPrice.commodity_id == commodity_id,
                    MarketPrice.market_id == market_id,
                    MarketPrice.date >= start_date,
                )
            )
            .order_by(MarketPrice.date)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_market_prices(self, market_id: int, date: Optional[str] = None) -> List[MarketPrice]:

        query = select(MarketPrice).where(MarketPrice.market_id == market_id)
        
        if date:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.where(MarketPrice.date == target_date)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def bulk_create(self, prices: List[dict]) -> List[MarketPrice]:

        instances = [MarketPrice(**price) for price in prices]
        self.db.add_all(instances)
        await self.db.flush()
        return instances

    async def get_recent_prices(self, days: int = 90) -> List[MarketPrice]:

        cutoff_date = (get_current_timestamp() - timedelta(days=days)).date()
        query = (
            select(MarketPrice)
            .where(MarketPrice.date >= cutoff_date)
            .order_by(MarketPrice.date)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create_or_update_price(self, price_data: dict) -> Optional[MarketPrice]:

        commodity_id = price_data.get("commodity_id")
        market_id = price_data.get("market_id")
        date_value = price_data.get("date")

        if not commodity_id or not market_id or not date_value:
            logger.warning("Skipping price upsert due to missing ids/date", extra={"price_data": price_data})
            return None

        if isinstance(date_value, str):
            price_date = datetime.strptime(date_value, "%Y-%m-%d").date()
        else:
            price_date = date_value

        query = select(MarketPrice).where(
            and_(
                MarketPrice.commodity_id == commodity_id,
                MarketPrice.market_id == market_id,
                MarketPrice.date == price_date,
            )
        ).limit(1)
        result = await self.db.execute(query)
        existing = result.scalar()

        if existing:
            for field in ["price", "min_price", "max_price", "modal_price", "arrival"]:
                if field in price_data and price_data.get(field) is not None:
                    setattr(existing, field, price_data[field])
            await self.db.flush()
            return existing

        new_record = MarketPrice(
            commodity_id=commodity_id,
            market_id=market_id,
            date=price_date,
            price=price_data.get("price", 0.0),
            min_price=price_data.get("min_price"),
            max_price=price_data.get("max_price"),
            modal_price=price_data.get("modal_price"),
            arrival=price_data.get("arrival"),
        )

        self.db.add(new_record)
        await self.db.flush()
        return new_record

class AlertRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Alert)

    async def get_active_alerts(self) -> List[Alert]:

        query = select(Alert).where(Alert.status == "ACTIVE").order_by(desc(Alert.priority))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_alerts_by_commodity(self, commodity_id: int) -> List[Alert]:

        query = select(Alert).where(Alert.commodity_id == commodity_id)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_alerts_by_status(self, status: str) -> List[Alert]:

        query = select(Alert).where(Alert.status == status)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_recent_alerts(self, hours: int = 24) -> List[Alert]:

        cutoff_time = get_current_timestamp() - timedelta(hours=hours)
        
        query = select(Alert).where(Alert.triggered_at >= cutoff_time).order_by(desc(Alert.triggered_at))
        result = await self.db.execute(query)
        return result.scalars().all()

class InventoryRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Inventory)

    async def get_by_commodity_market(self, commodity_id: int, market_id: int) -> Optional[Inventory]:

        query = select(Inventory).where(
            and_(
                Inventory.commodity_id == commodity_id,
                Inventory.market_id == market_id,
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_low_stock_items(self, threshold_percent: float = 0.2) -> List[Inventory]:

        query = select(Inventory).where(
            Inventory.current_stock < (Inventory.optimal_stock * threshold_percent)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_by_commodity(self, commodity_id: int) -> List[Inventory]:

        query = select(Inventory).where(Inventory.commodity_id == commodity_id)
        result = await self.db.execute(query)
        return result.scalars().all()

class PredictionMetricsRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, PredictionMetrics)

    async def get_latest_metrics(self, model_name: str) -> Optional[PredictionMetrics]:

        query = (
            select(PredictionMetrics)
            .where(PredictionMetrics.model_name == model_name)
            .order_by(desc(PredictionMetrics.updated_at))
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_model(self, model_name: str) -> List[PredictionMetrics]:

        query = select(PredictionMetrics).where(PredictionMetrics.model_name == model_name)
        result = await self.db.execute(query)
        return result.scalars().all()

class PredictionRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Prediction)

    async def get_by_date_range(
        self,
        commodity_id: int,
        market_id: int,
        start_date: str,
        end_date: str,
    ) -> List[Prediction]:

        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        query = select(Prediction).where(
            and_(
                Prediction.commodity_id == commodity_id,
                Prediction.market_id == market_id,
                Prediction.prediction_date >= start,
                Prediction.prediction_date <= end,
            )
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_accuracy_for_period(self, days: int = 30) -> float:

        cutoff_date = (get_current_timestamp() - timedelta(days=days)).date()
        
        query = select(Prediction).where(
            and_(
                Prediction.prediction_date >= cutoff_date,
                Prediction.actual_price.isnot(None),
            )
        )
        result = await self.db.execute(query)
        predictions = result.scalars().all()
        
        if not predictions:
            return 0.0
        
        return sum(p.accuracy for p in predictions if p.accuracy) / len(predictions)

class DiscussionRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Discussion)

    async def get_by_commodity(
        self, commodity: str, skip: int = 0, limit: int = 50, status: str = "PUBLISHED"
    ) -> List[Discussion]:

        query = (
            select(Discussion)
            .where(and_(Discussion.commodity == commodity, Discussion.status == status))
            .order_by(desc(Discussion.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_recent(self, skip: int = 0, limit: int = 50, status: str = "PUBLISHED") -> List[Discussion]:

        query = (
            select(Discussion)
            .where(Discussion.status == status)
            .order_by(desc(Discussion.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pinned(self, limit: int = 10) -> List[Discussion]:

        query = (
            select(Discussion)
            .where(and_(Discussion.is_pinned == True, Discussion.status == "PUBLISHED"))
            .order_by(desc(Discussion.updated_at))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def search(self, query_str: str, skip: int = 0, limit: int = 50) -> List[Discussion]:

        query = (
            select(Discussion)
            .where(
                and_(
                    or_(
                        Discussion.title.ilike(f"%{query_str}%"),
                        Discussion.content.ilike(f"%{query_str}%"),
                    ),
                    Discussion.status == "PUBLISHED",
                )
            )
            .order_by(desc(Discussion.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def increment_likes(self, discussion_id: int) -> Optional[Discussion]:

        discussion = await self.get_by_id(discussion_id)
        if discussion:
            discussion.likes_count += 1
            await self.db.flush()
        return discussion

    async def increment_views(self, discussion_id: int) -> Optional[Discussion]:

        discussion = await self.get_by_id(discussion_id)
        if discussion:
            discussion.views_count += 1
            await self.db.flush()
        return discussion

class WatchlistRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, Watchlist)

    async def get_user_watchlist(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Watchlist]:

        query = (
            select(Watchlist)
            .where(Watchlist.user_id == user_id)
            .order_by(desc(Watchlist.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_watchlist_count(self, user_id: str) -> int:

        query = select(Watchlist).where(Watchlist.user_id == user_id)
        result = await self.db.execute(query)
        return len(result.scalars().all())

    async def exists(self, user_id: str, commodity_id: int, market_id: Optional[int] = None) -> bool:

        query = select(Watchlist).where(
            and_(
                Watchlist.user_id == user_id,
                Watchlist.commodity_id == commodity_id,
                Watchlist.market_id == market_id,
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def get_by_commodity(self, commodity_id: int, limit: int = 100) -> List[Watchlist]:

        query = (
            select(Watchlist)
            .where(Watchlist.commodity_id == commodity_id)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

class MarketTrendAnalysisRepository(BaseRepository):

    def __init__(self, db: AsyncSession):
        super().__init__(db, MarketTrendAnalysis)

    async def get_latest_analysis(
        self, commodity_id: int, market_id: int, period_days: int = 7
    ) -> Optional[MarketTrendAnalysis]:

        query = (
            select(MarketTrendAnalysis)
            .where(
                and_(
                    MarketTrendAnalysis.commodity_id == commodity_id,
                    MarketTrendAnalysis.market_id == market_id,
                    MarketTrendAnalysis.period_days == period_days,
                )
            )
            .order_by(desc(MarketTrendAnalysis.analysis_date))
            .limit(1)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_trend_comparison(
        self, commodity_id: int, market_id: int
    ) -> dict:

        trends = {}
        for period in [7, 14, 30]:
            query = (
                select(MarketTrendAnalysis)
                .where(
                    and_(
                        MarketTrendAnalysis.commodity_id == commodity_id,
                        MarketTrendAnalysis.market_id == market_id,
                        MarketTrendAnalysis.period_days == period,
                    )
                )
                .order_by(desc(MarketTrendAnalysis.analysis_date))
                .limit(1)
            )
            result = await self.db.execute(query)
            trends[f"{period}d"] = result.scalar_one_or_none()
        return trends

    async def get_by_date_range(
        self,
        commodity_id: int,
        market_id: int,
        start_date,
        end_date,
        period_days: int = 7,
    ) -> List[MarketTrendAnalysis]:

        query = (
            select(MarketTrendAnalysis)
            .where(
                and_(
                    MarketTrendAnalysis.commodity_id == commodity_id,
                    MarketTrendAnalysis.market_id == market_id,
                    MarketTrendAnalysis.period_days == period_days,
                    MarketTrendAnalysis.analysis_date >= start_date,
                    MarketTrendAnalysis.analysis_date <= end_date,
                )
            )
            .order_by(MarketTrendAnalysis.analysis_date)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
