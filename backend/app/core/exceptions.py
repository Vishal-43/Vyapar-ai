
from typing import Any, Optional

class AgriTechException(Exception):

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)

class NotFoundError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=404, details=details)

class DatabaseError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class ScraperError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class MLModelError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class PredictionError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class AlertError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class InventoryError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)

class RateLimitError(AgriTechException):

    def __init__(self, message: str = "Rate limit exceeded", details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=429, details=details)

class ConfigurationError(AgriTechException):

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None):
        super().__init__(message, status_code=500, details=details)
