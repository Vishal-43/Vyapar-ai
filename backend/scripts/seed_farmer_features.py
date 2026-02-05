"""Seed database with sample data for farmer profit features"""
import sys
import os
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_sync_session
from sqlalchemy import text


def seed_regions(db):
    """Seed regions table"""
    print("Seeding regions...")
    regions = [
        ("Delhi NCR", "Delhi", "India", 28.7041, 77.1025),
        ("Mumbai", "Maharashtra", "India", 19.0760, 72.8777),
        ("Bangalore", "Karnataka", "India", 12.9716, 77.5946),
        ("Chennai", "Tamil Nadu", "India", 13.0827, 80.2707),
        ("Hyderabad", "Telangana", "India", 17.3850, 78.4867),
        ("Kolkata", "West Bengal", "India", 22.5726, 88.3639),
        ("Pune", "Maharashtra", "India", 18.5204, 73.8567),
        ("Ahmedabad", "Gujarat", "India", 23.0225, 72.5714),
        ("Jaipur", "Rajasthan", "India", 26.9124, 75.7873),
        ("Lucknow", "Uttar Pradesh", "India", 26.8467, 80.9462),
    ]
    
    for name, state, country, lat, lon in regions:
        db.execute(text(
            "INSERT OR IGNORE INTO regions (name, state, country, lat, lon) VALUES (:name, :state, :country, :lat, :lon)"
        ), {"name": name, "state": state, "country": country, "lat": lat, "lon": lon})
    db.commit()


def seed_commodities(db):
    """Seed commodities table"""
    print("Seeding commodities...")
    commodities = [
        ("Wheat", "Cereal", "kg"),
        ("Rice", "Cereal", "kg"),
        ("Maize", "Cereal", "kg"),
        ("Cotton", "Cash Crop", "kg"),
        ("Sugarcane", "Cash Crop", "kg"),
        ("Potato", "Vegetable", "kg"),
        ("Onion", "Vegetable", "kg"),
        ("Tomato", "Vegetable", "kg"),
        ("Soybean", "Oilseed", "kg"),
        ("Groundnut", "Oilseed", "kg"),
        ("Tur", "Pulse", "kg"),
        ("Moong", "Pulse", "kg"),
    ]
    
    for name, category, unit in commodities:
        db.execute(text(
            "INSERT OR IGNORE INTO commodities (name, category, unit) VALUES (:name, :category, :unit)"
        ), {"name": name, "category": category, "unit": unit})
    db.commit()



def seed_crops(db):
    """Seed crops table"""
    print("Seeding crops...")
    crops = [
        ("Wheat", "Cereal", "Rabi", 120),
        ("Rice", "Cereal", "Kharif", 120),
        ("Maize", "Cereal", "Kharif", 90),
        ("Cotton", "Cash Crop", "Kharif", 150),
        ("Sugarcane", "Cash Crop", "Perennial", 365),
        ("Potato", "Vegetable", "Rabi", 90),
        ("Onion", "Vegetable", "Rabi", 120),
        ("Tomato", "Vegetable", "Kharif", 75),
        ("Soybean", "Oilseed", "Kharif", 100),
        ("Groundnut", "Oilseed", "Kharif", 120),
        ("Tur", "Pulse", "Kharif", 150),
        ("Moong", "Pulse", "Kharif", 60),
    ]
    
    for name, category, season, duration in crops:
        db.execute(text(
            "INSERT OR IGNORE INTO crops (name, category, season, growth_duration_days) VALUES (:name, :category, :season, :duration)"
        ), {"name": name, "category": category, "season": season, "duration": duration})
    db.commit()


