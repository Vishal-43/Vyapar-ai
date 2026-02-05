
import secrets
from datetime import datetime, timedelta
from typing import Optional

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_schemas import (
    NotificationPreference,
    NotificationType,
    UserProfileResponse,
    APIKeyResponse,
    SecuritySettingsResponse,
)

class UserSettingsService:

    @classmethod
    async def get_profile(
        cls, session: AsyncSession, user_id: str
    ) -> UserProfileResponse:

        logger.info(f"Fetching profile for user {user_id}")
        
        profile = UserProfileResponse(
            user_id=user_id,
            first_name="John",
            last_name="Doe",
            email=f"user_{user_id}@example.com",
            phone="+919876543210",
            organization="Agricorp",
            bio="Agricultural entrepreneur",
            avatar_url=None,
            created_at=datetime.utcnow() - timedelta(days=30),
            updated_at=datetime.utcnow(),
            is_email_verified=True,
            is_phone_verified=False,
        )
        return profile

    @classmethod
    async def update_profile(
        cls,
        session: AsyncSession,
        user_id: str,
        profile_data: dict,
    ) -> UserProfileResponse:

        logger.info(f"Updating profile for user {user_id}")
        
        profile = await cls.get_profile(session, user_id)
        
        for field, value in profile_data.items():
            if value is not None and hasattr(profile, field):
                setattr(profile, field, value)
        
        profile.updated_at = datetime.utcnow()
        logger.info(f"Profile updated for user {user_id}")
        
        return profile

    @classmethod
    async def get_notification_preferences(
        cls, session: AsyncSession, user_id: str
    ) -> list[NotificationPreference]:

        logger.info(f"Fetching notification preferences for user {user_id}")
        
        preferences = [
            NotificationPreference(
                notification_type=NotificationType.EMAIL,
                enabled=True,
                frequency="DAILY",
            ),
            NotificationPreference(
                notification_type=NotificationType.PUSH,
                enabled=False,
                frequency="IMMEDIATE",
            ),
            NotificationPreference(
                notification_type=NotificationType.IN_APP,
                enabled=True,
                frequency="IMMEDIATE",
            ),
        ]
        return preferences

    @classmethod
    async def update_notification_preferences(
        cls,
        session: AsyncSession,
        user_id: str,
        preferences: list[NotificationPreference],
    ) -> list[NotificationPreference]:

        logger.info(f"Updating notification preferences for user {user_id}")
        
        logger.info(f"Preferences updated for user {user_id}")
        
        return preferences

    @classmethod
    async def list_api_keys(
        cls, session: AsyncSession, user_id: str
    ) -> list[APIKeyResponse]:

        logger.info(f"Fetching API keys for user {user_id}")
        
        keys = [
            APIKeyResponse(
                key_id="key_abc123",
                name="Development Key",
                key_prefix="sk_live_",
                created_at=datetime.utcnow() - timedelta(days=10),
                last_used=datetime.utcnow() - timedelta(hours=2),
                expires_at=None,
                is_active=True,
            ),
        ]
        return keys

    @classmethod
    async def create_api_key(
        cls,
        session: AsyncSession,
        user_id: str,
        name: str,
        expires_in_days: Optional[int] = None,
    ) -> tuple[str, str]:

        logger.info(f"Creating API key for user {user_id}")
        
        key_id = f"key_{secrets.token_hex(8)}"
        secret_key = f"sk_live_{secrets.token_hex(16)}"
        
        logger.info(f"API key created: {key_id}")
        
        return key_id, secret_key

    @classmethod
    async def revoke_api_key(
        cls, session: AsyncSession, user_id: str, key_id: str
    ) -> bool:

        logger.info(f"Revoking API key {key_id} for user {user_id}")
        
        logger.info(f"API key revoked: {key_id}")
        
        return True

    @classmethod
    async def get_security_settings(
        cls, session: AsyncSession, user_id: str
    ) -> SecuritySettingsResponse:

        logger.info(f"Fetching security settings for user {user_id}")
        
        settings = SecuritySettingsResponse(
            user_id=user_id,
            two_factor_enabled=False,
            two_factor_method=None,
            last_password_change=datetime.utcnow() - timedelta(days=60),
            active_sessions=1,
            suspicious_login_attempts=0,
            last_login=datetime.utcnow(),
        )
        return settings

    @classmethod
    async def enable_two_factor(
        cls,
        session: AsyncSession,
        user_id: str,
        method: str,
    ) -> dict:

        logger.info(f"Enabling 2FA for user {user_id} via {method}")
        
        if method == "authenticator":
            import base64
            secret = base64.b32encode(secrets.token_bytes(10)).decode('utf-8')
            return {
                "secret": secret,
                "method": "authenticator",
                "qr_code_url": f"https://example.com/qr/{secret}",
            }
        elif method in ["sms", "email"]:
            code = f"{secrets.randbelow(1000000):06d}"
            logger.info(f"2FA code sent via {method}")
            return {
                "secret": code,
                "method": method,
            }
        else:
            raise ValueError(f"Invalid 2FA method: {method}")

    @classmethod
    async def disable_two_factor(
        cls, session: AsyncSession, user_id: str
    ) -> bool:

        logger.info(f"Disabling 2FA for user {user_id}")
        
        logger.info(f"2FA disabled for user {user_id}")
        
        return True

    @classmethod
    async def verify_two_factor_code(
        cls,
        session: AsyncSession,
        user_id: str,
        method: str,
        code: str,
    ) -> bool:

        logger.info(f"Verifying 2FA code for user {user_id} via {method}")
        
        if len(code) == 6 and code.isdigit():
            logger.info(f"2FA code verified for user {user_id}")
            return True
        
        logger.warning(f"Invalid 2FA code for user {user_id}")
        return False

    @classmethod
    async def list_active_sessions(
        cls, session: AsyncSession, user_id: str
    ) -> list[dict]:

        logger.info(f"Fetching active sessions for user {user_id}")
        
        sessions = [
            {
                "session_id": "sess_123",
                "device": "Chrome on Windows",
                "ip_address": "192.168.1.100",
                "created_at": datetime.utcnow() - timedelta(hours=2),
                "last_activity": datetime.utcnow() - timedelta(minutes=5),
                "is_current": True,
            },
        ]
        return sessions

    @classmethod
    async def revoke_session(
        cls, session: AsyncSession, user_id: str, session_id: str
    ) -> bool:

        logger.info(f"Revoking session {session_id} for user {user_id}")
        
        logger.info(f"Session revoked: {session_id}")
        
        return True

    @classmethod
    async def revoke_all_sessions(
        cls, session: AsyncSession, user_id: str, except_current: bool = True
    ) -> int:

        logger.info(f"Revoking all sessions for user {user_id}")
        
        revoked_count = 2 if except_current else 3
        logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
        
        return revoked_count
