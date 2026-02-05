
import argparse
import sys
from pathlib import Path
from typing import Tuple, Dict, Any
from datetime import datetime
from loguru import logger
import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.database.connection import init_sync_db, get_sync_session
from app.database.models import Commodity, Market, MarketPrice
from app.database.repositories import (
    MarketPriceRepository,
    PredictionMetricsRepository,
)
from app.ml.preprocessor import DataPreprocessor
from app.ml.trainer import ModelTrainer
from app.ml.ensemble import EnsembleManager
from app.ml.predictor import AgriculturalPredictor

def load_training_data(
    commodity_id: int = None,
    market_id: int = None,
    days: int = 365,
    preprocessor: DataPreprocessor | None = None,
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame, DataPreprocessor]:

    logger.info(f"Loading training data (last {days} days)...")

    # Try loading from database
    init_sync_db()
    session = next(get_sync_session())
    try:
        query = session.query(MarketPrice)
        if commodity_id:
            query = query.filter(MarketPrice.commodity_id == commodity_id)
        if market_id:
            query = query.filter(MarketPrice.market_id == market_id)
        from datetime import datetime, timedelta
        start_date = datetime.now().date() - timedelta(days=days)
        query = query.filter(MarketPrice.date >= start_date)
        prices = query.order_by(MarketPrice.date).all()
        logger.info(f"Loaded {len(prices)} price records")
        data_list = []
        for price in prices:
            data_list.append({
                'date': price.date,
                'commodity_id': price.commodity_id,
                'market_id': price.market_id,
                'price': price.price,
                'min_price': price.min_price,
                'max_price': price.max_price,
                'modal_price': price.modal_price,
                'arrival': price.arrival or 0,
            })
        df = pd.DataFrame(data_list)
        if len(df) == 0:
            # Fallback: load from data/raw JSON
            logger.warning("No training data in DB, loading from raw data folder...")
            data_dir = Path(__file__).parent.parent / 'data' / 'raw'
            price_files = [f for f in data_dir.glob("market_prices_*.json") if 'truncated' not in f.name]
            if not price_files:
                logger.error(f"No data files found in {data_dir}")
                return None, None, None, None
            latest_file = max(price_files, key=lambda p: p.stat().st_mtime)
            logger.info(f"Loading data from {latest_file}")
            import json
            with open(latest_file, 'r') as f:
                data = json.load(f)
            if isinstance(data, list):
                prices = data
            else:
                prices = data.get('prices', data)
            df = pd.DataFrame(prices)
            logger.info(f"Loaded {len(df)} records from raw data")
            # Add factorized columns if missing
            if 'commodity_id' not in df.columns and 'commodity' in df.columns:
                df['commodity_id'] = pd.factorize(df['commodity'])[0]
            if 'market_id' not in df.columns and 'market' in df.columns:
                df['market_id'] = pd.factorize(df['market'])[0]
        preprocessor = preprocessor or DataPreprocessor()
        features, target = preprocessor.prepare_training_data(
            df,
            target_col='price',
            date_col='date',
            numeric_cols=['min_price', 'max_price', 'modal_price', 'arrival', 'commodity_id', 'market_id'],
        )
        return features, target, df, preprocessor
    finally:
        session.close()

def compute_weights_by_rmse(metrics_map: Dict[str, Dict[str, float]]) -> Dict[str, float]:

    inv = {}
    for name, m in metrics_map.items():
        rmse = m.get('rmse') or m.get('rmse_pct')
        if rmse and rmse > 0:
            inv[name] = 1.0 / rmse
    total = sum(inv.values())
    if total <= 0:
        return {k: 1.0 / max(len(metrics_map), 1) for k in metrics_map.keys()}
    return {k: v / total for k, v in inv.items()}

