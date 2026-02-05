#!/usr/bin/env python
"""Simplified training script that works with generated data."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pandas as pd
import numpy as np
import json
from datetime import datetime
from pathlib import Path
from loguru import logger
import joblib

from app.ml.trainer import ModelTrainer
from app.ml.preprocessor import DataPreprocessor
from app.config import settings

def load_data():
    """Load the generated data."""
    # Use absolute path
    data_dir = Path(__file__).parent.parent / 'data' / 'raw'
    
    logger.info(f"Looking for data in: {data_dir}")
    
    # Find latest data file
    price_files = list(data_dir.glob("market_prices_*.json"))
    
    if not price_files:
        logger.error(f"No data files found in {data_dir}")
        raise ValueError("No data files found")
    
    latest_file = max(price_files, key=lambda p: p.stat().st_mtime)
    logger.info(f"Loading data from {latest_file}")
    
    with open(latest_file, 'r') as f:
        data = json.load(f)
    
    # Handle both formats: list or dict with 'prices' key
    if isinstance(data, list):
        prices = data
    else:
        prices = data.get('prices', data)
    
    df = pd.DataFrame(prices)
    
    logger.info(f"Loaded {len(df)} records")
    return df

def train():
    """Train models."""
    logger.info("="*60)
    logger.info("ENHANCED MODEL TRAINING")
    logger.info("="*60)
    
    # Load data
    df = load_data()
    
    # Prepare data
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    df['commodity_id'] = pd.factorize(df['commodity'])[0]
    df['market_id'] = pd.factorize(df['market'])[0]
    
    # Add simple weather features (synthetic for now)
    df['weather_temperature'] = np.clip(25.0 + np.random.normal(0, 5, len(df)), 0, 50)
    df['weather_humidity'] = np.clip(60.0 + np.random.normal(0, 15, len(df)), 20, 100)
    df['weather_rainfall'] = np.clip(np.random.exponential(5, len(df)), 0, 200)
    df['weather_temp_range'] = np.clip(np.abs(np.random.normal(10, 3, len(df))), 0, 30)
    df['weather_heat_stress'] = np.clip(np.maximum(0, df['weather_temperature'] - 35), 0, 20)
    df['weather_cold_stress'] = np.clip(np.maximum(0, 10 - df['weather_temperature']), 0, 20)
    df['weather_drought_indicator'] = (df['weather_rainfall'] < 2).astype(float)
    df['weather_flood_risk'] = (df['weather_rainfall'] > 50).astype(float)
    
    # Fill any remaining NaNs
    df = df.fillna(0)
    
    logger.info(f"Data prepared with {len(df)} records")
    
    # Initialize
    preprocessor = DataPreprocessor(scaler_type='standard')
    trainer = ModelTrainer(preprocessor=preprocessor)
    
    # Prepare features
    target_col = 'price'
    date_col = 'date'
    categorical_cols = ['commodity', 'market', 'state']
    numeric_cols = ['commodity_id', 'market_id', 'min_price', 'max_price', 'modal_price', 'arrival',
                    'weather_temperature', 'weather_humidity', 'weather_rainfall', 'weather_temp_range',
                    'weather_heat_stress', 'weather_cold_stress', 'weather_drought_indicator', 'weather_flood_risk']
    
    logger.info("Preparing features...")
    X, y = preprocessor.prepare_training_data(
        df, target_col=target_col, date_col=date_col,
        categorical_cols=categorical_cols, numeric_cols=numeric_cols,
        handle_missing=True, handle_outliers_=True
    )
    
    logger.info(f"Features: {X.shape[1]}, Samples: {X.shape[0]}")
    
    # Split
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")
    
    # Train models - adjust list based on time
    models_to_train = ['random_forest', 'xgboost', 'lightgbm']  # Start with faster models
    
    logger.info(f"\nTraining models: {models_to_train}\n")
    
    results = trainer.train_all_models(
        X_train=X_train, y_train=y_train,
        X_test=X_test, y_test=y_test,
        models_to_train=models_to_train
    )
    
    # Display results
    logger.info("\n" + "="*60)
    logger.info("RESULTS")
    logger.info("="*60)
    
    for name, result in results.items():
        metrics = result['metrics']
        logger.info(f"\n{name.upper()}")
        logger.info(f"  Accuracy: {metrics['accuracy']:.2%}")
        logger.info(f"  R²: {metrics['r2_score']:.4f}")
        logger.info(f"  MAE: ₹{metrics['mae']:.2f}")
    
    # Ensemble
    preds = [results[name]['model'].predict(X_test) for name in results.keys()]
    ensemble_pred = np.mean(preds, axis=0)
    
    from sklearn.metrics import r2_score, mean_absolute_error, mean_absolute_percentage_error
    ensemble_r2 = r2_score(y_test, ensemble_pred)
    ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
    ensemble_mape = mean_absolute_percentage_error(y_test, ensemble_pred)
    ensemble_acc = max(0, 1 - ensemble_mape)
    
    logger.info(f"\nENSEMBLE")
    logger.info(f"  Accuracy: {ensemble_acc:.2%}")
    logger.info(f"  R²: {ensemble_r2:.4f}")
    logger.info(f"  MAE: ₹{ensemble_mae:.2f}")
    
    # Save
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for name in trainer.models.keys():
        trainer.save_model(trainer.models[name], name, timestamp)
    
    trainer.save_preprocessor(timestamp)
    
    # Save ensemble
    ensemble_data = {
        'models': trainer.models,
        'preprocessor': preprocessor,
        'model_weights': {name: 1.0/len(results) for name in results.keys()},
        'metrics': {name: result['metrics'] for name, result in results.items()},
        'ensemble_metrics': {
            'accuracy': float(ensemble_acc),
            'r2_score': float(ensemble_r2),
            'mae': float(ensemble_mae),
            'mape': float(ensemble_mape)
        },
        'timestamp': timestamp,
    }
    
    ensemble_path = Path(settings.model_dir) / f"ensemble_{timestamp}.joblib"
    joblib.dump(ensemble_data, ensemble_path)
    
    logger.success(f"\n✓ Training complete! Ensemble accuracy: {ensemble_acc:.2%}")
    logger.info(f"Models saved to: {settings.model_dir}")

if __name__ == "__main__":
    train()
