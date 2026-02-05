
from typing import Dict, List, Tuple, Optional, Any
import numpy as np
import pandas as pd
from loguru import logger
from pathlib import Path
import joblib
import inspect

from app.config import settings

def _apply_sklearn_compat_shims() -> None:

    try:
        import sklearn.utils.validation as suv
        import sklearn.utils as su

        original_check_array = suv.check_array
        original_check_x_y = suv.check_X_y

        def check_array_compat(*args, force_all_finite=True, **kwargs):
            kwargs['ensure_all_finite'] = force_all_finite
            return original_check_array(*args, **kwargs)

        def check_x_y_compat(*args, force_all_finite=True, **kwargs):
            kwargs['ensure_all_finite'] = force_all_finite
            return original_check_x_y(*args, **kwargs)

        suv.check_array = check_array_compat
        su.check_array = check_array_compat
        suv.check_X_y = check_x_y_compat
        su.check_X_y = check_x_y_compat

        try:
            import lightgbm.sklearn as lgb_sklearn
            lgb_sklearn.check_array = check_array_compat
            lgb_sklearn.check_X_y = check_x_y_compat
        except Exception:
            pass

    except Exception as exc:
        logger.warning(f"Could not apply sklearn compatibility shim: {exc}")

_apply_sklearn_compat_shims()

