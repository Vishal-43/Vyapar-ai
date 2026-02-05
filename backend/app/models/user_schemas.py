
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

class NotificationType(str, Enum):

    EMAIL = "EMAIL"
    PUSH = "PUSH"
    IN_APP = "IN_APP"

class PreferredLanguage(str, Enum):

    ENGLISH = "ENGLISH"
    HINDI = "HINDI"
    SPANISH = "SPANISH"
    FRENCH = "FRENCH"

class Theme(str, Enum):

    LIGHT = "LIGHT"
    DARK = "DARK"
    AUTO = "AUTO"

class NotificationPreference(BaseModel):

    notification_type: NotificationType
    enabled: bool
    frequency: str = Field(
        default="DAILY",
        description="Frequency: IMMEDIATE, HOURLY, DAILY, WEEKLY"
    )

    class Config:

        json_schema_extra = {
            "example": {
                "notification_type": "EMAIL",
                "enabled": True,
                "frequency": "DAILY"
            }
        }

class UserProfileUpdate(BaseModel):

    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, pattern=r"^\+?1?\d{9,15}$")
    organization: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    language: Optional[PreferredLanguage] = None
    theme: Optional[Theme] = None

    class Config:

        json_schema_extra = {
            "example": {
                "first_name": "Vishal",
                "last_name": "Sharma",
                "email": "vishal@example.com",
                "phone": "+919876543210",
                "organization": "Agricorp",
                "bio": "Agricultural entrepreneur",
                "language": "ENGLISH",
                "theme": "DARK"
            }
        }

class UserProfileResponse(BaseModel):

    user_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    organization: Optional[str] = None
    bio: Optional[str] = None
    language: PreferredLanguage = PreferredLanguage.ENGLISH
    theme: Theme = Theme.AUTO
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_email_verified: bool = False
    is_phone_verified: bool = False

    class Config:

        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "first_name": "Vishal",
                "last_name": "Sharma",
                "email": "vishal@example.com",
                "phone": "+919876543210",
                "organization": "Agricorp",
                "bio": "Agricultural entrepreneur",
                "language": "ENGLISH",
                "theme": "DARK",
                "avatar_url": "https://example.com/avatar.jpg",
                "created_at": "2026-01-01T10:00:00Z",
                "updated_at": "2026-01-29T15:30:00Z",
                "is_email_verified": True,
                "is_phone_verified": False
            }
        }

class APIKeyResponse(BaseModel):

    key_id: str
    name: str
    key_prefix: str = Field(description="First 8 characters of the key")
    created_at: datetime
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

    class Config:

        json_schema_extra = {
            "example": {
                "key_id": "key_abc123",
                "name": "Development Key",
                "key_prefix": "sk_live_",
                "created_at": "2026-01-15T10:00:00Z",
                "last_used": "2026-01-29T14:00:00Z",
                "expires_at": "2027-01-15T10:00:00Z",
                "is_active": True
            }
        }

class CreateAPIKeyRequest(BaseModel):

    name: str = Field(min_length=1, max_length=100)
    expires_in_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=3650,
        description="Days until key expires (optional)"
    )

    class Config:

        json_schema_extra = {
            "example": {
                "name": "Production API Key",
                "expires_in_days": 365
            }
        }

class CreateAPIKeyResponse(BaseModel):

    key_id: str
    name: str
    secret_key: str = Field(description="Full API key - only shown once")
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:

        json_schema_extra = {
            "example": {
                "key_id": "key_xyz789",
                "name": "Production Key",
                "secret_key": "sk_live_1234567890abcdef",
                "created_at": "2026-01-29T15:00:00Z",
                "expires_at": "2027-01-29T15:00:00Z"
            }
        }

class NotificationPreferencesResponse(BaseModel):

    user_id: str
    preferences: list[NotificationPreference]
    updated_at: datetime

    class Config:

        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "preferences": [
                    {
                        "notification_type": "EMAIL",
                        "enabled": True,
                        "frequency": "DAILY"
                    },
                    {
                        "notification_type": "PUSH",
                        "enabled": False,
                        "frequency": "IMMEDIATE"
                    }
                ],
                "updated_at": "2026-01-29T15:30:00Z"
            }
        }

class SecuritySettingsResponse(BaseModel):

    user_id: str
    two_factor_enabled: bool
    two_factor_method: Optional[str] = None
    last_password_change: Optional[datetime] = None
    active_sessions: int
    suspicious_login_attempts: int = 0
    last_login: Optional[datetime] = None

    class Config:

        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "two_factor_enabled": True,
                "two_factor_method": "authenticator",
                "last_password_change": "2025-12-15T10:00:00Z",
                "active_sessions": 2,
                "suspicious_login_attempts": 0,
                "last_login": "2026-01-29T15:00:00Z"
            }
        }

class UpdateNotificationPreferencesRequest(BaseModel):

    preferences: list[NotificationPreference]

    class Config:

        json_schema_extra = {
            "example": {
                "preferences": [
                    {
                        "notification_type": "EMAIL",
                        "enabled": True,
                        "frequency": "WEEKLY"
                    }
                ]
            }
        }

class EnableTwoFactorRequest(BaseModel):

    method: str = Field(description="sms, email, or authenticator")

    class Config:

        json_schema_extra = {
            "example": {
                "method": "authenticator"
            }
        }
