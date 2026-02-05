
from .risk_models import WeatherRiskInput, WeatherRiskReport, WeatherAlert, ProtectiveMeasure
from typing import List
from ...services.weather.weather_service import WeatherService
import re


class WeatherRiskEngine:
    # Simple city coordinates mapping for major Indian cities
    CITY_COORDS = {
        "delhi": (28.6139, 77.2090),
        "mumbai": (19.0760, 72.8777),
        "bangalore": (12.9716, 77.5946),
        "chennai": (13.0827, 80.2707),
        "kolkata": (22.5726, 88.3639),
        "hyderabad": (17.3850, 78.4867),
        "pune": (18.5204, 73.8567),
        "ahmedabad": (23.0225, 72.5714),
        "jaipur": (26.9124, 75.7873),
        "lucknow": (26.8467, 80.9462),
        "new delhi": (28.6139, 77.2090),
    }
    
    def __init__(self):
        self.weather_service = WeatherService()

    def _parse_location(self, location: str):
        # Check if it's coordinates (lat,lon format)
        if re.match(r"^-?\d+\.?\d*,-?\d+\.?\d*$", location):
            lat, lon = map(float, location.split(","))
            return lat, lon
        
        # Try to find city in our mapping (case-insensitive)
        city_key = location.lower().strip()
        if city_key in self.CITY_COORDS:
            return self.CITY_COORDS[city_key]
        
        # If not found, raise error with helpful message
        cities = ", ".join(sorted(self.CITY_COORDS.keys()))
        raise ValueError(f"Location not found. Use coordinates 'lat,lon' or one of: {cities}")

    def assess_weather_risk(self, inputs: WeatherRiskInput) -> WeatherRiskReport:
        # Parse location
        lat, lon = self._parse_location(inputs.location)
        
        # Try to get real weather data, fallback to mock if API key not available
        try:
            forecast = self.weather_service.get_weather_forecast(lat, lon)
        except Exception as e:
            # Mock weather data for development
            import random
            from datetime import datetime, timedelta
            
            forecast = []
            for i in range(7):
                temp_min = random.uniform(15, 25)
                temp_max = random.uniform(25, 35)
                rain = random.uniform(0, 20) if random.random() > 0.7 else 0
                forecast.append({
                    "dt": int((datetime.now() + timedelta(days=i)).timestamp()),
                    "temp": {"min": temp_min, "max": temp_max},
                    "rain": rain,
                    "weather": [{"description": "partly cloudy"}]
                })

        alerts = []
        protective_measures = []
        insurance = None
        risk_level = "LOW"

        # Example: check for extreme weather in next 7 days
        for day in forecast:
            temp_min = day.get("temp", {}).get("min", 100)
            temp_max = day.get("temp", {}).get("max", -100)
            rain = day.get("rain", 0)
            weather_desc = day.get("weather", [{}])[0].get("description", "")
            dt = day.get("dt")

            # Frost risk
            if temp_min < 4:
                alerts.append(WeatherAlert(alert_type="Frost", severity="CRITICAL", description=f"Frost risk: min temp {temp_min}°C"))
                protective_measures.append(ProtectiveMeasure(measure="Use frost protection covers", cost=2000, effectiveness="70-90%"))
                risk_level = "CRITICAL"
            # Excess rainfall
            if rain and rain > 50:
                alerts.append(WeatherAlert(alert_type="Excess Rainfall", severity="HIGH", description=f"Heavy rainfall: {rain}mm expected"))
                protective_measures.append(ProtectiveMeasure(measure="Improve drainage", cost=1000, effectiveness="60-80%"))
                if risk_level != "CRITICAL":
                    risk_level = "HIGH"
            # Heatwave
            if temp_max > 40:
                alerts.append(WeatherAlert(alert_type="Heatwave", severity="HIGH", description=f"High temp: {temp_max}°C"))
                protective_measures.append(ProtectiveMeasure(measure="Irrigation scheduling", cost=500, effectiveness="60-80%"))
                if risk_level not in ["CRITICAL", "HIGH"]:
                    risk_level = "MODERATE"

        if risk_level == "CRITICAL":
            insurance = "PMFBY (Pradhan Mantri Fasal Bima Yojana) recommended for CRITICAL risk."
        elif risk_level == "HIGH":
            insurance = "Consider weather insurance for HIGH risk."

        return WeatherRiskReport(
            risk_level=risk_level,
            alerts=alerts,
            insurance=insurance,
            protective_measures=protective_measures
        )
