
import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Optional
from pathlib import Path

import pytz

def get_current_timestamp() -> datetime:

    return datetime.now(pytz.UTC)

def format_timestamp(dt: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:

    return dt.strftime(format_str)

def parse_timestamp(date_str: str, format_str: str = "%Y-%m-%d") -> datetime:

    return datetime.strptime(date_str, format_str)

def days_ago(days: int) -> datetime:

    return get_current_timestamp() - timedelta(days=days)

def days_ahead(days: int) -> datetime:

    return get_current_timestamp() + timedelta(days=days)

def generate_hash(data: str) -> str:

    return hashlib.sha256(data.encode()).hexdigest()

def safe_division(numerator: float, denominator: float, default: float = 0.0) -> float:

    return numerator / denominator if denominator != 0 else default

def percentage_change(old_value: float, new_value: float) -> float:

    if old_value == 0:
        return 0.0
    return ((new_value - old_value) / abs(old_value)) * 100

def round_decimal(value: float, decimals: int = 2) -> float:

    return round(value, decimals)

def ensure_dir(path: str | Path) -> Path:

    path_obj = Path(path)
    path_obj.mkdir(parents=True, exist_ok=True)
    return path_obj

def load_json(file_path: str | Path) -> dict[str, Any]:

    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(data: dict[str, Any], file_path: str | Path, indent: int = 2) -> None:

    ensure_dir(Path(file_path).parent)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, default=str)

def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:

    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix

def calculate_confidence_interval(
    mean: float, std: float, confidence: float = 0.95
) -> tuple[float, float]:

    import numpy as np
    from scipy import stats

    z_score = stats.norm.ppf((1 + confidence) / 2)
    margin = z_score * std

    return (mean - margin, mean + margin)

def get_season(date: datetime) -> str:

    month = date.month

    if month in [12, 1, 2]:
        return "winter"
    elif month in [3, 4, 5]:
        return "summer"
    elif month in [6, 7, 8, 9]:
        return "monsoon"
    else:
        return "autumn"

def is_weekend(date: datetime) -> bool:

    return date.weekday() >= 5

def is_holiday(date: datetime, holidays: Optional[list[datetime]] = None) -> bool:

    if holidays is None:
        return False
    return date.date() in [h.date() for h in holidays]

def calculate_moving_average(values: list[float], window: int = 7) -> list[float]:

    import numpy as np

    if len(values) < window:
        return values

    return list(np.convolve(values, np.ones(window) / window, mode="valid"))

def detect_outliers_iqr(values: list[float]) -> list[int]:

    import numpy as np

    if len(values) < 4:
        return []

    q1 = np.percentile(values, 25)
    q3 = np.percentile(values, 75)
    iqr = q3 - q1

    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    return [i for i, v in enumerate(values) if v < lower_bound or v > upper_bound]

def normalize_text(text: str) -> str:

    return text.lower().strip().replace(" ", "_")

def chunk_list(lst: list[Any], chunk_size: int) -> list[list[Any]]:

    return [lst[i : i + chunk_size] for i in range(0, len(lst), chunk_size)]
