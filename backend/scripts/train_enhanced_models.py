#!/usr/bin/env python
"""
Enhanced model training script with atmospheric features, festival integration,
SVM, GPR, and targeting 98%+ accuracy.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from loguru import logger
import joblib

from app.ml.trainer import ModelTrainer
from app.ml.preprocessor import DataPreprocessor
from app.ml.ensemble import EnsembleManager
from app.services.weather_service import get_weather_service
from app.core.festival_calendar import FestivalCalendar
from app.config import settings


async def enrich_data_with_weather(df: pd.DataFrame) -> pd.DataFrame:
    """Enrich dataset with weather features."""
    logger.info("Enriching dataset with atmospheric features...")
    
    weather_service = get_weather_service()
    
    # Add weather features for major states
    state_samples = df['state'].unique() if 'state' in df.columns else ['Delhi', 'Maharashtra', 'Karnataka']
    
    # Get weather data for each state (using first occurrence to avoid too many API calls)
    weather_cache = {}
    for state in state_samples:
        try:
            weather_data = await weather_service.get_weather_for_prediction(
                state=state,
                include_forecast=True
            )
            weather_cache[state] = weather_data['features']
            logger.info(f"Fetched weather for {state}")
        except Exception as e:
            logger.warning(f"Failed to fetch weather for {state}: {e}")
            # Use default weather features
            weather_cache[state] = {
                'weather_temperature': 25.0,
                'weather_temp_min': 20.0,
                'weather_temp_max': 30.0,
                'weather_temp_range': 10.0,
                'weather_humidity': 60.0,
                'weather_pressure': 1013.0,
                'weather_wind_speed': 5.0,
                'weather_rainfall': 0.0,
                'weather_cloudiness': 50.0,
                'weather_heat_stress': 0.0,
                'weather_cold_stress': 0.0,
                'weather_drought_indicator': 0.0,
                'weather_flood_risk': 0.0,
                'weather_uncertainty': 0.1,
                'weather_temp_volatility': 0.1,
                'weather_rainfall_volatility': 0.1,
            }
    
    # Apply weather features to all rows based on state
    if 'state' in df.columns:
        for feature_name in weather_cache[list(weather_cache.keys())[0]].keys():
            df[feature_name] = df['state'].map(
                lambda s: weather_cache.get(s, weather_cache[list(weather_cache.keys())[0]]).get(feature_name, 0.0)
            )
    else:
        # Apply default weather features
        default_weather = weather_cache[list(weather_cache.keys())[0]]
        for feature_name, value in default_weather.items():
            df[feature_name] = value
    
    logger.info(f"Added {len(default_weather)} weather features to dataset")
    return df


def enrich_data_with_festivals(df: pd.DataFrame) -> pd.DataFrame:
    """Enrich dataset with festival features."""
    logger.info("Enriching dataset with festival calendar features...")
    
    festival_calendar = FestivalCalendar()
    
    if 'date' in df.columns:
        df = festival_calendar.enrich_dataframe(df, 'date')
    
    logger.info("Festival features added successfully")
    return df


async def load_and_prepare_data() -> tuple:
    """Load scraped data and prepare for training."""
    logger.info("Loading scraped market data...")
    
    data_dir = Path(settings.data_raw_dir)
    
    # Find latest scrape files
    scrape_summary_files = list(data_dir.glob("scrape_summary_*.json"))
    price_files = list(data_dir.glob("market_prices_*.json"))
    
    all_prices = []
    
    # Load from scrape summary if available
    if scrape_summary_files:
        latest_summary = max(scrape_summary_files, key=lambda p: p.stat().st_mtime)
        logger.info(f"Loading data from {latest_summary.name}")
        
        import json
        with open(latest_summary, 'r') as f:
            summary_data = json.load(f)
            
        if 'data' in summary_data:
            all_prices.extend(summary_data['data'].get('prices', []))
            all_prices.extend(summary_data['data'].get('historical_prices', []))
    
    # Also load individual price files
    for price_file in sorted(price_files, key=lambda p: p.stat().st_mtime)[-5:]:  # Last 5 files
        import json
        with open(price_file, 'r') as f:
            price_data = json.load(f)
            all_prices.extend(price_data.get('prices', []))
    
    if not all_prices:
        logger.error("No price data found! Make sure to run the scraper first.")
        raise ValueError("No training data available")
    
    # Convert to DataFrame
    df = pd.DataFrame(all_prices)
    
    # Clean and prepare data
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date')
    
    # Add commodity and market IDs
    df['commodity_id'] = pd.factorize(df['commodity'])[0]
    df['market_id'] = pd.factorize(df['market'])[0]
    
    logger.info(f"Loaded {len(df)} price records")
    logger.info(f"Date range: {df['date'].min()} to {df['date'].max()}")
    logger.info(f"Commodities: {df['commodity'].nunique()}")
    logger.info(f"Markets: {df['market'].nunique()}")
    
    # Enrich with weather and festival data
    df = await enrich_data_with_weather(df)
    df = enrich_data_with_festivals(df)
    
    # Prepare features and target
    target_col = 'price'
    date_col = 'date'
    categorical_cols = ['commodity', 'market', 'state']
    
    # Create numeric columns list
    numeric_cols = [
        'commodity_id', 'market_id', 'min_price', 'max_price', 'modal_price', 'arrival'
    ]
    
    # Add weather features to numeric columns
    weather_features = [col for col in df.columns if col.startswith('weather_')]
    numeric_cols.extend(weather_features)
    
    # Remove duplicates and NaN
    df = df.dropna(subset=[target_col])
    
    logger.info(f"Final dataset: {len(df)} records with {len(numeric_cols)} numeric features")
    
    return df, target_col, date_col, categorical_cols, numeric_cols


async def train_models():
    """Train enhanced ensemble models with all features."""
    logger.info("="*60)
    logger.info("ENHANCED MODEL TRAINING WITH ATMOSPHERIC & FESTIVAL FEATURES")
    logger.info("="*60)
    
    # Load and prepare data
    df, target_col, date_col, categorical_cols, numeric_cols = await load_and_prepare_data()
    
    # Initialize preprocessor and trainer
    preprocessor = DataPreprocessor(scaler_type='standard')
    trainer = ModelTrainer(preprocessor=preprocessor)
    
    # Prepare training data
    logger.info("Preparing features with temporal, weather, and festival information...")
    X, y = preprocessor.prepare_training_data(
        df,
        target_col=target_col,
        date_col=date_col,
        categorical_cols=categorical_cols,
        numeric_cols=numeric_cols,
        handle_missing=True,
        handle_outliers_=True
    )
    
    logger.info(f"Training set: {X.shape[0]} samples, {X.shape[1]} features")
    logger.info(f"Target range: ₹{y.min():.2f} to ₹{y.max():.2f}")
    
    # Split data (80-20 split for time series)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    logger.info(f"Train: {len(X_train)} samples, Test: {len(X_test)} samples")
    
    # Train all models including SVM and GPR
    logger.info("\n" + "="*60)
    logger.info("TRAINING ENSEMBLE: RF, XGBoost, LightGBM, CatBoost, SVM, GPR")
    logger.info("="*60 + "\n")
    
    models_to_train = ['random_forest', 'xgboost', 'lightgbm', 'catboost', 'svm', 'gpr']
    
    results = trainer.train_all_models(
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        models_to_train=models_to_train
    )
    
    # Display results
    logger.info("\n" + "="*60)
    logger.info("MODEL PERFORMANCE SUMMARY")
    logger.info("="*60)
    
    for model_name, result in results.items():
        metrics = result['metrics']
        accuracy = metrics['accuracy']
        mape = metrics['mape']
        mae = metrics['mae']
        r2 = metrics['r2_score']
        
        logger.info(f"\n{model_name.upper()}")
        logger.info(f"  Accuracy: {accuracy:.2%}")
        logger.info(f"  R² Score: {r2:.4f}")
        logger.info(f"  MAPE: {mape:.4f}")
        logger.info(f"  MAE: ₹{mae:.2f}")
    
    # Calculate weighted ensemble performance
    logger.info("\n" + "="*60)
    logger.info("ENSEMBLE PERFORMANCE")
    logger.info("="*60)
    
    # Get predictions from all models
    all_predictions = []
    for model_name, result in results.items():
        model = result['model']
        pred = model.predict(X_test)
        all_predictions.append(pred)
    
    # Simple average ensemble
    ensemble_pred = np.mean(all_predictions, axis=0)
    
    from sklearn.metrics import r2_score, mean_absolute_error, mean_absolute_percentage_error
    
    ensemble_r2 = r2_score(y_test, ensemble_pred)
    ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
    ensemble_mape = mean_absolute_percentage_error(y_test, ensemble_pred)
    ensemble_accuracy = max(0, 1 - ensemble_mape)
    
    logger.info(f"\nENSEMBLE (AVERAGE)")
    logger.info(f"  Accuracy: {ensemble_accuracy:.2%}")
    logger.info(f"  R² Score: {ensemble_r2:.4f}")
    logger.info(f"  MAPE: {ensemble_mape:.4f}")
    logger.info(f"  MAE: ₹{ensemble_mae:.2f}")
    
    # Check if we reached target accuracy
    target_accuracy = 0.98
    if ensemble_accuracy >= target_accuracy:
        logger.success(f"\n✓ TARGET ACHIEVED: {ensemble_accuracy:.2%} accuracy (target: {target_accuracy:.0%})")
    else:
        logger.warning(f"\n⚠ Target not reached: {ensemble_accuracy:.2%} accuracy (target: {target_accuracy:.0%})")
        logger.info(f"  Gap: {(target_accuracy - ensemble_accuracy) * 100:.2f} percentage points")
    
    # Save models
    logger.info("\n" + "="*60)
    logger.info("SAVING MODELS")
    logger.info("="*60)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save individual models
    saved_paths = trainer.save_all_models(version=timestamp)
    for model_name, path in saved_paths.items():
        logger.info(f"Saved {model_name}: {path}")
    
    # Save preprocessor
    preprocessor_path = trainer.save_preprocessor(version=timestamp)
    logger.info(f"Saved preprocessor: {preprocessor_path}")
    
    # Save ensemble
    ensemble_data = {
        'models': trainer.models,
        'preprocessor': preprocessor,
        'model_weights': {name: 1.0/len(results) for name in results.keys()},
        'metrics': {name: result['metrics'] for name, result in results.items()},
        'ensemble_metrics': {
            'accuracy': float(ensemble_accuracy),
            'r2_score': float(ensemble_r2),
            'mae': float(ensemble_mae),
            'mape': float(ensemble_mape)
        },
        'timestamp': timestamp,
        'feature_names': preprocessor.feature_names,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
    }
    
    ensemble_path = Path(settings.model_dir) / f"ensemble_tuned_{timestamp}.joblib"
    joblib.dump(ensemble_data, ensemble_path)
    logger.info(f"Saved ensemble: {ensemble_path}")
    
    # Summary
    logger.info("\n" + "="*60)
    logger.info("TRAINING COMPLETE")
    logger.info("="*60)
    logger.info(f"Models trained: {len(results)}")
    logger.info(f"Features: {X.shape[1]}")
    logger.info(f"Training samples: {len(X_train)}")
    logger.info(f"Test samples: {len(X_test)}")
    logger.info(f"Best individual accuracy: {max([r['metrics']['accuracy'] for r in results.values()]):.2%}")
    logger.info(f"Ensemble accuracy: {ensemble_accuracy:.2%}")
    logger.info(f"Target accuracy: {target_accuracy:.0%}")
    logger.info(f"Status: {'✓ ACHIEVED' if ensemble_accuracy >= target_accuracy else '⚠ IN PROGRESS'}")
    
    return ensemble_data


if __name__ == "__main__":
    asyncio.run(train_models())
