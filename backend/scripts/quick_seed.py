#!/usr/bin/env python3
"""
Quick seed script to add essential markets and commodities via backend API
"""
import requests
import json

BACKEND_URL = "http://localhost:8000"

# Top Indian markets
MARKETS = [
    {"name": "Delhi", "state": "Delhi", "district": "Delhi"},
    {"name": "Mumbai", "state": "Maharashtra", "district": "Mumbai"},
    {"name": "Bangalore", "state": "Karnataka", "district": "Bangalore"},
    {"name": "Kolkata", "state": "West Bengal", "district": "Kolkata"},
    {"name": "Chennai", "state": "Tamil Nadu", "district": "Chennai"},
    {"name": "Hyderabad", "state": "Telangana", "district": "Hyderabad"},
    {"name": "Pune", "state": "Maharashtra", "district": "Pune"},
    {"name": "Ahmedabad", "state": "Gujarat", "district": "Ahmedabad"},
    {"name": "Jaipur", "state": "Rajasthan", "district": "Jaipur"},
    {"name": "Lucknow", "state": "Uttar Pradesh", "district": "Lucknow"},
    {"name": "Chandigarh", "state": "Punjab", "district": "Chandigarh"},
    {"name": "Bhopal", "state": "Madhya Pradesh", "district": "Bhopal"},
    {"name": "Patna", "state": "Bihar", "district": "Patna"},
    {"name": "Indore", "state": "Madhya Pradesh", "district": "Indore"},
    {"name": "Nagpur", "state": "Maharashtra", "district": "Nagpur"},
]

# Essential commodities (these already exist)
COMMODITIES = [
    {"name": "Wheat", "category": "Cereal"},
    {"name": "Rice", "category": "Cereal"},
    {"name": "Maize", "category": "Cereal"},
    {"name": "Cotton", "category": "Cash Crop"},
    {"name": "Sugarcane", "category": "Cash Crop"},
    {"name": "Potato", "category": "Vegetable"},
    {"name": "Onion", "category": "Vegetable"},
    {"name": "Tomato", "category": "Vegetable"},
    {"name": "Soybean", "category": "Oilseed"},
    {"name": "Groundnut", "category": "Oilseed"},
    {"name": "Tur", "category": "Pulse"},
    {"name": "Moong", "category": "Pulse"},
]

print("🌾 Seeding markets and commodities...")
print(f"Backend: {BACKEND_URL}")
print()

# Check if backend is running
try:
    response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
    print("✅ Backend is running")
except:
    print("❌ Backend is not running! Please start it first:")
    print("   cd backend && python run.py")
    exit(1)

# Add markets - we'll use direct database approach
print("\n📍 Adding markets to database...")

# Create a simple Python script that adds directly to database
seed_sql = """
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import get_sync_session, init_sync_db
from app.database.models import Market, Commodity

init_sync_db()

markets_data = %s
commodities_data = %s

for session in get_sync_session():
    # Add markets
    for m in markets_data:
        existing = session.query(Market).filter_by(name=m['name']).first()
        if not existing:
            market = Market(**m)
            session.add(market)
            print(f"  ✓ Added market: {m['name']}")
        else:
            print(f"  - Market exists: {m['name']}")
    
    # Add commodities (though they likely exist)
    for c in commodities_data:
        existing = session.query(Commodity).filter_by(name=c['name']).first()
        if not existing:
            commodity = Commodity(**c, unit='Quintal')
            session.add(commodity)
            print(f"  ✓ Added commodity: {c['name']}")
    
    session.commit()
    print("\\n✅ Seeding complete!")
    break
""" % (MARKETS, COMMODITIES)

# Write to temp file
import tempfile
import subprocess

with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
    f.write(seed_sql)
    temp_file = f.name

try:
    print("Running database seed...")
    result = subprocess.run(
        ['python', temp_file],
        cwd='/home/vishal/code/hackethon/kjsomiya/backend',
        capture_output=True,
        text=True
    )
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
finally:
    import os
    os.unlink(temp_file)

# Verify
print("\n🔍 Verifying data...")
try:
    markets = requests.get(f"{BACKEND_URL}/api/markets").json()
    commodities = requests.get(f"{BACKEND_URL}/api/commodities").json()
    print(f"✅ Markets: {len(markets)}")
    print(f"✅ Commodities: {len(commodities)}")
    
    if len(markets) > 0:
        print(f"\nSample markets: {', '.join([m['name'] for m in markets[:5]])}")
except Exception as e:
    print(f"Error verifying: {e}")
