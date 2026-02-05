"""
Quick test script to train models and verify accuracy
"""
import json
import sys
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import xgboost as xgb
import lightgbm as lgb

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml.preprocessor import DataPreprocessor

print("Loading data...")
data_file = Path(__file__).parent.parent / "data" / "raw" / "market_prices_20260206_010107.json"
with open(data_file, 'r') as f:
    data = json.load(f)

print(f"Loaded {len(data)} records")

# Convert to DataFrame
df = pd.DataFrame(data)
print(f"DataFrame shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Initialize preprocessor
preprocessor = DataPreprocessor()

# Prepare features
print("\nPreparing features...")
# Add factorized columns if missing
if 'commodity_id' not in df.columns and 'commodity' in df.columns:
    df['commodity_id'] = pd.factorize(df['commodity'])[0]
if 'market_id' not in df.columns and 'market' in df.columns:
    df['market_id'] = pd.factorize(df['market'])[0]

X, y = preprocessor.prepare_training_data(
    df,
    target_col='price',
    date_col='date',
    numeric_cols=['min_price', 'max_price', 'modal_price', 'arrival', 'commodity_id', 'market_id'],
)

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, shuffle=True
)

print(f"\nTrain set: {X_train.shape[0]} samples")
print(f"Test set: {X_test.shape[0]} samples")

# Train XGBoost
print("\n" + "="*60)
print("Training XGBoost...")
print("="*60)
xgb_model = xgb.XGBRegressor(
    n_estimators=1000,
    max_depth=10,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.9,
    gamma=0.1,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.5,
    random_state=42,
    n_jobs=-1,
    verbosity=1
)

xgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=100)
y_pred_xgb = xgb_model.predict(X_test)

xgb_r2 = r2_score(y_test, y_pred_xgb)
xgb_mae = mean_absolute_error(y_test, y_pred_xgb)
xgb_rmse = np.sqrt(mean_squared_error(y_test, y_pred_xgb))
xgb_accuracy = xgb_r2 * 100

print(f"\nXGBoost Results:")
print(f"  R² Score: {xgb_r2:.6f}")
print(f"  Accuracy: {xgb_accuracy:.2f}%")
print(f"  MAE: ₹{xgb_mae:.2f}")
print(f"  RMSE: ₹{xgb_rmse:.2f}")

# Train LightGBM
print("\n" + "="*60)
print("Training LightGBM...")
print("="*60)
lgb_model = lgb.LGBMRegressor(
    n_estimators=1000,
    max_depth=12,
    learning_rate=0.05,
    num_leaves=63,
    subsample=0.9,
    colsample_bytree=0.9,
    min_child_samples=10,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1,
    verbosity=1
)

lgb_model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
y_pred_lgb = lgb_model.predict(X_test)

lgb_r2 = r2_score(y_test, y_pred_lgb)
lgb_mae = mean_absolute_error(y_test, y_pred_lgb)
lgb_rmse = np.sqrt(mean_squared_error(y_test, y_pred_lgb))
lgb_accuracy = lgb_r2 * 100

print(f"\nLightGBM Results:")
print(f"  R² Score: {lgb_r2:.6f}")
print(f"  Accuracy: {lgb_accuracy:.2f}%")
print(f"  MAE: ₹{lgb_mae:.2f}")
print(f"  RMSE: ₹{lgb_rmse:.2f}")

# Summary
print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"XGBoost Accuracy: {xgb_accuracy:.2f}%")
print(f"LightGBM Accuracy: {lgb_accuracy:.2f}%")
print(f"\nTarget: 90%+ accuracy")
print(f"Best Model: {'XGBoost' if xgb_accuracy > lgb_accuracy else 'LightGBM'}")
print(f"Best Accuracy: {max(xgb_accuracy, lgb_accuracy):.2f}%")

if max(xgb_accuracy, lgb_accuracy) >= 90:
    print("\n✅ SUCCESS: Achieved 90%+ accuracy!")
else:
    print(f"\n❌ NEED IMPROVEMENT: Current best is {max(xgb_accuracy, lgb_accuracy):.2f}%")