def train_models(
    commodity_id: int = None,
    market_id: int = None,
    models: list = None,
    test_size: float = 0.2,
    retrain: bool = False,
    save_tuned_ensemble: bool = False,
) -> Dict[str, Any]:

    if models is None:
        models = ['xgboost', 'lightgbm', 'catboost', 'random_forest', 'svm']

    preprocessor = DataPreprocessor()
    X, y, df, preprocessor = load_training_data(commodity_id, market_id, preprocessor=preprocessor)

    if X is None:
        logger.error("Failed to load training data")
        return None


    logger.info(f"Training data shape: {X.shape}")

    # --- Data Diagnostics ---
    df_X = pd.DataFrame(X, columns=preprocessor.feature_names if hasattr(preprocessor, 'feature_names') else None)
    logger.info("Data diagnostics before training:")
    for col in df_X.columns:
        nunique = pd.Series(df_X[col]).nunique(dropna=False)
        n_missing = pd.Series(df_X[col]).isna().sum()
        logger.info(f"Feature '{col}': unique={nunique}, missing={n_missing}")
        if nunique == 1:
            logger.warning(f"Feature '{col}' is constant (only one unique value). This may cause model warnings.")
    y_unique = pd.Series(y).nunique(dropna=False)
    y_missing = pd.Series(y).isna().sum()
    logger.info(f"Target: unique={y_unique}, missing={y_missing}")
    if y_unique == 1:
        logger.warning("Target variable is constant (only one unique value). Model training will not work.")
    if y_missing > 0:
        logger.warning(f"Target variable has {y_missing} missing values.")

    split_idx = int(len(X) * (1 - test_size))
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    logger.info(
        f"Train set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples"
    )

    trainer = ModelTrainer(preprocessor)

    results = trainer.train_all_models(
        X_train, y_train, X_test, y_test, models_to_train=models
    )

    version = None
    saved_paths = trainer.save_all_models(version)
    preprocessor_path = trainer.save_preprocessor(version)

    logger.info(f"Saved {len(saved_paths)} models")
    logger.info(f"Saved preprocessor to {preprocessor_path}")

    tuned_path = None
    if save_tuned_ensemble:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        metrics_map = {k: v['metrics'] for k, v in results.items() if 'metrics' in v}
        weights = compute_weights_by_rmse(metrics_map)
        best_name = min(metrics_map.keys(), key=lambda k: metrics_map[k]['rmse']) if metrics_map else None
        best_model = trainer.models.get(best_name) if best_name else None
        tuned_bundle = {
            **{name: model for name, model in trainer.models.items()},
            "best_model": best_model,
            "best_model_name": best_name,
            "features": preprocessor.feature_names,
            "feature_count": len(preprocessor.feature_names),
            "timestamp": timestamp,
            "model_weights": weights,
            "trained_on": timestamp,
            "training_samples": int(len(X_train)),
            "metrics": metrics_map,
        }
        tuned_path = Path(settings.model_dir) / f"ensemble_tuned_{timestamp}.joblib"
        joblib.dump(tuned_bundle, tuned_path)
        logger.info(f"Saved tuned ensemble artifact to {tuned_path}")

    return {
        'results': results,
        'saved_paths': saved_paths,
        'preprocessor_path': preprocessor_path,
        'metrics': trainer.metrics,
        'tuned_ensemble_path': str(tuned_path) if tuned_path else None,
    }

def evaluate_predictions(
    commodity_id: int = None, market_id: int = None, days: int = 30
) -> Dict[str, Any]:

    logger.info("Evaluating predictions...")

    predictor = AgriculturalPredictor()
    predictor.load_latest_models()

    if not predictor.ensemble.models:
        logger.error("No trained models found")
        return None

    X, y, df = load_training_data(commodity_id, market_id, days=days)

    if X is None:
        logger.error("Failed to load evaluation data")
        return None

    predictions_result = predictor.batch_predict(X, include_individual=True)

    y_pred = np.array([p['prediction'] for p in predictions_result])
    metrics = predictor.evaluate_predictions(y, y_pred)

    logger.info(f"Evaluation metrics: {metrics}")

    return {
        'metrics': metrics,
        'predictions': predictions_result,
        'num_samples': len(y),
    }

def main():

    parser = argparse.ArgumentParser(description="Train ML models for agricultural price prediction")

    parser.add_argument(
        '--action',
        choices=['train', 'evaluate', 'predict'],
        default='train',
        help='Action to perform',
    )
    parser.add_argument('--model', help='Specific model to train (xgboost, lightgbm, catboost, random_forest, svm, gpr)')
    parser.add_argument('--commodity', type=int, help='Commodity ID to train on')
    parser.add_argument('--market', type=int, help='Market ID to train on')
    parser.add_argument('--days', type=int, default=365, help='Days of historical data to use')
    parser.add_argument('--test-size', type=float, default=0.2, help='Fraction of data for testing')
    parser.add_argument('--retrain', action='store_true', help='Retrain existing models')
    parser.add_argument('--save-ensemble', action='store_true', help='Save RMSE-weighted tuned ensemble artifact')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')

    args = parser.parse_args()

    if args.verbose:
        logger.enable('app')
    else:
        logger.disable('app')

    logger.info(f"Starting {args.action} action")
    logger.info(f"Settings: commodity={args.commodity}, market={args.market}, days={args.days}")

    try:
        if args.action == 'train':
            models = [args.model] if args.model else None
            result = train_models(
                commodity_id=args.commodity,
                market_id=args.market,
                models=models,
                test_size=args.test_size,
                retrain=args.retrain,
                save_tuned_ensemble=args.save_ensemble,
            )

            if result:
                logger.info("Training completed successfully")
                logger.info(f"Results: {result['metrics']}")
                print("\n Training completed successfully!")
                print(f"Saved models: {list(result['saved_paths'].keys())}")

        elif args.action == 'evaluate':
            result = evaluate_predictions(
                commodity_id=args.commodity, market_id=args.market, days=args.days
            )

            if result:
                logger.info("Evaluation completed successfully")
                print("\n Evaluation completed successfully!")
                print(f"Metrics: {result['metrics']}")

        elif args.action == 'predict':
            predictor = AgriculturalPredictor()
            predictor.load_latest_models()

            print("\n Predictor loaded successfully!")
            print(f"Ensemble status: {predictor.get_ensemble_status()}")

    except Exception as e:
        logger.error(f"Error during {args.action}: {e}", exc_info=True)
        print(f"\n Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