def seed_crop_economics(db):
    """Seed crop economics data"""
    print("Seeding crop economics...")
    # Get crop and region IDs
    crops = db.execute(text("SELECT id, name FROM crops")).fetchall()
    regions = db.execute(text("SELECT id FROM regions")).fetchall()
    
    # Sample yields and prices (in realistic Indian context)
    crop_data = {
        "Wheat": (3000, 22),  # kg/hectare, INR/kg
        "Rice": (4000, 25),
        "Maize": (3500, 18),
        "Cotton": (500, 80),  # quintals, higher price
        "Sugarcane": (70000, 3),
        "Potato": (25000, 12),
        "Onion": (20000, 15),
        "Tomato": (30000, 18),
        "Soybean": (2000, 45),
        "Groundnut": (2500, 55),
        "Tur": (1200, 85),
        "Moong": (800, 75),
    }
    
    for crop_id, crop_name in crops:
        if crop_name in crop_data:
            base_yield, base_price = crop_data[crop_name]
            for region_id, in regions:
                # Add ±20% variation by region
                yield_var = random.uniform(0.8, 1.2)
                price_var = random.uniform(0.9, 1.1)
                
                db.execute(text("""
                    INSERT OR IGNORE INTO crop_economics 
                    (crop_id, region_id, yield_per_hectare, avg_price_per_kg) 
                    VALUES (:crop_id, :region_id, :yield, :price)
                """), {
                    "crop_id": crop_id,
                    "region_id": region_id,
                    "yield": base_yield * yield_var,
                    "price": base_price * price_var
                })
    db.commit()


def seed_crop_costs(db):
    """Seed crop costs data"""
    print("Seeding crop costs...")
    crops = db.execute(text("SELECT id FROM crops")).fetchall()
    regions = db.execute(text("SELECT id FROM regions LIMIT 3")).fetchall()  # Just seed for 3 regions
    
    cost_categories = ["Seeds", "Fertilizer", "Pesticides", "Labor", "Irrigation", "Machinery"]
    
    for crop_id, in crops:
        for region_id, in regions:
            total_cost = random.uniform(15000, 50000)  # Total cost per hectare
            for category in cost_categories:
                percentage = random.uniform(0.1, 0.25)  # Each category 10-25% of total
                amount = total_cost * percentage
                
                db.execute(text("""
                    INSERT OR IGNORE INTO crop_costs 
                    (crop_id, region_id, cost_category, amount_per_hectare) 
                    VALUES (:crop_id, :region_id, :category, :amount)
                """), {
                    "crop_id": crop_id,
                    "region_id": region_id,
                    "category": category,
                    "amount": amount
                })
    db.commit()


def seed_seasonal_patterns(db):
    """Seed seasonal price patterns"""
    print("Seeding seasonal price patterns...")
    # Get commodities
    commodities = db.execute(text("SELECT id, name FROM commodities")).fetchall()
    
    for commodity_id, commodity_name in commodities:
        # Create pattern for each month
        base_price = random.uniform(2000, 8000)
        
        for month in range(1, 13):
            # Create seasonal variation
            # Peak months (harvest +3 months): higher prices
            # Harvest months: lower prices
            if month in [1, 2, 11, 12]:  # Winter - high demand
                multiplier = random.uniform(1.1, 1.3)
            elif month in [4, 5, 10]:  # Post-harvest
                multiplier = random.uniform(0.8, 0.95)
            else:
                multiplier = random.uniform(0.95, 1.1)
            
            avg_price = base_price * multiplier
            std_dev = avg_price * 0.15
            min_price = avg_price * 0.85
            max_price = avg_price * 1.15
            
            db.execute(text("""
                INSERT OR REPLACE INTO seasonal_price_patterns 
                (commodity_id, month, avg_price, std_dev, min_price, max_price) 
                VALUES (:commodity_id, :month, :avg_price, :std_dev, :min_price, :max_price)
            """), {
                "commodity_id": commodity_id,
                "month": month,
                "avg_price": avg_price,
                "std_dev": std_dev,
                "min_price": min_price,
                "max_price": max_price
            })
    db.commit()


