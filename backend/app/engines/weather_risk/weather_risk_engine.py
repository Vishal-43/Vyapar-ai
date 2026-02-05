
from .risk_models import WeatherRiskInput, WeatherRiskReport, WeatherAlert, ProtectiveMeasure
from typing import List
from ...services.weather.weather_service import WeatherService
import re


class WeatherRiskEngine:
    def __init__(self):
        self.weather_service = WeatherService()

    def _parse_location(self, location: str):
        # Very basic: expects 'lat,lon' or 'city, state' (future: geocoding)
        if re.match(r"^-?\d+\.\d+,-?\d+\.\d+$", location):
            lat, lon = map(float, location.split(","))
            return lat, lon
        # TODO: Add geocoding for city/state names
        raise ValueError("Location must be 'lat,lon' for now (e.g., '23.03,72.58')")

    def assess_weather_risk(self, inputs: WeatherRiskInput) -> WeatherRiskReport:
        # Parse location
        lat, lon = self._parse_location(inputs.location)
        forecast = self.weather_service.get_weather_forecast(lat, lon)

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
