#!/usr/bin/env python
"""Quick data generation script."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Generate comprehensive realistic market data
def generate_data(days=180):
    all_commodities = [
        ("Wheat", 2500, "Cereals"),
        ("Rice", 3500, "Cereals"),
        ("Maize", 2000, "Cereals"),
        ("Potato", 1200, "Vegetables"),
        ("Onion", 2000, "Vegetables"),
        ("Tomato", 1500, "Vegetables"),
        ("Cotton", 6000, "Cash Crops"),
        ("Groundnut", 5500, "Oilseeds"),
        ("Soybean", 4000, "Oilseeds"),
        ("Tur", 7000, "Pulses"),
        ("Moong", 8000, "Pulses"),
        ("Apple", 4500, "Fruits"),
        ("Banana", 1800, "Fruits"),
        ("Mango", 3000, "Fruits"),
    ]
    
    major_markets = [
        ("Azadpur", "Delhi"),
        ("Mumbai (Dadar)", "Maharashtra"),
        ("Bangalore", "Karnataka"),
        ("Chennai", "Tamil Nadu"),
        ("Hyderabad", "Telangana"),
        ("Kolkata", "West Bengal"),
        ("Pune", "Maharashtra"),
        ("Ahmedabad", "Gujarat"),
    ]
    
    data = []
    start_date = datetime.now() - timedelta(days=days)
    
    for day in range(days):
        current_date = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
        month = (start_date + timedelta(days=day)).month
        
        for commodity, base_price, category in all_commodities:
            seasonal_factor = 1.0
            
            if commodity in ["Wheat"] and month in [3, 4]:
                seasonal_factor = 0.80
            elif commodity in ["Onion", "Potato"] and month in [12, 1, 2]:
                seasonal_factor = 1.35
            elif commodity in ["Mango"] and month in [5, 6]:
                seasonal_factor = 1.50
            elif commodity in ["Rice"] and month in [10, 11]:
                seasonal_factor = 0.85
            
            for market, state in major_markets:
                variation = random.uniform(-0.15, 0.15)
                trend = (day / max(days, 1)) * random.uniform(-0.08, 0.10)
                
                adjusted_price = base_price * seasonal_factor * (1 + variation + trend)
                min_price = adjusted_price * random.uniform(0.85, 0.92)
                max_price = adjusted_price * random.uniform(1.08, 1.15)
                arrival = random.uniform(500, 5000)
                
                data.append({
                    "commodity": commodity,
                    "market": market,
                    "state": state,
                    "date": current_date,
                    "min_price": round(min_price, 2),
                    "max_price": round(max_price, 2),
                    "modal_price": round(adjusted_price, 2),
                    "price": round(adjusted_price, 2),
                    "arrival": round(arrival, 2),
                })
    
    return data

if __name__ == "__main__":
    print("Generating market data...")
    
    prices = generate_data(180)
    
    # Save
    data_dir = Path(__file__).parent.parent / 'data' / 'raw'
    data_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = data_dir / f'market_prices_{timestamp}.json'
    
    with open(output_file, 'w') as f:
        json.dump({
            'prices': prices,
            'scraped_at': timestamp,
            'count': len(prices)
        }, f)
    
    print(f"\n=== DATA GENERATION COMPLETE ===")
    print(f"Total Records: {len(prices)}")
    print(f"Saved to: {output_file}")
