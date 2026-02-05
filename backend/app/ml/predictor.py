
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from loguru import logger
from datetime import datetime

from app.ml.preprocessor import DataPreprocessor
from app.ml.ensemble import EnsembleManager
from app.ml.model_metrics import ModelMetricsCalculator
from app.config import settings

class AgriculturalPredictor:

    def __init__(
        self,
        preprocessor: Optional[DataPreprocessor] = None,
        ensemble: Optional[EnsembleManager] = None,
        metrics_calculator: Optional[ModelMetricsCalculator] = None,
    ):
        self.preprocessor = preprocessor or DataPreprocessor()
        self.ensemble = ensemble or EnsembleManager()
        self.metrics_calculator = metrics_calculator or ModelMetricsCalculator()
        self.prediction_history: List[Dict[str, Any]] = []

        logger.info("Price prediction system ready with ensemble models")

    def load_models(self, model_paths: Dict[str, str], preprocessor_path: str = None) -> None:
        
        self.ensemble.load_models(model_paths, preprocessor_path)
        if preprocessor_path:
            import joblib
            self.preprocessor = joblib.load(preprocessor_path)

    def load_latest_models(self) -> None:
        self.ensemble.load_latest_models()

    def prepare_prediction_input(
        self,
        data: pd.DataFrame,
        date_col: str,
        categorical_cols: List[str] = None,
    ) -> np.ndarray:
        
        features = self.preprocessor.prepare_prediction_data(
            data, date_col, categorical_cols
        )
        return features

    def predict(
        self,
        features: np.ndarray,
        include_individual: bool = True,
        include_confidence: bool = True,
    ) -> Dict[str, Any]:

        start_time = datetime.now()

        self.ensemble.refresh_if_newer()

        if include_confidence:
            ensemble_pred, confidence, individual_preds = (
                self.ensemble.predict_with_confidence(features)
            )
            lower_bound, upper_bound = self.ensemble.calculate_prediction_bounds(
                ensemble_pred, confidence, individual_preds
            )
        else:
            ensemble_pred, individual_preds, weights = self.ensemble.predict_weighted_average(
                features
            )
            confidence = None
            lower_bound, upper_bound = None, None

        feature_importance = self.preprocessor.get_feature_importance_baseline(
            features.reshape(1, -1)
        )

        model_importances = {}
        for model_name, model in self.ensemble.models.items():
            importance = self._get_model_feature_importance(model, model_name)
            model_importances[model_name] = importance

        combined_importance = self.ensemble.get_feature_importance_combined(
            model_importances
        )

        prediction_time = (datetime.now() - start_time).total_seconds()

        result = {
            'prediction': float(ensemble_pred),
            'confidence': float(confidence) if confidence is not None else None,
            'lower_bound': float(lower_bound) if lower_bound is not None else None,
            'upper_bound': float(upper_bound) if upper_bound is not None else None,
            'processing_time_seconds': prediction_time,
            'timestamp': datetime.now().isoformat(),
        }

        if include_individual:
            result['individual_predictions'] = individual_preds

        top_features = sorted(
            combined_importance.items(), key=lambda x: x[1], reverse=True
        )[:5]
        result['top_features'] = {name: float(imp) for name, imp in top_features}

        self.prediction_history.append(result)

        return result

    def batch_predict(
        self,
        features_list: np.ndarray,
        include_individual: bool = False,
    ) -> List[Dict[str, Any]]:

        start_time = datetime.now()

        ensemble_preds, individual_preds_list, confidences = self.ensemble.batch_predict(
            features_list
        )

        predictions = []

        for i, (pred, conf, individual_preds) in enumerate(
            zip(ensemble_preds, confidences, individual_preds_list)
        ):
            lower_bound, upper_bound = self.ensemble.calculate_prediction_bounds(
                float(pred), float(conf), individual_preds
            )

            result = {
                'sample_id': i,
                'prediction': float(pred),
                'confidence': float(conf),
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound),
                'timestamp': datetime.now().isoformat(),
            }

            if include_individual:
                result['individual_predictions'] = individual_preds

            predictions.append(result)

        batch_time = (datetime.now() - start_time).total_seconds()
        logger.info(
            f"Batch prediction complete: {len(predictions)} samples in {batch_time:.4f}s"
        )

        return predictions

    def evaluate_predictions(
        self, y_true: np.ndarray, y_pred: np.ndarray
    ) -> Dict[str, float]:

        metrics = self.metrics_calculator.calculate_metrics(y_true, y_pred)
        return metrics

    def _get_model_feature_importance(self, model: Any, model_name: str) -> Dict[str, float]:

        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            total = np.sum(importances)

            if total > 0:
                return {
                    name: float(imp / total)
                    for name, imp in zip(self.preprocessor.feature_names, importances)
                }

        return {name: 1.0 / len(self.preprocessor.feature_names)
                for name in self.preprocessor.feature_names}

    def get_prediction_statistics(self) -> Dict[str, Any]:

        if not self.prediction_history:
            return {'total_predictions': 0}

        predictions = [p['prediction'] for p in self.prediction_history]
        confidences = [p.get('confidence', 0) for p in self.prediction_history if p.get('confidence')]

        stats = {
            'total_predictions': len(self.prediction_history),
            'mean_prediction': float(np.mean(predictions)),
            'std_prediction': float(np.std(predictions)),
            'min_prediction': float(np.min(predictions)),
            'max_prediction': float(np.max(predictions)),
            'mean_confidence': float(np.mean(confidences)) if confidences else None,
            'mean_processing_time': float(
                np.mean([p['processing_time_seconds'] for p in self.prediction_history])
            ),
        }

        return stats

    def clear_history(self) -> None:

        self.prediction_history = []
        logger.info("Cleared prediction history")

    def get_ensemble_status(self) -> Dict[str, Any]:

        return self.ensemble.get_ensemble_status()
