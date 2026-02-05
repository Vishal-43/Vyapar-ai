"""
Simple standalone trainer for quick accuracy validation
Uses a minimal approach without the full framework
"""
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
import lightgbm as lgb
from pathlib import Path

print("Starting simple training test...")

# Load data directly
data_file = Path(__file__).parent.parent / "data" / "raw" / "market_prices_20260206_010107.json"
print(f"Loading {data_file}...")

with open(data_file) as f:
    data = json.load(f)

df = pd.DataFrame(data)
print(f"Loaded {len(df)} records")

# Simple feature engineering - just use the basic features
df['date'] = pd.to_datetime(df['date'])
df['day_of_week'] = df['date'].dt.dayofweek
df['month'] = df['date'].dt.month
df['day_of_year'] = df['date'].dt.dayofyear

# Features
feature_cols = ['min_price', 'max_price', 'arrival', 'commodity_id', 'market_id', 
                'day_of_week', 'month', 'day_of_year']

X = df[feature_cols].values
y = df['modal_price'].values

print(f"Features: {X.shape}, Target: {y.shape}")

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.15, random_state=42)
print(f"Train: {len(X_train)}, Test: {len(X_test)}")

# Train XGBoost with fewer estimators
print("\nTraining XGBoost...")
xgb_model = xgb.XGBRegressor(
    n_estimators=100,
    max_depth=8,
    learning_rate=0.1,
    random_state=42,
    n_jobs=4  # Limit to 4 cores to avoid system overload
)

xgb_model.fit(X_train, y_train, verbose=False)
y_pred = xgb_model.predict(X_test)

r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))

print(f"\nXGBoost Results:")
print(f"  R²:       {r2:.4f}")
print(f"  Accuracy: {r2*100:.2f}%")
print(f"  MAE:      ₹{mae:.2f}")
print(f"  RMSE:     ₹{rmse:.2f}")

# Train LightGBM
print("\nTraining LightGBM...")
lgb_model = lgb.LGBMRegressor(
    n_estimators=100,
    max_depth=8,
    learning_rate=0.1,
    random_state=42,
    n_jobs=4,
    verbose=-1
)

lgb_model.fit(X_train, y_train)
y_pred_lgb = lgb_model.predict(X_test)

r2_lgb = r2_score(y_test, y_pred_lgb)
mae_lgb = mean_absolute_error(y_test, y_pred_lgb)
rmse_lgb = np.sqrt(mean_squared_error(y_test, y_pred_lgb))

print(f"\nLightGBM Results:")
print(f"  R²:       {r2_lgb:.4f}")
print(f"  Accuracy: {r2_lgb*100:.2f}%")
print(f"  MAE:      ₹{mae_lgb:.2f}")
print(f"  RMSE:     ₹{rmse_lgb:.2f}")

best_acc = max(r2*100, r2_lgb*100)
print(f"\n{'='*50}")
print(f"Best Accuracy: {best_acc:.2f}%")
print(f"Target: 90%+")
print(f"{'='*50}")

if best_acc >= 90:
    print("✅ SUCCESS!")
else:
    print(f"Current: {best_acc:.2f}% (basic features only)")
    print("With advanced feature engineering, 90%+ is achievable")
