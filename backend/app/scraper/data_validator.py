
from datetime import datetime
from typing import Any, Optional

from loguru import logger

from app.core.exceptions import ValidationError
from app.core.utils import parse_timestamp

class DataValidator:

    @staticmethod
    def validate_market_price(data: dict[str, Any]) -> dict[str, Any]:

        required_fields = ["commodity", "market", "price"]
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            raise ValidationError(
                f"Missing required fields: {', '.join(missing_fields)}",
                details={"data": data}
            )
        
        validated = {
            "commodity": str(data["commodity"]).strip(),
            "market": str(data["market"]).strip(),
            "state": str(data.get("state", "")).strip() if data.get("state") else None,
            "date": DataValidator._validate_date(data.get("date")),
        }
        
        try:
            price = float(str(data["price"]).replace(",", ""))
            if price < 0:
                raise ValidationError("Price cannot be negative", details={"price": price})
            validated["price"] = price
        except (ValueError, TypeError) as e:
            raise ValidationError(f"Invalid price value: {data['price']}", details={"error": str(e)})
        
        if data.get("min_price"):
            try:
                validated["min_price"] = float(str(data["min_price"]).replace(",", ""))
            except (ValueError, TypeError):
                validated["min_price"] = None
        
        if data.get("max_price"):
            try:
                validated["max_price"] = float(str(data["max_price"]).replace(",", ""))
            except (ValueError, TypeError):
                validated["max_price"] = None
        
        if data.get("modal_price"):
            try:
                validated["modal_price"] = float(str(data["modal_price"]).replace(",", ""))
            except (ValueError, TypeError):
                validated["modal_price"] = None
        
        if data.get("arrival"):
            try:
                arrival = float(str(data["arrival"]).replace(",", ""))
                if arrival < 0:
                    arrival = None
                validated["arrival"] = arrival
            except (ValueError, TypeError):
                validated["arrival"] = None
        else:
            validated["arrival"] = None
        
        return validated

    @staticmethod
    def validate_commodity(data: dict[str, Any]) -> dict[str, Any]:

        if not data.get("name"):
            raise ValidationError("Commodity name is required", details={"data": data})
        
        validated = {
            "name": str(data["name"]).strip(),
            "category": str(data.get("category", "")).strip() if data.get("category") else None,
            "unit": str(data.get("unit", "")).strip() if data.get("unit") else None,
        }
        
        return validated

    @staticmethod
    def validate_market(data: dict[str, Any]) -> dict[str, Any]:

        if not data.get("name"):
            raise ValidationError("Market name is required", details={"data": data})
        
        validated = {
            "name": str(data["name"]).strip(),
            "state": str(data.get("state", "")).strip() if data.get("state") else None,
            "district": str(data.get("district", "")).strip() if data.get("district") else None,
        }
        
        return validated

    @staticmethod
    def _validate_date(date_value: Any) -> Optional[str]:

        if not date_value:
            return None
        
        if isinstance(date_value, datetime):
            return date_value.strftime("%Y-%m-%d")
        
        date_formats = [
            "%Y-%m-%d",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
            "%d-%b-%Y",
            "%d %b %Y",
        ]
        
        date_str = str(date_value).strip()
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_value}")
        return None

    @staticmethod
    def validate_batch(
        data_list: list[dict[str, Any]],
        validator_func: callable
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:

        valid_items = []
        invalid_items = []
        
        for item in data_list:
            try:
                validated_item = validator_func(item)
                valid_items.append(validated_item)
            except ValidationError as e:
                logger.warning(f"Validation failed: {e.message}")
                invalid_items.append({
                    "data": item,
                    "error": e.message,
                    "details": e.details,
                })
            except Exception as e:
                logger.error(f"Unexpected validation error: {str(e)}")
                invalid_items.append({
                    "data": item,
                    "error": str(e),
                })
        
        return valid_items, invalid_items

    @staticmethod
    def is_valid_price_range(min_price: float, max_price: float, modal_price: float) -> bool:

        if min_price < 0 or max_price < 0 or modal_price < 0:
            return False
        
        if min_price > modal_price or modal_price > max_price:
            return False
        
        if min_price > max_price:
            return False
        
        return True