class EnsembleManager:

    def __init__(self):

        _apply_sklearn_compat_shims()
        self.models: Dict[str, Any] = {}
        self.model_weights: Dict[str, float] = {}
        self.ensemble_type = 'weighted_average'
        self.preprocessor = None
        self.model_dir = Path(settings.model_dir)
        self.latest_artifact_mtime: Optional[float] = None
        self.latest_artifact_name: Optional[str] = None

        logger.info("Initialized EnsembleManager")

    def load_models(
        self, model_paths: Dict[str, str], preprocessor_path: str = None
    ) -> None:

        for model_name, path in model_paths.items():
            try:
                model = joblib.load(path)
                self.models[model_name] = model
                logger.info(f"Loaded model: {model_name} from {path}")
            except Exception as e:
                logger.error(f"Failed to load {model_name}: {e}")

        if preprocessor_path:
            try:
                self.preprocessor = joblib.load(preprocessor_path)
                logger.info(f"Loaded preprocessor from {preprocessor_path}")
            except Exception as e:
                logger.error(f"Failed to load preprocessor: {e}")

        logger.info(f"Loaded {len(self.models)} models for ensemble")

    def load_latest_models(self) -> None:

        if not self.model_dir.exists():
            logger.error(f"Model directory not found: {self.model_dir}")
            return

        tuned_files = list(self.model_dir.glob("ensemble_tuned_*.joblib"))
        loaded_from_ensemble = False
        if tuned_files:
            latest_tuned = max(tuned_files, key=lambda p: p.stat().st_mtime)
            try:
                ensemble_data = joblib.load(str(latest_tuned))
                if isinstance(ensemble_data, dict):
                    for model_name in ['random_forest', 'gradient_boosting', 'xgboost', 'lightgbm', 'catboost']:
                        if model_name in ensemble_data:
                            self.models[model_name] = ensemble_data[model_name]
                    self.artifact_info = ensemble_data
                    if 'model_weights' in ensemble_data and isinstance(ensemble_data['model_weights'], dict):
                        self.model_weights = ensemble_data['model_weights']
                    self.model_version = str(ensemble_data.get('timestamp', latest_tuned.stem))
                    self.latest_artifact_mtime = latest_tuned.stat().st_mtime
                    self.latest_artifact_name = latest_tuned.name
                    loaded_from_ensemble = True
                    logger.info(f"Loaded tuned ensemble: {latest_tuned.name} with {len(self.models)} models")
            except Exception as e:
                logger.error(f"Failed to load tuned ensemble: {e}")

        if not loaded_from_ensemble:
            ensemble_files = list(self.model_dir.glob("ensemble_*.joblib"))
            if ensemble_files:
                latest_ensemble = max(ensemble_files, key=lambda p: p.stat().st_mtime)
                try:
                    ensemble_data = joblib.load(str(latest_ensemble))
                    if isinstance(ensemble_data, dict):
                        for model_name in ['random_forest', 'gradient_boosting', 'xgboost', 'lightgbm', 'catboost']:
                            if model_name in ensemble_data:
                                self.models[model_name] = ensemble_data[model_name]
                        self.artifact_info = ensemble_data
                        if 'model_weights' in ensemble_data and isinstance(ensemble_data['model_weights'], dict):
                            self.model_weights = ensemble_data['model_weights']
                        self.model_version = str(ensemble_data.get('timestamp', latest_ensemble.stem))
                        self.latest_artifact_mtime = latest_ensemble.stat().st_mtime
                        self.latest_artifact_name = latest_ensemble.name
                        loaded_from_ensemble = True
                        logger.info(f"Loaded ensemble: {latest_ensemble.name} with {len(self.models)} models")
                except Exception as e:
                    logger.error(f"Failed to load ensemble: {e}")

        if not self.models:
            model_types = ['random_forest', 'gradient_boosting', 'xgboost', 'lightgbm', 'catboost']
            model_paths = {}

            for model_type in model_types:
                pattern = f"{model_type}_*.joblib"
                matching_files = list(self.model_dir.glob(pattern))

                if matching_files:
                    latest_model = max(matching_files, key=lambda p: p.stat().st_mtime)
                    model_paths[model_type] = str(latest_model)

            if model_paths:
                for model_name, path in model_paths.items():
                    try:
                        model = joblib.load(path)
                        self.models[model_name] = model
                        logger.info(f"Loaded model: {model_name} from {path}")
                    except Exception as e:
                        logger.error(f"Failed to load {model_name}: {e}")

        preprocessor_files = list(self.model_dir.glob("preprocessor_*.joblib"))
        preprocessor_path = None
        if preprocessor_files:
            preprocessor_path = str(max(preprocessor_files, key=lambda p: p.stat().st_mtime))
            try:
                preprocessor_data = joblib.load(preprocessor_path)
                if isinstance(preprocessor_data, dict):
                    self.preprocessor = preprocessor_data.get('preprocessor', preprocessor_data)
                    self.feature_cols = preprocessor_data.get('feature_cols', None)
                    # Set feature names on the preprocessor object
                    if self.preprocessor and hasattr(self.preprocessor, 'feature_names'):
                        feature_names = preprocessor_data.get('feature_names', preprocessor_data.get('feature_cols', []))
                        if feature_names:
                            self.preprocessor.feature_names = feature_names
                            self.preprocessor.numeric_features = preprocessor_data.get('numeric_features', feature_names)
                            self.preprocessor.categorical_features = preprocessor_data.get('categorical_features', [])
                else:
                    self.preprocessor = preprocessor_data
                logger.info(f"Loaded preprocessor from {preprocessor_path}")
            except Exception as e:
                logger.error(f"Failed to load preprocessor: {e}")

        if self.models:
            if not self.model_weights:
                self.set_equal_weights()
            logger.info(f"Loaded {len(self.models)} models for ensemble")
        else:
            logger.warning("No trained models found in model directory")

    def set_model_weights(self, weights: Dict[str, float]) -> None:

        total_weight = sum(weights.values())
        self.model_weights = {
            model: weight / total_weight for model, weight in weights.items()
        }

        logger.info(f"Set ensemble weights: {self.model_weights}")

    def _get_latest_ensemble_file(self) -> Optional[Path]:

        tuned_files = list(self.model_dir.glob("ensemble_tuned_*.joblib"))
        if tuned_files:
            return max(tuned_files, key=lambda p: p.stat().st_mtime)

        ensemble_files = list(self.model_dir.glob("ensemble_*.joblib"))
        if ensemble_files:
            return max(ensemble_files, key=lambda p: p.stat().st_mtime)

        return None

    def refresh_if_newer(self) -> None:

        if not self.model_dir.exists():
            return

        latest_file = self._get_latest_ensemble_file()
        if not latest_file:
            return

        latest_mtime = latest_file.stat().st_mtime
        if self.latest_artifact_mtime is None or latest_mtime > self.latest_artifact_mtime:
            logger.info(f"Detected newer ensemble artifact: {latest_file.name}; reloading")
            self.load_latest_models()

    def set_equal_weights(self) -> None:

        equal_weight = 1.0 / len(self.models) if self.models else 0

        self.model_weights = {model_name: equal_weight for model_name in self.models.keys()}

        logger.info(f"Set equal ensemble weights: {self.model_weights}")

    def set_accuracy_based_weights(self, metrics: Dict[str, Dict[str, float]]) -> None:

        weights = {}

        for model_name, model_metrics in metrics.items():
            accuracy = model_metrics.get('accuracy', 0.5)
            weights[model_name] = accuracy

        self.set_model_weights(weights)
        logger.info("Set accuracy-based ensemble weights")

    def predict_weighted_average(
        self, features: np.ndarray
    ) -> Tuple[float, Dict[str, float], Dict[str, float]]:

        if not self.models:
            raise ValueError("No models loaded in ensemble")

        if len(self.model_weights) == 0:
            self.set_equal_weights()

        individual_predictions = {}
        weighted_sum = 0

        for model_name, model in self.models.items():
            try:
                if features.ndim == 1:
                    prediction = model.predict(features.reshape(1, -1))[0]
                else:
                    prediction = model.predict(features)

                individual_predictions[model_name] = float(prediction)

                weight = self.model_weights.get(model_name, 0)
                weighted_sum += prediction * weight

            except Exception as e:
                logger.error(f"Error getting prediction from {model_name}: {e}")
                individual_predictions[model_name] = None

        ensemble_prediction = weighted_sum

        return ensemble_prediction, individual_predictions, self.model_weights

    def predict_voting(
        self, features: np.ndarray
    ) -> Tuple[float, Dict[str, float], float]:

        predictions = []
        individual_predictions = {}

        for model_name, model in self.models.items():
            try:
                if features.ndim == 1:
                    prediction = model.predict(features.reshape(1, -1))[0]
                else:
                    prediction = model.predict(features)

                individual_predictions[model_name] = float(prediction)
                predictions.append(float(prediction))

            except Exception as e:
                logger.error(f"Error getting prediction from {model_name}: {e}")

        if not predictions:
            raise ValueError("No valid predictions from ensemble models")

        ensemble_prediction = np.mean(predictions)
        variance = float(np.var(predictions))

        return ensemble_prediction, individual_predictions, variance

    def predict_with_confidence(
        self, features: np.ndarray
    ) -> Tuple[float, float, Dict[str, float]]:

        predictions = []
        individual_predictions = {}

        for model_name, model in self.models.items():
            try:
                if features.ndim == 1:
                    prediction = model.predict(features.reshape(1, -1))[0]
                else:
                    pred_result = model.predict(features)
                    prediction = float(pred_result[0]) if isinstance(pred_result, np.ndarray) else float(pred_result)

                individual_predictions[model_name] = float(prediction)
                predictions.append(float(prediction))

            except Exception as e:
                logger.error(f"Error getting prediction from {model_name}: {e}")

        if not predictions:
            raise ValueError("No valid predictions from ensemble models")

        ensemble_prediction = np.mean(predictions)
        std_prediction = np.std(predictions)

        cv = std_prediction / (abs(ensemble_prediction) + 1e-6) if ensemble_prediction != 0 else 0
        confidence = 1 / (1 + cv) if (1 + cv) != 0 else 0.85

        return ensemble_prediction, confidence, individual_predictions

    def get_feature_importance_combined(
        self, model_importances: Dict[str, Dict[str, float]]
    ) -> Dict[str, float]:

        if not model_importances:
            logger.warning("No model importances provided")
            return {}

        all_features = set()
        for importance_dict in model_importances.values():
            all_features.update(importance_dict.keys())

        combined_importance = {}

        for feature in all_features:
            importances = []

            for model_name, importance_dict in model_importances.items():
                if feature in importance_dict:
                    weight = self.model_weights.get(model_name, 1.0 / len(self.models))
                    importances.append(importance_dict[feature] * weight)

            if importances:
                combined_importance[feature] = np.mean(importances)

        total = sum(combined_importance.values())
        if total > 0:
            combined_importance = {
                k: v / total for k, v in combined_importance.items()
            }

        return combined_importance

    def batch_predict(
        self, features_list: np.ndarray
    ) -> Tuple[np.ndarray, List[Dict[str, float]], np.ndarray]:

        ensemble_predictions = []
        individual_predictions_list = []
        confidences = []

        for features in features_list:
            prediction, confidence, individual = self.predict_with_confidence(features)
            ensemble_predictions.append(prediction)
            individual_predictions_list.append(individual)
            confidences.append(confidence)

        return (
            np.array(ensemble_predictions),
            individual_predictions_list,
            np.array(confidences),
        )

    def calculate_prediction_bounds(
        self,
        ensemble_prediction: float,
        confidence: float,
        individual_predictions: Dict[str, float],
        confidence_level: float = 0.95,
    ) -> Tuple[float, float]:

        predictions = [p for p in individual_predictions.values() if p is not None]

        if not predictions:
            margin = abs(ensemble_prediction) * 0.1
            return ensemble_prediction - margin, ensemble_prediction + margin

        std_prediction = np.std(predictions)
        
        margin = std_prediction * (2 - confidence) * 1.96

        lower_bound = ensemble_prediction - margin
        upper_bound = ensemble_prediction + margin

        return lower_bound, upper_bound

    def get_ensemble_status(self) -> Dict[str, Any]:

        status = {
            'num_models': len(self.models),
            'model_names': list(self.models.keys()),
            'ensemble_type': self.ensemble_type,
            'model_weights': self.model_weights,
            'preprocessor_loaded': self.preprocessor is not None,
        }

        return status
