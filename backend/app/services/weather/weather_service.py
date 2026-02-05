from .openweather_provider import OpenWeatherProvider

class WeatherService:
    def __init__(self, provider=None):
        self.provider = provider or OpenWeatherProvider()

    def get_weather_forecast(self, lat: float, lon: float):
        """
        Returns daily weather forecast for the given location.
        """
        return self.provider.get_daily_forecast(lat, lon)

    # Optionally, add more methods for other providers or data sources
