from typing import Tuple, Dict, List, Optional, Any
from pathlib import Path
import numpy as np
import pandas as pd
from datetime import datetime
import joblib
from loguru import logger

from sklearn.model_selection import cross_val_score, GridSearchCV, TimeSeriesSplit
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, mean_absolute_percentage_error

import xgboost as xgb
import lightgbm as lgb

try:
    from catboost import CatBoostRegressor
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False

from app.config import settings
from app.ml.preprocessor import DataPreprocessor

class ModelTrainer:

    def __init__(self, preprocessor: DataPreprocessor = None):
        self.preprocessor = preprocessor or DataPreprocessor()
        self.models: Dict[str, Any] = {}
        self.metrics: Dict[str, Dict[str, float]] = {}
        self.model_dir = Path(settings.model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Model trainer ready to build prediction models at {self.model_dir}")

    def train_xgboost(
        self, X_train: np.ndarray, y_train: np.ndarray, cv_splits: int = 5
    ) -> xgb.XGBRegressor:
        
        logger.info("Building XGBoost model with gradient boosting")

        xgb_model = xgb.XGBRegressor(
            n_estimators=400,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_alpha=0.2,
            reg_lambda=1.2,
            random_state=42,
            n_jobs=-1,
            tree_method='hist',
        )

        param_grid = {
            'max_depth': [6, 8, 10],
            'learning_rate': [0.03, 0.05, 0.08],
            'n_estimators': [300, 500],
            'subsample': [0.8, 0.95],
            'colsample_bytree': [0.8, 1.0],
        }

        tscv = TimeSeriesSplit(n_splits=cv_splits)
        grid_search = GridSearchCV(
            xgb_model,
            param_grid,
            cv=tscv,
            scoring='r2',
            n_jobs=-1,
            verbose=1,
        )

        grid_search.fit(X_train, y_train)
        logger.info(
            f"XGBoost trained successfully with accuracy {grid_search.best_score_:.2%}"
        )

        self.models['xgboost'] = grid_search.best_estimator_
        return grid_search.best_estimator_

    def train_lightgbm(
        self, X_train: np.ndarray, y_train: np.ndarray, cv_splits: int = 5
    ) -> lgb.LGBMRegressor:
        
        logger.info("Building LightGBM model for fast predictions")

        lgb_model = lgb.LGBMRegressor(
            n_estimators=400,
            max_depth=6,
            learning_rate=0.05,
            num_leaves=31,
            subsample=0.9,
            colsample_bytree=0.9,
            reg_alpha=0.1,
            reg_lambda=1.2,
            min_child_samples=10,
            random_state=42,
            n_jobs=-1,
        )

        param_grid = {
            'max_depth': [4, 6, 8],
            'learning_rate': [0.03, 0.05, 0.08],
            'n_estimators': [300, 500],
            'num_leaves': [15, 31, 63],
            'subsample': [0.8, 0.95],
            'colsample_bytree': [0.8, 1.0],
            'min_child_samples': [5, 10, 20],
        }

        tscv = TimeSeriesSplit(n_splits=cv_splits)
        grid_search = GridSearchCV(
            lgb_model,
            param_grid,
            cv=tscv,
            scoring='r2',
            n_jobs=-1,
            verbose=1,
        )

        grid_search.fit(X_train, y_train)
        logger.info(
            f"LightGBM model ready with {grid_search.best_score_:.2%} validation accuracy"
        )

        self.models['lightgbm'] = grid_search.best_estimator_
        return grid_search.best_estimator_

    def train_catboost(
        self, X_train: np.ndarray, y_train: np.ndarray, cv_splits: int = 5
    ) -> Optional[Any]:
        
        if not HAS_CATBOOST:
            logger.warning("CatBoost library not installed, skipping this model")
            return None

        logger.info("Building CatBoost model for robust predictions")

        catboost_model = CatBoostRegressor(
            iterations=400,
            depth=8,
            learning_rate=0.05,
            subsample=0.9,
            random_state=42,
            verbose=False,
            thread_count=-1,
        )

        param_grid = {
            'depth': [6, 8, 10],
            'learning_rate': [0.03, 0.05, 0.08],
            'iterations': [300, 600],
        }

        tscv = TimeSeriesSplit(n_splits=cv_splits)
        grid_search = GridSearchCV(
            catboost_model,
            param_grid,
            cv=tscv,
            scoring='r2',
            n_jobs=-1,
            verbose=1,
        )

        grid_search.fit(X_train, y_train)
        logger.info(
            f"CatBoost model achieved {grid_search.best_score_:.2%} accuracy on validation"
        )

        self.models['catboost'] = grid_search.best_estimator_
        return grid_search.best_estimator_

    def train_random_forest(
        self, X_train: np.ndarray, y_train: np.ndarray, cv_splits: int = 5
    ) -> RandomForestRegressor:
        
        logger.info("Building Random Forest ensemble with decision trees")

        rf_model = RandomForestRegressor(
            n_estimators=400,
            max_depth=18,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
        )

        param_grid = {
            'max_depth': [12, 18, 24],
            'n_estimators': [300, 500],
            'min_samples_split': [2, 4],
            'min_samples_leaf': [1, 2],
        }

        tscv = TimeSeriesSplit(n_splits=cv_splits)
        grid_search = GridSearchCV(
            rf_model,
            param_grid,
            cv=tscv,
            scoring='r2',
            n_jobs=-1,
            verbose=1,
        )

        grid_search.fit(X_train, y_train)
        logger.info(
            f"Random Forest model trained with {grid_search.best_score_:.2%} prediction accuracy"
        )

        self.models['random_forest'] = grid_search.best_estimator_
        return grid_search.best_estimator_

    def evaluate_model(
        self, model: Any, X_test: np.ndarray, y_test: np.ndarray, model_name: str
    ) -> Dict[str, float]:
        
        y_pred = model.predict(X_test)

        metrics = {
            'r2_score': float(r2_score(y_test, y_pred)),
            'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
            'mae': float(mean_absolute_error(y_test, y_pred)),
            'mape': float(mean_absolute_percentage_error(y_test, y_pred)),
        }

        mean_y = np.mean(y_test)
        if mean_y > 0:
            metrics['rmse_pct'] = float((metrics['rmse'] / mean_y) * 100)

        metrics['accuracy'] = float(max(0, 1 - metrics['mape']))

        self.metrics[model_name] = metrics

        logger.info(
            f"{model_name} performs with {metrics['accuracy']:.1%} accuracy and ₹{metrics['mae']:.0f} average error. "
            f"MAPE: {metrics['mape']:.4f}"
        )

        return metrics

    def get_feature_importance(self, model: Any, model_name: str) -> Dict[str, float]:

        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        else:
            logger.warning(f"Model {model_name} doesn't support feature importance")
            return {}

        importance_dict = {}
        total_importance = np.sum(importances)

        if total_importance > 0:
            for feature, importance in zip(self.preprocessor.feature_names, importances):
                importance_dict[feature] = float(importance / total_importance)
        else:
            equal_importance = 1.0 / len(self.preprocessor.feature_names)
            importance_dict = {
                feature: equal_importance
                for feature in self.preprocessor.feature_names
            }

        return importance_dict

    def train_all_models(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_test: np.ndarray = None,
        y_test: np.ndarray = None,
        models_to_train: List[str] = None,
    ) -> Dict[str, Any]:
        
        if X_test is None or y_test is None:
            from sklearn.model_selection import train_test_split
            X_train, X_test, y_train, y_test = train_test_split(
                X_train, y_train, test_size=0.2, random_state=42
            )

        if models_to_train is None:
            models_to_train = ['xgboost', 'lightgbm', 'catboost', 'random_forest']

        results = {}

        for model_name in models_to_train:
            logger.info(f"Starting {model_name} model training")

            if model_name == 'xgboost':
                model = self.train_xgboost(X_train, y_train)
            elif model_name == 'lightgbm':
                model = self.train_lightgbm(X_train, y_train)
            elif model_name == 'catboost':
                model = self.train_catboost(X_train, y_train)
            elif model_name == 'random_forest':
                model = self.train_random_forest(X_train, y_train)
            else:
                logger.warning(f"Unknown model: {model_name}")
                continue

            metrics = self.evaluate_model(model, X_test, y_test, model_name)
            
            importance = self.get_feature_importance(model, model_name)

            results[model_name] = {
                'model': model,
                'metrics': metrics,
                'feature_importance': importance,
            }

        logger.info(f"All {len(results)} ensemble models trained and ready for predictions")

        return results

    def save_model(self, model: Any, model_name: str, version: str = None) -> str:
        
        if version is None:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")

        model_path = self.model_dir / f"{model_name}_{version}.joblib"
        joblib.dump(model, model_path)

        logger.info(f"Saved {model_name} model successfully")
        return str(model_path)

    def save_all_models(self, version: str = None) -> Dict[str, str]:
        
        saved_paths = {}

        for model_name, model in self.models.items():
            path = self.save_model(model, model_name, version)
            saved_paths[model_name] = path

        logger.info(f"All {len(saved_paths)} models saved and ready for deployment")
        return saved_paths

    def save_preprocessor(self, version: str = None) -> str:
        
        if version is None:
            version = datetime.now().strftime("%Y%m%d_%H%M%S")

        preprocessor_path = self.model_dir / f"preprocessor_{version}.joblib"
        joblib.dump(self.preprocessor, preprocessor_path)

        logger.info(f"Preprocessor saved successfully")
        return str(preprocessor_path)

    def load_model(self, model_path: str) -> Any:
        
        model = joblib.load(model_path)
        logger.info(f"Model loaded from storage")
        return model

    def get_model_summary(self) -> Dict[str, Dict[str, Any]]:

        summary = {}

        for model_name in self.models.keys():
            summary[model_name] = {
                'metrics': self.metrics.get(model_name, {}),
                'feature_importance': self.get_feature_importance(
                    self.models[model_name], model_name
                ),
            }

        return summary
