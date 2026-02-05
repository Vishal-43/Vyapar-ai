"""
Populate initial data for Selling Strategy Feature

This script:
1. Calculates seasonal price patterns from historical data
2. Populates storage costs for common commodities
3. Calculates price volatility metrics
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List
from loguru import logger
import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.database.connection import init_sync_db, get_sync_session
from app.database.models import (
    Commodity,
    MarketPrice,
    SeasonalPricePattern,
    StorageCost,
    PriceVolatility,
)


# Storage costs data (₹ per quintal per month)
STORAGE_COSTS_DATA = {
    # Grains - long shelf life
    'Wheat': {'cost': 30, 'max_days': 365, 'perishable': False},
    'Rice': {'cost': 35, 'max_days': 365, 'perishable': False},
    'Maize': {'cost': 25, 'max_days': 180, 'perishable': False},
    'Barley': {'cost': 30, 'max_days': 365, 'perishable': False},
    
    # Pulses - long shelf life
    'Gram': {'cost': 40, 'max_days': 365, 'perishable': False},
    'Tur(Arhar)': {'cost': 40, 'max_days': 365, 'perishable': False},
    'Moong(Green Gram)': {'cost': 40, 'max_days': 365, 'perishable': False},
    'Urad (Black Gram)': {'cost': 40, 'max_days': 365, 'perishable': False},
    'Masoor (Lentil)': {'cost': 40, 'max_days': 365, 'perishable': False},
    
    # Oilseeds - moderate shelf life
    'Groundnut': {'cost': 50, 'max_days': 180, 'perishable': False},
    'Soyabean': {'cost': 45, 'max_days': 180, 'perishable': False},
    'Sunflower': {'cost': 50, 'max_days': 180, 'perishable': False},
    'Mustard': {'cost': 40, 'max_days': 270, 'perishable': False},
    'Sesame': {'cost': 45, 'max_days': 365, 'perishable': False},
    
    # Cotton and Jute - long shelf life
    'Cotton': {'cost': 60, 'max_days': 365, 'perishable': False},
    'Jute': {'cost': 50, 'max_days': 365, 'perishable': False},
    
    # Spices - long shelf life
    'Turmeric': {'cost': 35, 'max_days': 365, 'perishable': False},
    'Jeera': {'cost': 40, 'max_days': 365, 'perishable': False},
    'Coriander': {'cost': 35, 'max_days': 365, 'perishable': False},
    'Red Chilli': {'cost': 40, 'max_days': 365, 'perishable': False},
    
    # Vegetables - perishable
    'Onion': {'cost': 100, 'max_days': 90, 'perishable': True},
    'Potato': {'cost': 80, 'max_days': 120, 'perishable': True},
    'Tomato': {'cost': 150, 'max_days': 30, 'perishable': True},
    'Brinjal': {'cost': 200, 'max_days': 15, 'perishable': True},
    'Cabbage': {'cost': 150, 'max_days': 30, 'perishable': True},
    'Cauliflower': {'cost': 150, 'max_days': 30, 'perishable': True},
    'Capsicum': {'cost': 180, 'max_days': 21, 'perishable': True},
    
    # Fruits - perishable
    'Mango': {'cost': 200, 'max_days': 21, 'perishable': True},
    'Banana': {'cost': 150, 'max_days': 14, 'perishable': True},
    'Apple': {'cost': 100, 'max_days': 60, 'perishable': True},
    'Grapes': {'cost': 180, 'max_days': 21, 'perishable': True},
    'Orange': {'cost': 120, 'max_days': 30, 'perishable': True},
}


def populate_storage_costs(session):
    """Populate storage costs for commodities"""
    logger.info("Populating storage costs...")
    
    commodities = session.query(Commodity).all()
    commodity_map = {c.name: c for c in commodities}
    
    added_count = 0
    updated_count = 0
    
    for commodity_name, cost_data in STORAGE_COSTS_DATA.items():
        commodity = commodity_map.get(commodity_name)
        if not commodity:
            logger.warning(f"Commodity not found: {commodity_name}")
            continue
        
        # Check if storage cost already exists
        existing = session.query(StorageCost).filter(
            StorageCost.commodity_id == commodity.id
        ).first()
        
        if existing:
            # Update existing
            existing.cost_per_quintal_per_month = cost_data['cost']
            existing.max_storage_days = cost_data['max_days']
            existing.perishable = cost_data['perishable']
            existing.updated_at = datetime.utcnow()
            updated_count += 1
        else:
            # Create new
            storage_cost = StorageCost(
                commodity_id=commodity.id,
                cost_per_quintal_per_month=cost_data['cost'],
                max_storage_days=cost_data['max_days'],
                perishable=cost_data['perishable'],
                notes=f"Standard storage cost for {commodity_name}"
            )
            session.add(storage_cost)
            added_count += 1
    
    session.commit()
    logger.info(f"Storage costs: {added_count} added, {updated_count} updated")


def calculate_seasonal_patterns(session):
    """Calculate seasonal price patterns from historical data"""
    logger.info("Calculating seasonal price patterns from historical data...")
    
    commodities = session.query(Commodity).all()
    
    added_count = 0
    updated_count = 0
    
    for commodity in commodities:
        # Get historical prices for this commodity
        prices = session.query(MarketPrice).filter(
            MarketPrice.commodity_id == commodity.id,
            MarketPrice.date >= datetime.now() - timedelta(days=730)  # Last 2 years
        ).all()
        
        if len(prices) < 30:
            logger.debug(f"Insufficient data for {commodity.name} ({len(prices)} records)")
            continue
        
        # Group by month and calculate statistics
        monthly_data: Dict[int, List[float]] = {i: [] for i in range(1, 13)}
        
        for price in prices:
            month = price.date.month
            monthly_data[month].append(price.price)
        
        # Calculate and store patterns for each month
        for month, prices_list in monthly_data.items():
            if len(prices_list) < 3:  # Need at least 3 data points
                continue
            
            avg_price = np.mean(prices_list)
            std_dev = np.std(prices_list)
            min_price = np.min(prices_list)
            max_price = np.max(prices_list)
            
            # Check if existing pattern exists
            existing = session.query(SeasonalPricePattern).filter(
                SeasonalPricePattern.commodity_id == commodity.id,
                SeasonalPricePattern.month == month
            ).first()
            
            if existing:
                existing.avg_price = float(avg_price)
                existing.std_dev = float(std_dev)
                existing.min_price = float(min_price)
                existing.max_price = float(max_price)
                existing.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                pattern = SeasonalPricePattern(
                    commodity_id=commodity.id,
                    month=month,
                    avg_price=float(avg_price),
                    std_dev=float(std_dev),
                    min_price=float(min_price),
                    max_price=float(max_price),
                    peak_month=False  # Will be updated later
                )
                session.add(pattern)
                added_count += 1
        
        # Mark peak month for this commodity
        patterns = session.query(SeasonalPricePattern).filter(
            SeasonalPricePattern.commodity_id == commodity.id
        ).all()
        
        if patterns:
            peak_pattern = max(patterns, key=lambda p: p.avg_price or 0)
            peak_pattern.peak_month = True
    
    session.commit()
    logger.info(f"Seasonal patterns: {added_count} added, {updated_count} updated")


def calculate_price_volatility(session):
    """Calculate price volatility metrics"""
    logger.info("Calculating price volatility metrics...")
    
    commodities = session.query(Commodity).all()
    periods = [('30_day', 30), ('90_day', 90), ('180_day', 180)]
    
    added_count = 0
    
    for commodity in commodities:
        for period_name, days in periods:
            # Get historical prices
            prices = session.query(MarketPrice).filter(
                MarketPrice.commodity_id == commodity.id,
                MarketPrice.date >= datetime.now() - timedelta(days=days)
            ).all()
            
            if len(prices) < 10:
                continue
            
            price_values = [p.price for p in prices]
            std_dev = np.std(price_values)
            mean_price = np.mean(price_values)
            
            # Calculate coefficient of variation as volatility score
            volatility_score = (std_dev / mean_price) if mean_price > 0 else 0
            volatility_score = min(volatility_score, 1.0)  # Cap at 1.0
            
            # Delete old volatility records for this period
            session.query(PriceVolatility).filter(
                PriceVolatility.commodity_id == commodity.id,
                PriceVolatility.period == period_name
            ).delete()
            
            # Create new volatility record
            volatility = PriceVolatility(
                commodity_id=commodity.id,
                period=period_name,
                volatility_score=float(volatility_score),
                calculated_at=datetime.utcnow()
            )
            session.add(volatility)
            added_count += 1
    
    session.commit()
    logger.info(f"Price volatility: {added_count} records added")


def main():
    """Main function to populate all data"""
    logger.info("Starting data population for Selling Strategy feature...")
    
    # Initialize database
    init_sync_db()
    session = next(get_sync_session())
    
    try:
        # Populate storage costs
        populate_storage_costs(session)
        
        # Calculate seasonal patterns from historical data
        calculate_seasonal_patterns(session)
        
        # Calculate price volatility
        calculate_price_volatility(session)
        
        logger.info("✅ Successfully populated all selling strategy data")
        
    except Exception as e:
        logger.exception(f"Error populating data: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
