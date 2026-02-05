from datetime import datetime, timedelta, date as date_type
from typing import Dict, List, Optional, Tuple, Union
import pandas as pd
from loguru import logger

class FestivalCalendar:
    
    def __init__(self):
        self.festivals = self._initialize_festivals()
        self.market_events = self._initialize_market_events()
        logger.info("Festival calendar ready with Indian holidays and agricultural events")

    def _initialize_festivals(self) -> Dict[str, List[Tuple[int, int, str]]]:
        
        return {
            "major_festivals": [
                (1, 1, "new_year"),
                (1, 26, "republic_day"),
                (8, 15, "independence_day"),
                (10, 2, "gandhi_jayanti"),
                (12, 25, "christmas"),
            ],
            "hindu_festivals": [
                (3, 8, "holi"),
                (3, 9, "holi"),
                (4, 14, "baisakhi"),
                (10, 24, "dussehra"),
                (11, 1, "diwali"),
                (11, 12, "diwali"),
                (11, 13, "govardhan_puja"),
            ],
            "harvest_festivals": [
                (1, 14, "makar_sankranti"),
                (1, 15, "pongal"),
                (4, 13, "baisakhi"),
                (8, 15, "onam"),
                (9, 17, "nabanna"),
            ],
            "religious_fasting": [
                (3, 22, "ramadan_start"),
                (4, 21, "eid"),
                (7, 28, "bakrid"),
                (8, 30, "janmashtami"),
            ],
        }

    def _initialize_market_events(self) -> Dict[str, List[Tuple[int, int, str]]]:
        
        return {
            "sowing_seasons": [
                (6, 1, "kharif_sowing_start"),
                (7, 15, "kharif_peak_sowing"),
                (10, 1, "rabi_sowing_start"),
                (11, 15, "rabi_peak_sowing"),
            ],
            "harvest_seasons": [
                (3, 15, "rabi_harvest_start"),
                (4, 30, "rabi_harvest_end"),
                (9, 15, "kharif_harvest_start"),
                (11, 1, "kharif_harvest_end"),
            ],
            "procurement_periods": [
                (4, 1, "wheat_procurement_start"),
                (6, 30, "wheat_procurement_end"),
                (10, 1, "paddy_procurement_start"),
                (3, 31, "paddy_procurement_end"),
            ],
        }

    def is_festival_day(self, date: datetime) -> bool:
        
        month, day = date.month, date.day
        
        for category, events in self.festivals.items():
            for event_month, event_day, _ in events:
                if month == event_month and day == event_day:
                    return True
        return False

    def is_harvest_season(self, date: datetime) -> bool:
        
        month = date.month
        return month in [3, 4, 9, 10, 11]

    def get_festival_proximity(self, date: Union[datetime, date_type], days_before: int = 7, days_after: int = 3) -> int:
        # Convert date to datetime if needed for consistent comparison
        if isinstance(date, date_type) and not isinstance(date, datetime):
            date = datetime.combine(date, datetime.min.time())
        
        check_start = date - timedelta(days=days_before)
        check_end = date + timedelta(days=days_after)
        
        closest_distance = float('inf')
        
        for category, events in self.festivals.items():
            for event_month, event_day, event_name in events:
                event_date = datetime(date.year, event_month, event_day)
                
                distance = abs((date - event_date).days)
                
                if check_start <= event_date <= check_end:
                    closest_distance = min(closest_distance, distance)
        
        return closest_distance if closest_distance != float('inf') else 0

    def get_season_type(self, date: datetime) -> int:
        
        month = date.month
        
        if month in [10, 11, 12, 1, 2, 3]:
            return 1
        elif month in [6, 7, 8, 9]:
            return 2
        else:
            return 3

    def get_market_event_flags(self, date: Union[datetime, date_type]) -> Dict[str, int]:
        # Convert date to datetime if needed for consistent comparison
        if isinstance(date, date_type) and not isinstance(date, datetime):
            date = datetime.combine(date, datetime.min.time())
        
        month, day = date.month, date.day
        flags = {
            "is_sowing_period": 0,
            "is_harvest_period": 0,
            "is_procurement_period": 0,
            "is_festival_week": 0,
            "is_major_festival": 0,
        }
        
        for event_month, event_day, _ in self.market_events.get("sowing_seasons", []):
            season_start = datetime(date.year, event_month, event_day)
            if abs((date - season_start).days) <= 30:
                flags["is_sowing_period"] = 1
                break
        
        for event_month, event_day, _ in self.market_events.get("harvest_seasons", []):
            season_start = datetime(date.year, event_month, event_day)
            if abs((date - season_start).days) <= 30:
                flags["is_harvest_period"] = 1
                break
        
        for event_month, event_day, _ in self.market_events.get("procurement_periods", []):
            period_start = datetime(date.year, event_month, event_day)
            if abs((date - period_start).days) <= 30:
                flags["is_procurement_period"] = 1
                break
        
        proximity = self.get_festival_proximity(date)
        if proximity > 0 and proximity <= 7:
            flags["is_festival_week"] = 1
        
        if self.is_festival_day(date):
            flags["is_major_festival"] = 1
        
        return flags

    def get_enhanced_features(self, date: Union[datetime, date_type]) -> Dict[str, any]:
        # Convert date to datetime if needed for consistent comparison
        if isinstance(date, date_type) and not isinstance(date, datetime):
            date = datetime.combine(date, datetime.min.time())
        
        features = {
            "is_festival": 1 if self.is_festival_day(date) else 0,
            "festival_proximity": self.get_festival_proximity(date),
            "is_harvest_season": 1 if self.is_harvest_season(date) else 0,
            "season_type": self.get_season_type(date),
            "is_weekend": 1 if date.weekday() >= 5 else 0,
            "is_month_end": 1 if date.day >= 28 else 0,
            "is_month_start": 1 if date.day <= 5 else 0,
        }
        
        market_flags = self.get_market_event_flags(date)
        features.update(market_flags)
        
        return features

    def enrich_dataframe(self, df: pd.DataFrame, date_column: str) -> pd.DataFrame:
        
        df = df.copy()
        dates = pd.to_datetime(df[date_column])
        
        enriched_features = dates.apply(lambda d: pd.Series(self.get_enhanced_features(d)))
        
        for col in enriched_features.columns:
            df[col] = enriched_features[col]
        
        logger.info(f"Enriched {len(df)} records with festival and event features")
        return df

    def get_upcoming_events(self, start_date: datetime, days: int = 30) -> List[Dict]:
        
        events = []
        end_date = start_date + timedelta(days=days)
        
        all_events = []
        for category, event_list in {**self.festivals, **self.market_events}.items():
            for month, day, name in event_list:
                try:
                    event_date = datetime(start_date.year, month, day)
                    if start_date <= event_date <= end_date:
                        all_events.append({
                            "date": event_date,
                            "name": name,
                            "category": category,
                            "days_away": (event_date - start_date).days
                        })
                except ValueError:
                    continue
        
        all_events.sort(key=lambda x: x["date"])
        return all_events
