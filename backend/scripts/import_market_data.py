#!/usr/bin/env python3
"""
Quick script to import generated market data into database
"""
import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import init_async_db, get_async_session
from app.database.repositories import (
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
)


async def import_market_data(json_file: str):
    """Import market data from JSON file into database"""
    
    logger.info(f"🚀 Starting import from {json_file}")
    
    # Initialize database
    await init_async_db()
    
    # Read JSON file
    data_path = Path(json_file)
    if not data_path.exists():
        logger.error(f"File not found: {json_file}")
        return
    
    logger.info(f"📖 Reading {data_path.name}...")
    with open(data_path, 'r') as f:
        records = json.load(f)
    
    logger.info(f"✅ Loaded {len(records):,} records")
    
    # Get database session
    async for session in get_async_session():
        commodity_repo = CommodityRepository(session)
        market_repo = MarketRepository(session)
        price_repo = MarketPriceRepository(session)
        
        # Track unique commodities and markets
        commodities_map = {}
        markets_map = {}
        
        logger.info("🌾 Creating commodities...")
        commodity_names = list(set(r['commodity'] for r in records))
        for name in commodity_names:
            existing = await commodity_repo.get_by_name(name)
            if existing:
                commodities_map[name] = existing.id
            else:
                # Extract category from first record with this commodity
                category = next((r['category'] for r in records if r['commodity'] == name), 'General')
                commodity = await commodity_repo.create(
                    name=name,
                    category=category,
                    unit='Quintal'
                )
                commodities_map[name] = commodity.id
                logger.info(f"  ✓ Created: {name} ({category})")
        
        logger.info(f"✅ {len(commodities_map)} commodities ready")
        
        logger.info("🏪 Creating markets...")
        market_names = list(set(r['market'] for r in records))
        for name in market_names:
            existing = await market_repo.get_by_name(name)
            if existing:
                markets_map[name] = existing.id
            else:
                # Extract state from first record with this market
                state = next((r.get('state', 'Unknown') for r in records if r['market'] == name), 'Unknown')
                market = await market_repo.create(
                    name=name,
                    state=state,
                    district=state  # Using state as district for now
                )
                markets_map[name] = market.id
                logger.info(f"  ✓ Created: {name} ({state})")
        
        logger.info(f"✅ {len(markets_map)} markets ready")
        
        # Import prices in batches
        logger.info("💰 Importing price records...")
        batch_size = 1000
        imported = 0
        skipped = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            
            for record in batch:
                try:
                    commodity_id = commodities_map.get(record['commodity'])
                    market_id = markets_map.get(record['market'])
                    
                    if not commodity_id or not market_id:
                        skipped += 1
                        continue
                    
                    # Parse date
                    record_date = datetime.fromisoformat(record['date']).date()
                    
                    # Check if record already exists
                    existing = await price_repo.get_by_commodity_market_date(
                        commodity_id=commodity_id,
                        market_id=market_id,
                        date=record_date
                    )
                    
                    if existing:
                        skipped += 1
                        continue
                    
                    # Create price record
                    await price_repo.create(
                        commodity_id=commodity_id,
                        market_id=market_id,
                        date=record_date,
                        modal_price=float(record['modal_price']),
                        price=float(record.get('price', record['modal_price'])),
                        min_price=float(record.get('min_price', record['modal_price'] * 0.95)),
                        max_price=float(record.get('max_price', record['modal_price'] * 1.05)),
                        arrival=int(record.get('arrival', 100)),
                    )
                    imported += 1
                    
                except Exception as e:
                    logger.error(f"Error importing record: {e}")
                    skipped += 1
            
            # Commit batch
            await session.commit()
            
            if (i // batch_size + 1) % 10 == 0:
                logger.info(f"  Progress: {imported:,} imported, {skipped:,} skipped")
        
        logger.success(f"🎉 Import complete! {imported:,} records imported, {skipped:,} skipped")
        
        # Verify import
        total_prices = await session.execute("SELECT COUNT(*) FROM market_prices")
        count = total_prices.scalar()
        logger.info(f"📊 Total price records in database: {count:,}")
        
        break  # Exit after first session


if __name__ == "__main__":
    if len(sys.argv) > 1:
        json_file = sys.argv[1]
    else:
        # Use most recent file in data/raw/
        data_dir = backend_path / "data" / "raw"
        json_files = sorted(data_dir.glob("market_prices_*.json"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not json_files:
            logger.error("No market_prices_*.json files found in data/raw/")
            sys.exit(1)
        json_file = str(json_files[0])
    
    asyncio.run(import_market_data(json_file))
