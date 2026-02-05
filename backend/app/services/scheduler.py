from datetime import datetime, time
from pathlib import Path
import sys
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.config import settings
from app.scraper.agmarknet_scraper import AgmarknetScraper
from app.ml.trainer import ModelTrainer
from app.ml.preprocessor import DataPreprocessor
from app.core.utils import get_current_timestamp
from app.database.connection import get_async_session
from app.database.repositories import (
    CommodityRepository,
    MarketPriceRepository,
    MarketRepository,
)

class DataScheduler:
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scraper = AgmarknetScraper()
        self.is_running = False
        logger.info("Data automation scheduler initialized")

    async def daily_data_collection(self):
        
        try:
            logger.info("Starting daily market data collection")
            
            result = self.scraper.scrape_all(days_back=180, historical_days=180)
            
            if result.get("status") == "success":
                counts = result.get("counts", {})
                logger.info(f"Daily collection completed successfully: {counts.get('prices', 0)} price records gathered")
                
                await self._store_scraped_data(result)
            else:
                logger.error("Daily data collection encountered issues")
                
        except Exception as e:
            logger.error(f"Daily collection failed: {str(e)}")

    async def weekly_model_retraining(self):
        
        try:
            logger.info("Initiating weekly model retraining with accumulated data")
            
            async for session in get_async_session():
                repo = MarketPriceRepository(session)
                
                recent_data = await repo.get_recent_prices(days=180)
                
                if len(recent_data) < 1000:
                    logger.warning(f"Insufficient training data available: {len(recent_data)} records")
                    return
                
                logger.info(f"Training with {len(recent_data)} records from the past 180 days")
                
                preprocessor = DataPreprocessor()
                trainer = ModelTrainer(preprocessor)
                
                import pandas as pd
                df = pd.DataFrame([{
                    "commodity": getattr(p, "commodity").name if getattr(p, "commodity", None) else getattr(p, "commodity_id", None),
                    "market": getattr(p, "market").name if getattr(p, "market", None) else getattr(p, "market_id", None),
                    "state": getattr(getattr(p, "market", None), "state", None),
                    "date": p.date,
                    "price": p.modal_price or p.price,
                    "arrival": p.arrival,
                } for p in recent_data])
                
                X_train, X_test, y_train, y_test = preprocessor.prepare_training_data(
                    df, target_col="price", date_col="date"
                )
                
                trainer.train_all_models(X_train, y_train, X_test, y_test)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                trainer.save_all_models(f"ensemble_{timestamp}")
                
                logger.info("Weekly model retraining completed and saved successfully")
                
        except Exception as e:
            logger.error(f"Weekly retraining failed: {str(e)}")

    async def _store_scraped_data(self, result: dict):
        
        try:
            async for session in get_async_session():
                price_repo = MarketPriceRepository(session)
                commodity_repo = CommodityRepository(session)
                market_repo = MarketRepository(session)

                data_block = result.get("data", {})
                prices = data_block.get("prices", [])
                historical_prices = data_block.get("historical_prices", [])
                price_batches = prices + historical_prices

                commodity_cache: dict[str, object] = {}
                market_cache: dict[str, object] = {}

                for commodity in data_block.get("commodities", []):
                    name = commodity.get("name")
                    if not name:
                        continue
                    existing = await commodity_repo.get_by_name(name)
                    if not existing:
                        existing = await commodity_repo.create(
                            name=name,
                            category=commodity.get("category", "General"),
                            unit=commodity.get("unit", "Quintal"),
                            description=commodity.get("description")
                        )
                    commodity_cache[name.lower()] = existing

                for market in data_block.get("markets", []):
                    name = market.get("name")
                    if not name:
                        continue
                    existing = await market_repo.get_by_name(name)
                    if not existing:
                        existing = await market_repo.create(
                            name=name,
                            state=market.get("state", "Unknown"),
                            district=market.get("district", "Unknown"),
                            latitude=market.get("latitude"),
                            longitude=market.get("longitude"),
                            description=market.get("description")
                        )
                    market_cache[name.lower()] = existing

                stored_count = 0

                for price_data in price_batches:
                    commodity_name = price_data.get("commodity")
                    market_name = price_data.get("market")

                    if not commodity_name or not market_name:
                        continue

                    commodity_key = commodity_name.lower()
                    market_key = market_name.lower()

                    commodity = commodity_cache.get(commodity_key)
                    if not commodity:
                        commodity = await commodity_repo.get_by_name(commodity_name)
                        if not commodity:
                            commodity = await commodity_repo.create(
                                name=commodity_name,
                                category=price_data.get("category") or "General",
                                unit="Quintal",
                            )
                        commodity_cache[commodity_key] = commodity

                    market = market_cache.get(market_key)
                    if not market:
                        market = await market_repo.get_by_name(market_name)
                        if not market:
                            market = await market_repo.create(
                                name=market_name,
                                state=price_data.get("state") or "Unknown",
                                district=price_data.get("district") or price_data.get("state") or "",
                            )
                        market_cache[market_key] = market

                    payload = {
                        "commodity_id": getattr(commodity, "id", None),
                        "market_id": getattr(market, "id", None),
                        "date": price_data.get("date") or get_current_timestamp().date(),
                        "price": price_data.get("price") or price_data.get("modal_price") or 0.0,
                        "min_price": price_data.get("min_price"),
                        "max_price": price_data.get("max_price"),
                        "modal_price": price_data.get("modal_price"),
                        "arrival": price_data.get("arrival"),
                    }

                    if not payload["commodity_id"] or not payload["market_id"]:
                        continue

                    await price_repo.create_or_update_price(payload)
                    stored_count += 1

                await session.commit()
                logger.info(f"Stored {stored_count} price records in database")
                
        except Exception as e:
            logger.error(f"Failed to store scraped data: {str(e)}")

    def start(self, run_initial_scrape: bool = True):
        
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        self.scheduler.add_job(
            self.daily_data_collection,
            CronTrigger(hour=2, minute=30),
            id="daily_scrape",
            name="Daily market data collection",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self.daily_data_collection,
            CronTrigger(hour=8, minute=0),
            id="morning_scrape",
            name="Morning market data refresh",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self.daily_data_collection,
            CronTrigger(hour=14, minute=0),
            id="afternoon_scrape",
            name="Afternoon market data refresh",
            replace_existing=True
        )
        
        self.scheduler.add_job(
            self.weekly_model_retraining,
            CronTrigger(day_of_week="sun", hour=3, minute=0),
            id="weekly_retrain",
            name="Weekly model retraining",
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        logger.info("Scheduler started - Scraping at 2:30 AM, 8:00 AM, 2:00 PM daily. Weekly retraining on Sundays at 3:00 AM")
        
        # Disable initial scrape for faster development startup
        # if run_initial_scrape:
        #     import asyncio
        #     asyncio.create_task(self._run_initial_scrape())

    def stop(self):
        
        if not self.is_running:
            return
        
        self.scheduler.shutdown()
        self.is_running = False
        logger.info("Scheduler stopped successfully")

    async def _run_initial_scrape(self):
        try:
            logger.info("Running initial data collection on startup")
            await self.daily_data_collection()
            logger.info("Initial data collection completed")
        except Exception as e:
            logger.error(f"Initial data collection failed: {str(e)}")

    def get_job_status(self):
        
        jobs = self.scheduler.get_jobs()
        status = []
        
        for job in jobs:
            next_run = job.next_run_time
            status.append({
                "id": job.id,
                "name": job.name,
                "next_run": next_run.isoformat() if next_run else None,
                "active": True
            })
        
        return status

_scheduler_instance: Optional[DataScheduler] = None

def get_scheduler() -> DataScheduler:
    
    global _scheduler_instance
    
    if _scheduler_instance is None:
        _scheduler_instance = DataScheduler()
    
    return _scheduler_instance
