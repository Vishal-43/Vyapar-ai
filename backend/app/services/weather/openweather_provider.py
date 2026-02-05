import requests
import os
from datetime import datetime

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/onecall"

class OpenWeatherProvider:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or OPENWEATHER_API_KEY

    def get_forecast(self, lat: float, lon: float):
        params = {
            "lat": lat,
            "lon": lon,
            "exclude": "minutely,hourly,alerts",
            "appid": self.api_key,
            "units": "metric"
        }
        resp = requests.get(OPENWEATHER_URL, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data

    def get_daily_forecast(self, lat: float, lon: float):
        data = self.get_forecast(lat, lon)
        return data.get("daily", [])
