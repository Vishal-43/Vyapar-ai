"""Generate realistic agricultural market price data for model training."""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

def generate_realistic_market_data(
    num_commodities=10,
    num_markets=8,
    days=180,
    samples_per_day=15
):
    """
    Generate realistic market price data with meaningful patterns:
    - Seasonal trends
    - Weekly patterns
    - Supply-demand dynamics
    - Price volatility
    - Festival effects
    """
    
    # Define commodity characteristics
    commodities = [
        {"id": i, "base_price": random.randint(1500, 8000), "volatility": random.uniform(0.05, 0.15)}
        for i in range(1, num_commodities + 1)
    ]
    
    # Define market characteristics
    markets = [
        {"id": i, "premium": random.uniform(0.95, 1.05)}
        for i in range(1, num_markets + 1)
    ]
    
    data = []
    start_date = datetime.now() - timedelta(days=days)
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # Seasonal factor (higher prices in off-season)
        month = current_date.month
        seasonal_factor = 1.0 + 0.2 * np.sin(2 * np.pi * month / 12)
        
        # Weekend effect (slightly lower prices)
        weekend_factor = 0.98 if current_date.weekday() >= 5 else 1.0
        
        # Festival boost (random festivals ~10% of the time)
        festival_factor = 1.15 if random.random() < 0.1 else 1.0
        
        # Generate samples for each commodity-market combination
        for _ in range(random.randint(samples_per_day - 5, samples_per_day + 5)):
            commodity = random.choice(commodities)
            market = random.choice(markets)
            
            # Base price with all factors
            base = commodity["base_price"] * seasonal_factor * weekend_factor * festival_factor * market["premium"]
            
            # Add realistic noise
            noise = random.gauss(0, commodity["volatility"] * base)
            price = max(100, base + noise)
            
            # Generate min/max/modal prices
            spread = price * 0.08
            min_price = max(100, price - spread + random.gauss(0, spread * 0.2))
            max_price = price + spread + random.gauss(0, spread * 0.2)
            modal_price = price + random.gauss(0, spread * 0.1)
            
            # Arrival (supply) - inversely related to price
            avg_arrival = 150
            arrival = max(10, int(avg_arrival * (commodity["base_price"] / price) * random.uniform(0.8, 1.2)))
            
            data.append({
                "date": date_str,
                "commodity": f"Commodity_{commodity['id']}",
                "commodity_id": commodity["id"],
                "market": f"Market_{market['id']}",
                "market_id": market["id"],
                "price": round(price, 2),
                "min_price": round(min_price, 2),
                "max_price": round(max_price, 2),
                "modal_price": round(modal_price, 2),
                "arrival": arrival
            })
    
    return data

if __name__ == "__main__":
    print("Generating realistic training data...")
    
    # Generate data
    data = generate_realistic_market_data(
        num_commodities=12,
        num_markets=10,
        days=180,
        samples_per_day=20
    )
    
    print(f"Generated {len(data)} records")
    
    # Save to file
    output_dir = Path(__file__).parent.parent / 'data' / 'raw'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = output_dir / f"market_prices_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved to {output_file}")
    
    # Print sample statistics
    prices = [d['price'] for d in data]
    print(f"\nPrice statistics:")
    print(f"  Min: ₹{min(prices):.2f}")
    print(f"  Max: ₹{max(prices):.2f}")
    print(f"  Mean: ₹{np.mean(prices):.2f}")
    print(f"  Std: ₹{np.std(prices):.2f}")
