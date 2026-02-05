
import time
from functools import wraps
from typing import Any, Callable, Optional

from loguru import logger
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
import requests

from app.config import settings
from app.core.exceptions import ScraperError

class RateLimiter:

    def __init__(self, requests_per_minute: int = 10):

        self.requests_per_minute = requests_per_minute
        self.min_interval = 60.0 / requests_per_minute
        self.last_request_time = 0.0

    def wait(self) -> None:

        current_time = time.time()
        time_since_last = current_time - self.last_request_time

        if time_since_last < self.min_interval:
            sleep_time = self.min_interval - time_since_last
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f}s")
            time.sleep(sleep_time)

        self.last_request_time = time.time()

rate_limiter = RateLimiter(requests_per_minute=settings.scrape_rate_limit)

def with_rate_limit(func: Callable) -> Callable:

    @wraps(func)
    def wrapper(*args, **kwargs):
        rate_limiter.wait()
        return func(*args, **kwargs)
    return wrapper

def retry_on_failure(
    max_attempts: int = 3,
    min_wait: int = 2,
    max_wait: int = 10
) -> Callable:

    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type((requests.RequestException, ScraperError)),
        reraise=True,
    )

def get_session(
    timeout: int = 30,
    headers: Optional[dict[str, str]] = None
) -> requests.Session:

    session = requests.Session()
    
    default_headers = {
        "User-Agent": settings.scrape_user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }
    
    if headers:
        default_headers.update(headers)
    
    session.headers.update(default_headers)
    
    return session

def safe_get(
    url: str,
    session: Optional[requests.Session] = None,
    timeout: int = 30,
    **kwargs
) -> requests.Response:

    if session is None:
        session = get_session(timeout=timeout)
    
    try:
        response = session.get(url, timeout=timeout, **kwargs)
        response.raise_for_status()
        return response
    except requests.Timeout as e:
        raise ScraperError(f"Request timeout for {url}", details={"error": str(e)})
    except requests.RequestException as e:
        raise ScraperError(
            f"Request failed for {url}",
            details={"error": str(e), "status_code": getattr(e.response, "status_code", None)}
        )

def clean_text(text: Optional[str]) -> str:

    if not text:
        return ""
    
    cleaned = " ".join(text.split())
    
    cleaned = cleaned.strip()
    
    return cleaned

def parse_float(value: Any, default: float = 0.0) -> float:

    if value is None:
        return default
    
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
        return float(value)
    except (ValueError, TypeError):
        logger.warning(f"Failed to parse float from: {value}")
        return default

def parse_int(value: Any, default: int = 0) -> int:

    if value is None:
        return default
    
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
        return int(float(value))
    except (ValueError, TypeError):
        logger.warning(f"Failed to parse int from: {value}")
        return default

def extract_table_data(table, headers: Optional[list[str]] = None) -> list[dict[str, Any]]:

    data = []
    
    if headers is None:
        header_row = table.find("thead")
        if header_row:
            headers = [clean_text(th.get_text()) for th in header_row.find_all("th")]
        else:
            first_row = table.find("tr")
            if first_row:
                headers = [clean_text(th.get_text()) for th in first_row.find_all(["th", "td"])]
    
    if not headers:
        logger.warning("No headers found in table")
        return data
    
    tbody = table.find("tbody")
    rows = tbody.find_all("tr") if tbody else table.find_all("tr")[1:]
    
    for row in rows:
        cells = row.find_all(["td", "th"])
        if len(cells) == len(headers):
            row_data = {
                headers[i]: clean_text(cells[i].get_text())
                for i in range(len(headers))
            }
            data.append(row_data)
    
    return data