def seed_storage_costs(db):
    """Seed storage costs data"""
    print("Seeding storage costs...")
    commodities = db.execute(text("SELECT id, name FROM commodities")).fetchall()
    
    storage_data = {
        "Wheat": (5, 180),  # INR per quintal per month, max days
        "Rice": (5, 180),
        "Maize": (4, 120),
        "Potato": (15, 90),  # Perishable - higher cost, shorter duration
        "Onion": (12, 120),
        "Tomato": (25, 30),  # Very perishable
        "Cotton": (8, 365),
        "Soybean": (6, 180),
        "Groundnut": (7, 150),
    }
    
    for commodity_id, commodity_name in commodities:
        # Use specific data if available, else defaults
        if commodity_name in storage_data:
            cost, max_days = storage_data[commodity_name]
        else:
            cost = random.uniform(5, 15)
            max_days = random.choice([90, 120, 180])
        
        db.execute(text("""
            INSERT OR REPLACE INTO storage_costs 
            (commodity_id, cost_per_quintal_per_month, max_storage_days) 
            VALUES (:commodity_id, :cost, :max_days)
        """), {
            "commodity_id": commodity_id,
            "cost": cost,
            "max_days": max_days
        })
    db.commit()


def seed_direct_buyers(db):
    """Seed direct buyers data"""
    print("Seeding direct buyers...")
    regions = db.execute(text("SELECT id, name, lat, lon FROM regions")).fetchall()
    
    buyer_types = ["Processor", "Exporter", "Cooperative", "Retailer", "Wholesaler"]
    companies = ["AgriCorp", "FarmFresh", "GreenHarvest", "CropConnect", "DirectFarm"]
    
    buyer_id_map = {}
    for i in range(20):
        region_id, region_name, lat, lon = random.choice(regions)
        buyer_type = random.choice(buyer_types)
        company = random.choice(companies)
        
        name = f"{company} {buyer_type} - {region_name}"
        location = region_name
        
        # Add small variation to coordinates
        buyer_lat = lat + random.uniform(-0.5, 0.5)
        buyer_lon = lon + random.uniform(-0.5, 0.5)
        
        rating = round(random.uniform(3.5, 5.0), 2)
        reviews_count = random.randint(10, 200)
        
        result = db.execute(text("""
            INSERT INTO direct_buyers 
            (name, type, location, lat, lon, contact_phone, verified, rating, reviews_count) 
            VALUES (:name, :type, :location, :lat, :lon, :phone, :verified, :rating, :reviews)
            RETURNING id
        """), {
            "name": name,
            "type": buyer_type,
            "location": location,
            "lat": buyer_lat,
            "lon": buyer_lon,
            "phone": f"+91-{random.randint(7000000000, 9999999999)}",
            "verified": random.choice([True, True, False]),  # 66% verified
            "rating": rating,
            "reviews": reviews_count
        })
        buyer_id = result.fetchone()[0]
        buyer_id_map[buyer_id] = name
    
    db.commit()
    return buyer_id_map


def seed_buyer_commodities(db, buyer_id_map):
    """Seed buyer_commodities relationship"""
    print("Seeding buyer commodities...")
    commodities = db.execute(text("SELECT id, name FROM commodities")).fetchall()
    
    if not commodities:
        print("Warning: No commodities found. Skipping buyer commodities seeding.")
        return
    
    for buyer_id in buyer_id_map.keys():
        # Each buyer deals in 2-5 commodities, but not more than available
        num_commodities = min(random.randint(2, 5), len(commodities))
        selected_commodities = random.sample(commodities, num_commodities)
        
        for commodity_id, commodity_name in selected_commodities:
            # Get average market price
            market_price = random.uniform(2000, 8000)
            
            # Buyers offer slightly better than market (5-15% premium)
            premium = random.uniform(1.05, 1.15)
            offered_price = market_price * premium
            
            min_quantity = random.choice([500, 1000, 2000, 5000])  # kg
            advance_payment = random.choice([20, 30, 40, 50])  # percentage
            
            db.execute(text("""
                INSERT OR IGNORE INTO buyer_commodities 
                (buyer_id, commodity_id, min_quantity_kg, offered_price, advance_payment_pct) 
                VALUES (:buyer_id, :commodity_id, :min_qty, :price, :advance)
            """), {
                "buyer_id": buyer_id,
                "commodity_id": commodity_id,
                "min_qty": min_quantity,
                "price": offered_price,
                "advance": advance_payment
            })
    
    db.commit()


