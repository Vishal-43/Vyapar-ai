"""
Generate Comprehensive Realistic Market Data
Based on actual market patterns, seasonal variations, and supply-demand dynamics
"""

import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from collections import Counter

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger

# Configure logging
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")


def generate_realistic_market_data(days_back: int = 180) -> list[dict]:
    """Generate comprehensive realistic market data"""
    
    logger.info(f"🏭 Generating realistic market data for {days_back} days...")
    
    # Comprehensive commodity list with actual market prices (approx. 2026 prices in INR per quintal)
    commodities = {
        # Cereals
        "Wheat": 2500, "Rice": 3500, "Basmati Rice": 5500, "Maize": 2000,
        "Bajra": 2200, "Jowar": 2800, "Barley": 2400, "Ragi": 3000,
        
        # Pulses
        "Moong Dal": 8500, "Chana": 6500, "Toor Dal": 7500, "Urad Dal": 8000,
        "Masoor Dal": 7000, "Rajma": 9000, "Lobia": 6000,
        
        # Oilseeds
        "Groundnut": 6000, "Soybean": 4500, "Mustard": 5500, "Sunflower": 6500,
        "Sesame": 12000, "Safflower": 6000, "Linseed": 5500, "Castor Seed": 5000,
        
        # Spices
        "Turmeric": 8500, "Coriander Seeds": 7500, "Cumin": 25000, "Black Pepper": 45000,
        "Cardamom": 150000, "Clove": 100000,
        
        # Cash Crops
        "Cotton": 6500, "Jute": 4500, "Sugarcane": 350,
        
        # Vegetables (short shelf life - higher volatility)
        "Potato": 1500, "Onion": 2500, "Tomato": 1800, "Cabbage": 1200,
        "Cauliflower": 1500, "Carrot": 1600, "Brinjal": 2000, "Lady Finger": 2500,
        
        # Fruits
        "Apple": 8000, "Banana": 2500, "Mango": 6000, "Orange": 5000,
        "Grapes": 6500, "Pomegranate": 7500, "Papaya": 2000, "Watermelon": 1200
    }
    
    # Major markets across India
    markets = [
        ("Azadpur", "Delhi"), ("Anaj Mandi", "Delhi"), ("Ghazipur", "Delhi"),
        ("Mumbai (Dadar)", "Maharashtra"), ("Pune", "Maharashtra"), ("Nashik", "Maharashtra"),
        ("Nagpur", "Maharashtra"), ("Aurangabad", "Maharashtra"),
        ("Bangalore", "Karnataka"), ("Mysore", "Karnataka"), ("Hubli", "Karnataka"),
        ("Chennai", "Tamil Nadu"), ("Coimbatore", "Tamil Nadu"), ("Madurai", "Tamil Nadu"),
        ("Hyderabad", "Telangana"), ("Warangal", "Telangana"),
        ("Kolkata", "West Bengal"), ("Siliguri", "West Bengal"),
        ("Jaipur", "Rajasthan"), ("Jodhpur", "Rajasthan"), ("Kota", "Rajasthan"),
        ("Lucknow", "Uttar Pradesh"), ("Kanpur", "Uttar Pradesh"), ("Varanasi", "Uttar Pradesh"),
        ("Ahmedabad", "Gujarat"), ("Surat", "Gujarat"), ("Rajkot", "Gujarat"),
        ("Chandigarh", "Chandigarh"), ("Ludhiana", "Punjab"), ("Amritsar", "Punjab"),
        ("Bhopal", "Madhya Pradesh"), ("Indore", "Madhya Pradesh"), ("Gwalior", "Madhya Pradesh")
    ]
    
    all_data = []
    start_date = datetime.now() - timedelta(days=days_back)
    
    logger.info(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {datetime.now().strftime('%Y-%m-%d')}")
    logger.info(f"🌾 Commodities: {len(commodities)}")
    logger.info(f"🏪 Markets: {len(markets)}")
    
    for day_offset in range(days_back):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime("%Y-%m-%d")
        month = current_date.month
        weekday = current_date.weekday()
        
        if day_offset % 30 == 0:
            logger.info(f"⏳ Processing {date_str}...")
        
        for commodity, base_price in commodities.items():
            for market, state in markets:
                # Seasonal factors based on harvest cycles
                seasonal_factor = 1.0
                
                # Cereals
                if commodity in ["Wheat", "Barley"] and month in [3, 4, 5]:
                    seasonal_factor = 0.70  # Harvest season
                elif commodity in ["Rice", "Basmati Rice"] and month in [10, 11, 12]:
                    seasonal_factor = 0.75  # Kharif harvest
                elif commodity in ["Maize"] and month in [9, 10]:
                    seasonal_factor = 0.80
                    
                # Pulses
                elif commodity in ["Chana", "Moong Dal"] and month in [4, 5]:
                    seasonal_factor = 0.85  # Rabi harvest
                elif commodity in ["Toor Dal"] and month in [12, 1]:
                    seasonal_factor = 0.90
                    
                # Vegetables (high volatility)
                elif commodity in ["Potato", "Onion"] and month in [12, 1, 2]:
                    seasonal_factor = 1.40  # Winter demand
                elif commodity in ["Tomato"] and month in [7, 8, 9]:
                    seasonal_factor = 1.50  # Monsoon scarcity
                elif commodity in ["Cabbage", "Cauliflower"] and month in [6, 7, 8]:
                    seasonal_factor = 1.35  # Low supply
                    
                # Fruits
                elif commodity in ["Mango"] and month in [5, 6]:
                    seasonal_factor = 1.60  # Peak season
                elif commodity in ["Grapes"] and month in [1, 2, 3]:
                    seasonal_factor = 1.50
                elif commodity in ["Watermelon"] and month in [5, 6, 7]:
                    seasonal_factor = 1.40
                    
                # Cash crops
                elif commodity in ["Cotton"] and month in [11, 12, 1]:
                    seasonal_factor = 0.80  # Harvest
                elif commodity in ["Sugarcane"] and month in [1, 2, 3]:
                    seasonal_factor = 0.85
                
                # Market-specific factors (metro vs tier-2/3)
                market_factor = 1.0
                if any(metro in market for metro in ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"]):
                    market_factor = 1.15  # Metro premium (transport, demand)
                elif any(tier1 in market for tier1 in ["Pune", "Ahmedabad", "Chandigarh", "Jaipur"]):
                    market_factor = 1.08
                elif any(tier2 in market for tier2 in ["Lucknow", "Bhopal", "Indore", "Nashik"]):
                    market_factor = 1.02
                else:
                    market_factor = 0.95  # Tier-3 discount
                
                # Weekly pattern (lower trading on weekends)
                weekday_factor = 0.93 if weekday >= 5 else 1.0
                
                # Daily random variation (market volatility)
                if commodity in ["Onion", "Tomato", "Potato"]:  # High volatility vegetables
                    daily_variation = random.uniform(0.92, 1.08)
                elif commodity in ["Black Pepper", "Cardamom", "Cumin"]:  # Spices
                    daily_variation = random.uniform(0.95, 1.05)
                else:  # Stable commodities
                    daily_variation = random.uniform(0.97, 1.03)
                
                # Long-term trend (annual inflation ~3%)
                trend_factor = 1.0 + (day_offset / 365) * 0.03
                
                # Supply shock simulation (random events like floods, droughts)
                shock_factor = 1.0
                if random.random() < 0.015:  # 1.5% chance
                    shock_factor = random.choice([0.80, 1.25])  # Surplus or shortage
                
                # Calculate final price
                final_price = (base_price * seasonal_factor * market_factor * 
                              weekday_factor * daily_variation * trend_factor * shock_factor)
                
                # Arrival quantities (in quintals)
                base_arrival = 2000
                if commodity in ["Wheat", "Rice", "Potato", "Onion", "Sugarcane"]:
                    base_arrival = 5000  # High volume commodities
                elif commodity in ["Cumin", "Black Pepper", "Cardamom", "Clove"]:
                    base_arrival = 500  # Low volume spices
                elif commodity in ["Cotton", "Jute"]:
                    base_arrival = 3000
                else:
                    base_arrival = 2000
                
                # Seasonal impact on arrivals
                arrival = int(base_arrival * seasonal_factor * random.uniform(0.75, 1.25))
                
                all_data.append({
                    "commodity": commodity,
                    "market": market,
                    "state": state,
                    "date": date_str,
                    "min_price": round(final_price * 0.92, 2),
                    "max_price": round(final_price * 1.08, 2),
                    "modal_price": round(final_price, 2),
                    "price": round(final_price, 2),
                    "arrival": arrival
                })
    
    logger.success(f"✅ Generated {len(all_data):,} realistic market records")
    
    return all_data


def save_data(data: list[dict]) -> Path:
    """Save data to JSON file"""
    
    data_dir = Path(__file__).parent.parent / "data" / "raw"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = data_dir / f"market_prices_{timestamp}.json"
    
    logger.info(f"💾 Saving to {output_file.name}...")
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    
    file_size_mb = output_file.stat().st_size / 1024 / 1024
    logger.success(f"✅ Saved successfully ({file_size_mb:.2f} MB)")
    
    return output_file


def print_summary(data: list[dict]):
    """Print data summary statistics"""
    
    print("\n" + "=" * 80)
    print("📊 DATA SUMMARY")
    print("=" * 80)
    
    print(f"\n📦 Total records: {len(data):,}")
    
    # Commodity distribution
    commodity_counts = Counter(d['commodity'] for d in data)
    print(f"\n🌾 Commodities ({len(commodity_counts)} unique):")
    for commodity, count in commodity_counts.most_common(10):
        print(f"   {commodity}: {count:,} records")
    
    # Market distribution
    market_counts = Counter(d['market'] for d in data)
    print(f"\n🏪 Markets ({len(market_counts)} unique):")
    for market, count in market_counts.most_common(10):
        print(f"   {market}: {count:,} records")
    
    # State distribution
    state_counts = Counter(d['state'] for d in data)
    print(f"\n🗺️  States ({len(state_counts)} unique):")
    for state, count in state_counts.most_common(10):
        print(f"   {state}: {count:,} records")
    
    # Date range
    dates = sorted(set(d['date'] for d in data))
    print(f"\n📅 Date range: {dates[0]} to {dates[-1]}")
    print(f"📅 Total days: {len(dates)}")
    
    # Price statistics
    prices = [d['price'] for d in data]
    print(f"\n💰 Price range: ₹{min(prices):.2f} to ₹{max(prices):,.2f}")
    print(f"💰 Average price: ₹{sum(prices)/len(prices):,.2f}")
    
    print("\n" + "=" * 80)


def main():
    """Main execution"""
    
    logger.info("=" * 80)
    logger.info("🚀 REALISTIC MARKET DATA GENERATION")
    logger.info("=" * 80)
    logger.info("📊 Using actual market patterns, seasonal cycles, and price dynamics")
    logger.info("")
    
    # Generate 180 days of comprehensive data
    data = generate_realistic_market_data(days_back=180)
    
    if not data:
        logger.error("❌ Data generation failed!")
        return False
    
    # Save to file
    output_file = save_data(data)
    
    # Print summary
    print_summary(data)
    
    logger.info("")
    logger.success(f"✅ Success! Data file: {output_file}")
    logger.info("=" * 80)
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
