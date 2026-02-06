
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db_session
from app.models.recommendation_schemas import (
    AcknowledgeRecommendationRequest,
    RecommendationHistoryResponse,
    RecommendationListResponse,
    RecommendationMetricsResponse,
    RecommendationResponse,
    RecordRecommendationAccuracyRequest,
)
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def _require_user_id(current_user: dict) -> str:
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    return user_id

@router.get("/", response_model=RecommendationListResponse)
async def list_recommendations(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    recommendations = await RecommendationService.get_active_recommendations(
        session,
        user_id,
    )
    return RecommendationListResponse(
        recommendations=recommendations,
        total=len(recommendations),
        generated_at=recommendations[0].created_at if recommendations else datetime.now(tz=timezone.utc),
    )

@router.get("/history", response_model=RecommendationHistoryResponse)
async def list_recommendation_history(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    history = await RecommendationService.get_recommendation_history(
        session, user_id, limit=limit, offset=offset
    )
    return RecommendationHistoryResponse(history=history, total=len(history))

@router.get("/metrics", response_model=RecommendationMetricsResponse)
async def get_recommendation_metrics(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    return await RecommendationService.get_accuracy_metrics(session, user_id)

@router.get("/{recommendation_id}", response_model=RecommendationResponse)
async def get_recommendation(
    recommendation_id: int,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    recommendation = await RecommendationService.get_recommendation_by_id(
        session, user_id, recommendation_id
    )
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return recommendation

@router.post("/{recommendation_id}/acknowledge", status_code=status.HTTP_200_OK)
async def acknowledge_recommendation(
    recommendation_id: int,
    request: AcknowledgeRecommendationRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    success = await RecommendationService.acknowledge_recommendation(
        session,
        user_id,
        recommendation_id,
        note=request.note,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Unable to acknowledge")
    return {"status": "acknowledged", "recommendation_id": recommendation_id}

@router.post("/{recommendation_id}/accuracy", status_code=status.HTTP_200_OK)
async def record_accuracy(
    recommendation_id: int,
    request: RecordRecommendationAccuracyRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = _require_user_id(current_user)
    success = await RecommendationService.record_recommendation_accuracy(
        session,
        user_id,
        recommendation_id,
        outcome=request.outcome,
        actual_change_pct=request.actual_change_pct,
        roi_pct=request.roi_pct,
        note=request.note,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Unable to record accuracy")
    return {"status": "recorded", "recommendation_id": recommendation_id}