def seed_farmers(db):
    """Seed sample farmers"""
    print("Seeding farmers...")
    regions = db.execute(text("SELECT id FROM regions")).fetchall()
    
    farmer_names = ["Ramesh Kumar", "Suresh Patel", "Vijay Singh", "Prakash Reddy", "Mahesh Yadav"]
    
    farmer_ids = []
    for name in farmer_names:
        region_id = random.choice(regions)[0]
        land = round(random.uniform(1.0, 10.0), 2)
        capital = round(random.uniform(100000, 500000), 2)
        risk_tolerance = random.choice(["low", "medium", "high"])
        
        result = db.execute(text("""
            INSERT INTO farmers 
            (name, phone, region_id, land_hectares, capital_available, risk_tolerance) 
            VALUES (:name, :phone, :region_id, :land, :capital, :risk)
            RETURNING id
        """), {
            "name": name,
            "phone": f"+91-{random.randint(7000000000, 9999999999)}",
            "region_id": region_id,
            "land": land,
            "capital": capital,
            "risk": risk_tolerance
        })
        farmer_ids.append(result.fetchone()[0])
    
    db.commit()
    return farmer_ids


def seed_weather_data(db):
    """Seed sample weather forecast data"""
    print("Seeding weather forecasts...")
    regions = db.execute(text("SELECT id FROM regions LIMIT 5")).fetchall()
    
    # Seed next 7 days of weather
    for region_id, in regions:
        for days_ahead in range(7):
            forecast_date = datetime.now().date() + timedelta(days=days_ahead)
            
            # India weather ranges
            temp_min = random.uniform(15, 28)
            temp_max = temp_min + random.uniform(5, 12)
            rainfall = random.choice([0, 0, 0, random.uniform(0, 50)])  # 25% chance of rain
            humidity = random.uniform(40, 85)
            wind_speed = random.uniform(5, 25)
            
            db.execute(text("""
                INSERT OR REPLACE INTO weather_forecasts 
                (location_id, date, temp_min, temp_max, rainfall_mm, humidity_pct, wind_speed_kmh) 
                VALUES (:loc_id, :date, :temp_min, :temp_max, :rainfall, :humidity, :wind)
            """), {
                "loc_id": region_id,
                "date": forecast_date,
                "temp_min": temp_min,
                "temp_max": temp_max,
                "rainfall": rainfall,
                "humidity": humidity,
                "wind": wind_speed
            })
    
    db.commit()


def main():
    """Main seeding function"""
    print("Starting database seeding...")
    
    db = next(get_sync_session())
    
    try:
        seed_regions(db)
        seed_commodities(db)
        seed_crops(db)
        seed_crop_economics(db)
        seed_crop_costs(db)
        seed_seasonal_patterns(db)
        seed_storage_costs(db)
        buyer_id_map = seed_direct_buyers(db)
        seed_buyer_commodities(db, buyer_id_map)
        farmer_ids = seed_farmers(db)
        seed_weather_data(db)
        
        print("\n✅ Database seeding completed successfully!")
        print(f"   - Regions: 10")
        print(f"   - Crops: 12")
        print(f"   - Direct Buyers: 20")
        print(f"   - Farmers: {len(farmer_ids)}")
        print(f"   - Weather forecasts: 35 (7 days × 5 regions)")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
