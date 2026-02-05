#!/usr/bin/env python3
"""
Quick script to add sample market prices for testing price comparison
"""
import sqlite3
from datetime import datetime, timedelta
import random

DB_PATH = "/home/vishal/code/hackethon/kjsomiya/backend/data/agritech.db"

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get commodities and markets
cursor.execute("SELECT id, name FROM commodities")
commodities = cursor.fetchall()

cursor.execute("SELECT id, name FROM markets")
markets = cursor.fetchall()

print(f"📊 Found {len(commodities)} commodities and {len(markets)} markets")

# Base prices for commodities (INR per quintal)
base_prices = {
    "Wheat": 2500,
    "Rice": 3500,
    "Maize": 2000,
    "Cotton": 6500,
    "Sugarcane": 350,
    "Potato": 1500,
    "Onion": 2500,
    "Tomato": 1800,
    "Soybean": 4500,
    "Groundnut": 6000,
    "Tur": 7500,
    "Moong": 8500,
}

# Generate 90 days of price data
days = 90
end_date = datetime.now().date()
start_date = end_date - timedelta(days=days)

print(f"📅 Generating price data from {start_date} to {end_date}")

inserted = 0
for commodity_id, commodity_name in commodities:
    base_price = base_prices.get(commodity_name, 3000)
    
    for market_id, market_name in markets:
        # Add slight market variation (±10%)
        market_price = base_price * random.uniform(0.9, 1.1)
        
        for day in range(days):
            date = start_date + timedelta(days=day)
            
            # Add daily variation (±5%)
            daily_price = market_price * random.uniform(0.95, 1.05)
            
            # Add trend (slight increase over time)
            trend_factor = 1 + (day / days) * 0.1  # 10% increase over period
            price = daily_price * trend_factor
            
            min_price = price * 0.95
            max_price = price * 1.05
            arrival = random.randint(50, 500)
            
            cursor.execute("""
                INSERT OR IGNORE INTO market_prices 
                (commodity_id, market_id, date, price, modal_price, min_price, max_price, arrival)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (commodity_id, market_id, date, price, price, min_price, max_price, arrival))
            
            inserted += cursor.rowcount

# Commit changes
conn.commit()

# Verify
cursor.execute("SELECT COUNT(*) FROM market_prices")
total = cursor.fetchone()[0]

print(f"✅ Inserted {inserted} new price records")
print(f"📊 Total price records in database: {total:,}")

# Show sample data
print("\n🔍 Sample price data:")
cursor.execute("""
    SELECT c.name, m.name, mp.date, mp.price
    FROM market_prices mp
    JOIN commodities c ON mp.commodity_id = c.id
    JOIN markets m ON mp.market_id = m.id
    ORDER BY mp.date DESC
    LIMIT 5
""")
for row in cursor.fetchall():
    print(f"  {row[0]:15} | {row[1]:15} | {row[2]} | ₹{row[3]:.2f}")

conn.close()
print("\n🎉 Price data generation complete!")
