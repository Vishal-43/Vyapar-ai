"""Weather API service for agricultural impact analysis."""

import httpx
from datetime import datetime
from typing import Optional
from loguru import logger
from app.config import settings


class WeatherService:
    """Service to fetch weather data from OpenWeatherMap API."""
    
    def __init__(self):
        self.api_key = getattr(settings, 'openweathermap_api_key', None) or ""
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
        # Major Indian cities with coordinates
        self.cities = {
            "Delhi": {"lat": 28.6139, "lon": 77.2090},
            "Mumbai": {"lat": 19.0760, "lon": 72.8777},
            "Bangalore": {"lat": 12.9716, "lon": 77.5946},
            "Chennai": {"lat": 13.0827, "lon": 80.2707},
            "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
            "Kolkata": {"lat": 22.5726, "lon": 88.3639},
            "Pune": {"lat": 18.5204, "lon": 73.8567},
            "Ahmedabad": {"lat": 23.0225, "lon": 72.5714},
            "Jaipur": {"lat": 26.9124, "lon": 75.7873},
            "Lucknow": {"lat": 26.8467, "lon": 80.9462},
            "Chandigarh": {"lat": 30.7333, "lon": 76.7794},
            "Bhopal": {"lat": 23.2599, "lon": 77.4126},
            "Patna": {"lat": 25.5941, "lon": 85.1376},
            "Kochi": {"lat": 9.9312, "lon": 76.2673},
            "Nagpur": {"lat": 21.1458, "lon": 79.0882},
        }
    
    def _get_city_coords(self, state: str) -> dict:
        """Get coordinates for a state by finding matching city."""
        state_lower = state.lower()
        
        state_city_map = {
            "delhi": "Delhi",
            "maharashtra": "Mumbai",
            "karnataka": "Bangalore",
            "tamil nadu": "Chennai",
            "telangana": "Hyderabad",
            "andhra pradesh": "Hyderabad",
            "west bengal": "Kolkata",
            "gujarat": "Ahmedabad",
            "rajasthan": "Jaipur",
            "uttar pradesh": "Lucknow",
            "punjab": "Chandigarh",
            "haryana": "Chandigarh",
            "madhya pradesh": "Bhopal",
            "bihar": "Patna",
            "kerala": "Kochi",
        }
        
        city = state_city_map.get(state_lower, "Delhi")
        return self.cities.get(city, self.cities["Delhi"])
    
    async def get_current_weather(self, state: str) -> dict:
        """Fetch current weather for a state."""
        if not self.api_key:
            return self._get_fallback_weather(state)
        
        coords = self._get_city_coords(state)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/weather",
                    params={
                        "lat": coords["lat"],
                        "lon": coords["lon"],
                        "appid": self.api_key,
                        "units": "metric"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "temperature": data["main"]["temp"],
                        "humidity": data["main"]["humidity"],
                        "description": data["weather"][0]["description"],
                        "wind_speed": data["wind"]["speed"],
                        "pressure": data["main"]["pressure"],
                        "visibility": data.get("visibility", 10000) / 1000,
                        "rain": data.get("rain", {}).get("1h", 0),
                        "clouds": data["clouds"]["all"],
                        "source": "openweathermap",
                        "fetched_at": datetime.utcnow().isoformat(),
                    }
                else:
                    logger.warning(f"Weather API returned {response.status_code}")
                    return self._get_fallback_weather(state)
                    
        except Exception as e:
            logger.warning(f"Weather API error: {e}")
            return self._get_fallback_weather(state)
    
    async def get_forecast(self, state: str, days: int = 5) -> list:
        """Fetch weather forecast for a state."""
        if not self.api_key:
            return self._get_fallback_forecast(state, days)
        
        coords = self._get_city_coords(state)
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/forecast",
                    params={
                        "lat": coords["lat"],
                        "lon": coords["lon"],
                        "appid": self.api_key,
                        "units": "metric",
                        "cnt": days * 8  # 3-hour intervals
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    forecasts = []
                    
                    for item in data.get("list", [])[:days * 8:8]:  # One per day
                        forecasts.append({
                            "date": item["dt_txt"],
                            "temperature": item["main"]["temp"],
                            "humidity": item["main"]["humidity"],
                            "description": item["weather"][0]["description"],
                            "rain_probability": item.get("pop", 0) * 100,
                            "wind_speed": item["wind"]["speed"],
                        })
                    
                    return forecasts
                else:
                    return self._get_fallback_forecast(state, days)
                    
        except Exception as e:
            logger.warning(f"Weather forecast API error: {e}")
            return self._get_fallback_forecast(state, days)
    
    def _get_fallback_weather(self, state: str) -> dict:
        """Generate realistic fallback weather data based on season and location."""
        month = datetime.now().month
        
        # Base temperatures by region
        region_temps = {
            "delhi": 25 + (month - 6) ** 2 / 12 - 10,
            "maharashtra": 28 + (month - 5) ** 2 / 15 - 5,
            "karnataka": 26 + (month - 4) ** 2 / 20 - 3,
            "tamil nadu": 30 + (month - 5) ** 2 / 18 - 4,
            "west bengal": 27 + (month - 5) ** 2 / 14 - 8,
            "gujarat": 28 + (month - 6) ** 2 / 13 - 7,
            "rajasthan": 26 + (month - 6) ** 2 / 10 - 12,
        }
        
        state_lower = state.lower()
        base_temp = region_temps.get(state_lower, 26)
        
        # Monsoon adjustment (June-September)
        is_monsoon = month in [6, 7, 8, 9]
        humidity = 80 if is_monsoon else 50 + (12 - abs(month - 7)) * 2
        
        rain = 0
        description = "clear sky"
        if is_monsoon:
            rain = 5 + (month - 6) * 2 if month <= 8 else (10 - month) * 3
            description = "light rain" if rain < 5 else "moderate rain"
        elif month in [10, 11]:
            description = "mist"
        elif month in [12, 1, 2]:
            description = "haze" if state_lower in ["delhi", "haryana", "punjab"] else "clear sky"
        
        return {
            "temperature": round(base_temp, 1),
            "humidity": humidity,
            "description": description,
            "wind_speed": 3.5 + (month % 4),
            "pressure": 1013,
            "visibility": 5 if description in ["mist", "haze"] else 10,
            "rain": rain,
            "clouds": 70 if is_monsoon else 20,
            "source": "calculated",
            "fetched_at": datetime.utcnow().isoformat(),
        }
    
    def _get_fallback_forecast(self, state: str, days: int) -> list:
        """Generate fallback forecast data."""
        forecasts = []
        base_weather = self._get_fallback_weather(state)
        
        for i in range(days):
            forecast_date = datetime.now().replace(hour=12, minute=0, second=0)
            from datetime import timedelta
            forecast_date = forecast_date + timedelta(days=i)
            
            # Slight variations per day
            temp_var = (i % 3 - 1) * 2
            
            forecasts.append({
                "date": forecast_date.strftime("%Y-%m-%d %H:%M:%S"),
                "temperature": base_weather["temperature"] + temp_var,
                "humidity": base_weather["humidity"] + (i % 5 - 2) * 3,
                "description": base_weather["description"],
                "rain_probability": min(100, max(0, base_weather["rain"] * 10 + i * 5)),
                "wind_speed": base_weather["wind_speed"] + (i % 3) * 0.5,
            })
        
        return forecasts
    
    def get_agricultural_impact(self, weather: dict) -> dict:
        """Calculate agricultural impact from weather conditions."""
        impacts = []
        severity = "low"
        
        temp = weather.get("temperature", 25)
        humidity = weather.get("humidity", 50)
        rain = weather.get("rain", 0)
        description = weather.get("description", "").lower()
        
        # Temperature impacts
        if temp > 40:
            impacts.append({
                "type": "heat_stress",
                "title": "Extreme Heat Warning",
                "description": "High temperatures may affect crop quality and storage",
                "delta": "+15%",
                "positive": False
            })
            severity = "high"
        elif temp > 35:
            impacts.append({
                "type": "heat",
                "title": "High Temperature",
                "description": "Elevated temperatures may increase spoilage risk",
                "delta": "+8%",
                "positive": False
            })
            severity = "medium"
        elif temp < 10:
            impacts.append({
                "type": "cold",
                "title": "Cold Weather",
                "description": "Low temperatures good for storage, may delay harvests",
                "delta": "-5%",
                "positive": True
            })
        
        # Rain impacts
        if rain > 20 or "heavy rain" in description:
            impacts.append({
                "type": "flooding",
                "title": "Heavy Rainfall",
                "description": "Supply disruption expected, prices may increase",
                "delta": "+20%",
                "positive": False
            })
            severity = "high"
        elif rain > 5 or "rain" in description:
            impacts.append({
                "type": "rain",
                "title": "Rainfall",
                "description": "Moderate rainfall may affect transportation",
                "delta": "+5%",
                "positive": False
            })
            if severity != "high":
                severity = "medium"
        
        # Humidity impacts
        if humidity > 85:
            impacts.append({
                "type": "humidity",
                "title": "High Humidity",
                "description": "Storage conditions may be affected",
                "delta": "+3%",
                "positive": False
            })
        
        # Favorable conditions
        if 20 <= temp <= 30 and humidity < 70 and rain == 0:
            impacts.append({
                "type": "favorable",
                "title": "Good Weather",
                "description": "Favorable conditions for transportation and storage",
                "delta": "-2%",
                "positive": True
            })
        
        return {
            "impacts": impacts,
            "severity": severity,
            "summary": f"{len(impacts)} weather factors affecting prices"
        }


# Singleton instance
_weather_service: Optional[WeatherService] = None


def get_weather_service() -> WeatherService:
    """Get or create weather service singleton."""
    global _weather_service
    if _weather_service is None:
        _weather_service = WeatherService()
    return _weather_service
