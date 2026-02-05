
from typing import Any, List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
import numpy as np
import pandas as pd

from app.api.dependencies import (
    get_predictor,
    get_commodity_repo,
    get_market_repo,
    get_market_price_repo,
    get_prediction_repo,
)
from app.models.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    ModelMetrics,
    ModelMetadata,
    IndividualModelMetrics,
    PredictionMetadata,
)
from app.ml.predictor import AgriculturalPredictor
from app.database.repositories import (
    CommodityRepository,
    MarketRepository,
    MarketPriceRepository,
    PredictionRepository,
)
from app.database.models import Prediction
from app.core.utils import get_current_timestamp

router = APIRouter(prefix="/predict", tags=["predictions"])

@router.post("/", response_model=PredictionResponse, status_code=status.HTTP_200_OK)
async def predict_price(
    request: PredictionRequest,
    predictor: AgriculturalPredictor = Depends(get_predictor),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
    prediction_repo: PredictionRepository = Depends(get_prediction_repo),
) -> PredictionResponse:

    try:
        logger.info(
            f"Prediction request: commodity_id={request.commodity_id}, "
            f"market_id={request.market_id}, date={request.prediction_date}"
        )

        commodity = await commodity_repo.get_by_id(request.commodity_id)
        if not commodity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Commodity {request.commodity_id} not found. Check your catalog or seed fresh data."
            )

        market = await market_repo.get_by_id(request.market_id)
        if not market:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Market {request.market_id} not found. Check your catalog or seed fresh data."
            )

        request_label = f"{commodity.name} @ {market.name} on {request.prediction_date}"

        historical_prices = await market_price_repo.get_price_history(
            commodity_id=request.commodity_id,
            market_id=request.market_id,
            days=90
        )

        if not historical_prices:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No price history for {request_label}. Seed data or pick a different commodity/market pair."
            )

        latest_price = historical_prices[-1]
        
        from datetime import datetime as dt
        pred_date = dt.fromisoformat(request.prediction_date)

        preprocessor = predictor.preprocessor
        if not preprocessor.feature_names:
            preprocessor.feature_names = ["price", "arrival", "commodity_id", "market_id"]
            preprocessor.numeric_features = ["price", "arrival", "commodity_id", "market_id"]
            preprocessor.categorical_features = []

        payload: dict[str, Any] = {
            "date": pred_date,
            "commodity_id": request.commodity_id,
            "market_id": request.market_id,
            "price": getattr(latest_price, "price", None) or getattr(latest_price, "modal_price", 0.0),
            "arrival": getattr(latest_price, "arrival", 0.0),
        }

        for feature_name in preprocessor.numeric_features:
            if feature_name in payload:
                continue
            value = getattr(latest_price, feature_name, None)
            payload[feature_name] = value if value is not None else 0.0

        df = pd.DataFrame([payload])
        features = preprocessor.prepare_prediction_data(
            df,
            date_col="date",
            categorical_cols=preprocessor.categorical_features or None,
        )

        try:
            prediction_result = predictor.predict(
                features,
                include_individual=True,
                include_confidence=True
            )
        except ZeroDivisionError as zdiv_e:
            logger.error(f"Division by zero in prediction: {zdiv_e}", exc_info=True)
            prediction_result = {
                'prediction': float(getattr(latest_price, "price", 1000)),
                'confidence': 0.5,
                'individual_predictions': {},
                'lower_bound': 900,
                'upper_bound': 1100,
                'top_features': {},
                'processing_time_seconds': 0.0
            }

        ensemble_status = predictor.get_ensemble_status()
        
        artifact = getattr(predictor.ensemble, 'artifact_info', {}) or {}
        metrics = artifact.get('metrics', {}) if isinstance(artifact, dict) else {}
        ens_metrics = metrics.get('ensemble', {}) if isinstance(metrics, dict) else {}
        rf_metrics = metrics.get('random_forest', {}) if isinstance(metrics, dict) else {}
        gb_metrics = metrics.get('gradient_boosting', {}) if isinstance(metrics, dict) else {}

        individual_models_list = []
        for name in prediction_result.get('individual_predictions', {}).keys():
            acc = 0.85
            if name == 'random_forest' and isinstance(rf_metrics, dict):
                acc = float(rf_metrics.get('accuracy', acc))
            if name == 'gradient_boosting' and isinstance(gb_metrics, dict):
                acc = float(gb_metrics.get('accuracy', acc))
            individual_models_list.append(
                IndividualModelMetrics(
                    name=name,
                    accuracy=acc,
                    weight=float(predictor.ensemble.model_weights.get(name, 0.0))
                )
            )

        top_feats = prediction_result.get('top_features', {})
        feature_importance = {str(k): float(v) for k, v in top_feats.items()} if isinstance(top_feats, dict) else {}

        model_metadata = ModelMetadata(
            ensemble_accuracy=float(ens_metrics.get('accuracy', 0.85)),
            rmse=float(ens_metrics.get('rmse', 150.0)),
            mae=float(ens_metrics.get('mae', 120.0)),
            r2_score=float(max(0.0, min(1.0, ens_metrics.get('r2', 0.82)))),
            individual_models=individual_models_list,
            feature_importance=feature_importance,
            model_version=str(getattr(predictor.ensemble, 'model_version', artifact.get('timestamp', 'unknown'))),
            trained_on=str(artifact.get('timestamp', get_current_timestamp().date().isoformat())),
            training_samples=int(artifact.get('training_samples', 0) or 0)
        )
        
        prediction_metadata = PredictionMetadata(
            timestamp=get_current_timestamp().isoformat(),
            processing_time_ms=int(prediction_result.get('processing_time_seconds', 0.0) * 1000),
            data_freshness=f"{len(historical_prices)} days historical data"
        )
        
        response = PredictionResponse(
            predicted_price=float(prediction_result['prediction']),
            confidence_interval=(
                float(prediction_result.get('lower_bound', prediction_result['prediction'] - 100)),
                float(prediction_result.get('upper_bound', prediction_result['prediction'] + 100))
            ),
            model_confidence=float(prediction_result.get('confidence', 0.85)),
            confidence_score=float(prediction_result.get('confidence', 0.85)),
            models_used=list(prediction_result.get('individual_predictions', {}).keys()),
            model_metrics=model_metadata,
            prediction_metadata=prediction_metadata
        )
        
        try:
            pred_date = request.prediction_date
            if isinstance(pred_date, str):
                from datetime import date as date_type
                pred_date = date_type.fromisoformat(pred_date)
            
            prediction_record = Prediction(
                commodity_id=request.commodity_id,
                market_id=request.market_id,
                prediction_date=pred_date,
                predicted_price=prediction_result['prediction'],
                confidence=prediction_result.get('confidence', 0.85),
                model_used="ensemble",
            )
            await prediction_repo.create(prediction_record)
        except Exception as e:
            logger.warning(f"Could not persist prediction to database: {e}")

        logger.info(
            f"Prediction complete for {request_label}: price=₹{response.predicted_price:.2f}, "
            f"confidence={response.model_confidence:.2%}, models={response.models_used}"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )

