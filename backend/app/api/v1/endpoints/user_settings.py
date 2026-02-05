
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db_session
from app.models.user_schemas import (
    CreateAPIKeyRequest,
    CreateAPIKeyResponse,
    EnableTwoFactorRequest,
    NotificationPreferencesResponse,
    SecuritySettingsResponse,
    UpdateNotificationPreferencesRequest,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services.user_settings_service import UserSettingsService

router = APIRouter(prefix="/settings", tags=["user-settings"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    profile = await UserSettingsService.get_profile(session, user_id)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    update_data = profile_data.dict(exclude_unset=True)
    
    updated_profile = await UserSettingsService.update_profile(
        session, user_id, update_data
    )
    return updated_profile

@router.get(
    "/notifications",
    response_model=NotificationPreferencesResponse
)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    preferences = await UserSettingsService.get_notification_preferences(
        session, user_id
    )
    return NotificationPreferencesResponse(
        user_id=user_id,
        preferences=preferences,
        updated_at=__import__("datetime").datetime.utcnow(),
    )

@router.put(
    "/notifications",
    response_model=NotificationPreferencesResponse
)
async def update_notification_preferences(
    request: UpdateNotificationPreferencesRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    preferences = await UserSettingsService.update_notification_preferences(
        session, user_id, request.preferences
    )
    return NotificationPreferencesResponse(
        user_id=user_id,
        preferences=preferences,
        updated_at=__import__("datetime").datetime.utcnow(),
    )

@router.get("/api-keys", response_model=list)
async def list_api_keys(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    keys = await UserSettingsService.list_api_keys(session, user_id)
    return keys

@router.post("/api-keys", response_model=CreateAPIKeyResponse, status_code=201)
async def create_api_key(
    request: CreateAPIKeyRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    key_id, secret_key = await UserSettingsService.create_api_key(
        session,
        user_id,
        request.name,
        request.expires_in_days,
    )
    
    expires_at = None
    if request.expires_in_days:
        from datetime import datetime, timedelta
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)
    
    return CreateAPIKeyResponse(
        key_id=key_id,
        name=request.name,
        secret_key=secret_key,
        created_at=__import__("datetime").datetime.utcnow(),
        expires_at=expires_at,
    )

@router.delete("/api-keys/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    success = await UserSettingsService.revoke_api_key(session, user_id, key_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

@router.get(
    "/security",
    response_model=SecuritySettingsResponse
)
async def get_security_settings(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    settings = await UserSettingsService.get_security_settings(session, user_id)
    return settings

@router.post("/security/two-factor/enable", status_code=200)
async def enable_two_factor(
    request: EnableTwoFactorRequest,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    try:
        result = await UserSettingsService.enable_two_factor(
            session, user_id, request.method
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

@router.post("/security/two-factor/verify", status_code=200)
async def verify_two_factor(
    code: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    method = "authenticator"
    verified = await UserSettingsService.verify_two_factor_code(
        session, user_id, method, code
    )
    
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )
    
    return {"success": True, "message": "Two-factor authentication enabled"}

@router.delete("/security/two-factor/disable", status_code=204)
async def disable_two_factor(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    await UserSettingsService.disable_two_factor(session, user_id)

@router.get("/sessions", response_model=list)
async def list_sessions(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    sessions = await UserSettingsService.list_active_sessions(session, user_id)
    return sessions

@router.delete("/sessions/{session_id}", status_code=204)
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    success = await UserSettingsService.revoke_session(
        session, user_id, session_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

@router.post("/sessions/revoke-all", status_code=200)
async def revoke_all_sessions(
    current_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):

    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )
    
    revoked_count = await UserSettingsService.revoke_all_sessions(
        session, user_id, except_current=True
    )
    
    return {
        "success": True,
        "revoked_count": revoked_count,
        "message": f"Revoked {revoked_count} session(s)",
    }
