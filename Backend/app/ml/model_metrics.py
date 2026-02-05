
from typing import Dict, Optional, Tuple
import numpy as np
from loguru import logger
from datetime import datetime

from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    mean_absolute_percentage_error,
)

class ModelMetricsCalculator:

    @staticmethod
    def calculate_metrics(
        y_true: np.ndarray, y_pred: np.ndarray, model_name: str = "ensemble"
    ) -> Dict[str, float]:

        y_true = np.asarray(y_true)
        y_pred = np.asarray(y_pred)

        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        r2 = r2_score(y_true, y_pred)
        mape = mean_absolute_percentage_error(y_true, y_pred)

        mean_y = np.mean(y_true)
        rmse_pct = (rmse / (abs(mean_y) + 1e-6)) * 100
        accuracy = max(0, 1 - mape)

        if len(y_true) > 1:
            y_true_diff = np.diff(y_true)
            y_pred_diff = np.diff(y_pred)
            correct_direction = np.sum(np.sign(y_true_diff) == np.sign(y_pred_diff))
            directional_accuracy = correct_direction / len(y_true_diff)
        else:
            directional_accuracy = 0.0

        median_ae = np.median(np.abs(y_true - y_pred))

        ape = np.abs((y_true - y_pred) / (np.abs(y_true) + 1e-6))
        median_ape = np.median(ape)

        metrics = {
            'rmse': float(rmse),
            'mae': float(mae),
            'mse': float(mse),
            'r2_score': float(r2),
            'mape': float(mape),
            'rmse_pct': float(rmse_pct),
            'accuracy': float(accuracy),
            'median_ae': float(median_ae),
            'median_ape': float(median_ape),
            'directional_accuracy': float(directional_accuracy),
        }

        logger.info(
            f"{model_name} Metrics - "
            f"R²: {r2:.4f}, RMSE: {rmse:.4f}, MAE: {mae:.4f}, "
            f"MAPE: {mape:.4f}, Accuracy: {accuracy:.4f}"
        )

        return metrics

    @staticmethod
    def calculate_confidence_metrics(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        confidence_intervals: np.ndarray,
    ) -> Dict[str, float]:

        within_ci = np.sum(
            (y_true >= confidence_intervals[:, 0])
            & (y_true <= confidence_intervals[:, 1])
        )
        coverage = within_ci / len(y_true)

        interval_widths = confidence_intervals[:, 1] - confidence_intervals[:, 0]
        mean_interval_width = np.mean(interval_widths)
        median_interval_width = np.median(interval_widths)

        sharpness = 1 / (mean_interval_width + 1e-6)

        metrics = {
            'coverage': float(coverage),
            'mean_interval_width': float(mean_interval_width),
            'median_interval_width': float(median_interval_width),
            'sharpness': float(sharpness),
        }

        logger.info(f"Confidence Metrics - Coverage: {coverage:.4f}, Sharpness: {sharpness:.4f}")

        return metrics

    @staticmethod
    def calculate_seasonal_metrics(
        y_true: np.ndarray, y_pred: np.ndarray, seasonal_periods: int = 12
    ) -> Dict[str, Dict[str, float]]:

        seasonal_metrics = {}

        for season in range(seasonal_periods):
            mask = np.arange(len(y_true)) % seasonal_periods == season
            y_true_season = y_true[mask]
            y_pred_season = y_pred[mask]

            if len(y_true_season) > 0:
                metrics = ModelMetricsCalculator.calculate_metrics(
                    y_true_season, y_pred_season, f"season_{season}"
                )
                seasonal_metrics[f'season_{season}'] = metrics

        return seasonal_metrics

    @staticmethod
    def calculate_percentile_metrics(
        y_true: np.ndarray, y_pred: np.ndarray, percentiles: list = None
    ) -> Dict[str, Dict[str, float]]:

        if percentiles is None:
            percentiles = [25, 50, 75]

        percentile_metrics = {}
        boundaries = [0] + percentiles + [100]

        for i in range(len(boundaries) - 1):
            lower = np.percentile(y_true, boundaries[i])
            upper = np.percentile(y_true, boundaries[i + 1])
            mask = (y_true >= lower) & (y_true <= upper)

            y_true_range = y_true[mask]
            y_pred_range = y_pred[mask]

            if len(y_true_range) > 0:
                metrics = ModelMetricsCalculator.calculate_metrics(
                    y_true_range, y_pred_range, f"percentile_{boundaries[i]}_to_{boundaries[i+1]}"
                )
                percentile_metrics[f'p{boundaries[i]}_p{boundaries[i + 1]}'] = metrics

        return percentile_metrics

    @staticmethod
    def compare_models(
        model_metrics: Dict[str, Dict[str, float]], metric_name: str = 'r2_score'
    ) -> Tuple[str, float]:

        best_model = None
        best_value = -float('inf') if metric_name != 'mape' else float('inf')

        for model_name, metrics in model_metrics.items():
            value = metrics.get(metric_name, 0)

            if metric_name in ['rmse', 'mae', 'mse', 'mape', 'rmse_pct']:
                is_better = value < best_value
            else:
                is_better = value > best_value

            if is_better:
                best_model = model_name
                best_value = value

        return best_model, best_value

    @staticmethod
    def calculate_prediction_error_distribution(
        y_true: np.ndarray, y_pred: np.ndarray
    ) -> Dict[str, float]:

        errors = y_true - y_pred
        abs_errors = np.abs(errors)
        pct_errors = 100 * (abs_errors / (np.abs(y_true) + 1e-6))

        distribution = {
            'error_mean': float(np.mean(errors)),
            'error_std': float(np.std(errors)),
            'error_min': float(np.min(errors)),
            'error_max': float(np.max(errors)),
            'error_median': float(np.median(errors)),
            'abs_error_mean': float(np.mean(abs_errors)),
            'abs_error_std': float(np.std(abs_errors)),
            'pct_error_mean': float(np.mean(pct_errors)),
            'pct_error_std': float(np.std(pct_errors)),
            'error_q25': float(np.percentile(errors, 25)),
            'error_q75': float(np.percentile(errors, 75)),
        }

        return distribution

    @staticmethod
    def calculate_ensemble_diversity(
        individual_predictions: list,
    ) -> Dict[str, float]:

        predictions_array = np.array(individual_predictions)
        
        diversity = {
            'mean_disagreement': float(np.mean(np.std(predictions_array, axis=0))),
            'max_disagreement': float(np.max(np.std(predictions_array, axis=0))),
            'min_disagreement': float(np.min(np.std(predictions_array, axis=0))),
            'correlation_matrix': float(np.mean(
                np.corrcoef(predictions_array)[
                    np.triu_indices_from(
                        np.corrcoef(predictions_array), k=1
                    )
                ]
            )),
        }

        return diversity