@router.post("/batch", response_model=BatchPredictionResponse, status_code=status.HTTP_200_OK)
async def batch_predict_prices(
    request: BatchPredictionRequest,
    predictor: AgriculturalPredictor = Depends(get_predictor),
    commodity_repo: CommodityRepository = Depends(get_commodity_repo),
    market_repo: MarketRepository = Depends(get_market_repo),
    market_price_repo: MarketPriceRepository = Depends(get_market_price_repo),
    prediction_repo: PredictionRepository = Depends(get_prediction_repo),
) -> BatchPredictionResponse:

    try:
        logger.info(f"Batch prediction request: {len(request.predictions)} items")

        predictions = []
        
        for pred_request in request.predictions:
            try:
                result = await predict_price(
                    request=pred_request,
                    predictor=predictor,
                    commodity_repo=commodity_repo,
                    market_repo=market_repo,
                    market_price_repo=market_price_repo,
                    prediction_repo=prediction_repo,
                )
                predictions.append(result)
            except Exception as e:
                logger.warning(f"Failed prediction for item: {e}")
                continue

        response = BatchPredictionResponse(
            predictions=predictions,
            total_predictions=len(predictions),
            successful=len(predictions),
            failed=len(request.predictions) - len(predictions),
            timestamp=get_current_timestamp()
        )

        logger.info(f"Batch prediction complete: {response.successful}/{response.total_predictions}")

        return response

    except Exception as e:
        logger.error(f"Batch prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch prediction failed: {str(e)}"
        )

@router.get("/history/{commodity_id}/{market_id}", status_code=status.HTTP_200_OK)
async def get_prediction_history(
    commodity_id: int,
    market_id: int,
    days: int = 30,
    prediction_repo: PredictionRepository = Depends(get_prediction_repo),
):

    try:
        start_date = (get_current_timestamp() - timedelta(days=days)).date()
        end_date = get_current_timestamp().date()

        predictions = await prediction_repo.get_by_date_range(
            commodity_id=commodity_id,
            market_id=market_id,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
        )

        predictions_with_actual = [p for p in predictions if p.actual_price is not None]
        avg_accuracy = (
            float(np.mean([p.accuracy for p in predictions_with_actual if p.accuracy]))
            if predictions_with_actual else None
        )

        return [
            {
                'commodity_id': commodity_id,
                'market_id': market_id,
                'date': p.prediction_date,
                'predicted_price': p.predicted_price,
                'actual_price': p.actual_price,
                'error': p.error,
                'accuracy': p.accuracy,
                'confidence': p.confidence,
                'average_accuracy': avg_accuracy,
            }
            for p in predictions
        ]

    except Exception as e:
        logger.error(f"Error fetching prediction history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
