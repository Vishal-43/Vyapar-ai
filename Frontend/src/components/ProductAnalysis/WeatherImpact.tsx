import { useState, useEffect } from "react";
import { FiCloud, FiSun, FiCloudRain, FiWind, FiThermometer, FiDroplet } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";

interface WeatherData {
  condition: "sunny" | "cloudy" | "rainy" | "stormy";
  temperature: number;
  humidity: number;
  rainfall: number;
  impact: "positive" | "negative" | "neutral";
  impactPercent: number;
  advice: string;
}

const WEATHER_ICONS = {
  sunny: FiSun,
  cloudy: FiCloud,
  rainy: FiCloudRain,
  stormy: FiWind,
};

const WEATHER_COLORS = {
  sunny: "text-amber-500",
  cloudy: "text-gray-500",
  rainy: "text-blue-500",
  stormy: "text-purple-500",
};

export default function WeatherImpact() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedRegion, setSelectedRegion] = useState("North India");

  const regions = [
    "North India",
    "South India", 
    "East India",
    "West India",
    "Central India",
  ];

  useEffect(() => {
    // Simulate weather data (in production, fetch from weather API)
    const generateWeather = () => {
      const month = new Date().getMonth();
      
      // Season-based weather probabilities
      let condition: "sunny" | "cloudy" | "rainy" | "stormy";
      let temperature: number;
      let humidity: number;
      let rainfall: number;
      
      if (month >= 5 && month <= 8) {
        // Monsoon season
        const rand = Math.random();
        if (rand > 0.7) {
          condition = "stormy";
        } else if (rand > 0.3) {
          condition = "rainy";
        } else {
          condition = "cloudy";
        }
        temperature = 25 + Math.random() * 10;
        humidity = 70 + Math.random() * 25;
        rainfall = 50 + Math.random() * 150;
      } else if (month >= 11 || month <= 1) {
        // Winter
        condition = Math.random() > 0.5 ? "sunny" : "cloudy";
        temperature = 10 + Math.random() * 15;
        humidity = 40 + Math.random() * 30;
        rainfall = Math.random() * 20;
      } else {
        // Summer
        condition = Math.random() > 0.7 ? "cloudy" : "sunny";
        temperature = 30 + Math.random() * 15;
        humidity = 30 + Math.random() * 30;
        rainfall = Math.random() * 10;
      }
      
      // Calculate impact based on weather
      let impact: "positive" | "negative" | "neutral";
      let impactPercent: number;
      let advice: string;
      
      if (condition === "rainy" || condition === "stormy") {
        impact = "negative";
        impactPercent = 10 + Math.random() * 15;
        advice = "Heavy rainfall expected. Consider delaying purchases or securing storage.";
      } else if (condition === "sunny" && temperature > 38) {
        impact = "negative";
        impactPercent = 5 + Math.random() * 10;
        advice = "Extreme heat may affect crop quality. Check for temperature-sensitive items.";
      } else {
        impact = "positive";
        impactPercent = 2 + Math.random() * 5;
        advice = "Favorable conditions for market activity. Good time for transactions.";
      }
      
      setWeather({
        condition,
        temperature: Math.round(temperature),
        humidity: Math.round(humidity),
        rainfall: Math.round(rainfall),
        impact,
        impactPercent: Math.round(impactPercent),
        advice,
      });
    };
    
    generateWeather();
  }, [selectedRegion]);

  if (!weather) {
    return (
      <CardComponent title="Weather Impact">
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </CardComponent>
    );
  }

  const WeatherIcon = WEATHER_ICONS[weather.condition];
  const weatherColor = WEATHER_COLORS[weather.condition];

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <FiCloud className="text-blue-500" />
            <span>Weather Impact</span>
          </div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
          >
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm ${weatherColor}`}>
              <WeatherIcon size={28} />
            </div>
            <div>
              <p className="text-2xl font-bold">{weather.temperature}°C</p>
              <p className="text-sm text-gray-500 capitalize">{weather.condition}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              weather.impact === "positive" 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : weather.impact === "negative"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}>
              {weather.impact === "positive" ? "+" : weather.impact === "negative" ? "-" : "±"}
              {weather.impactPercent}% on prices
            </div>
          </div>
        </div>
        
        {/* Weather Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <FiThermometer className="mx-auto text-red-500 mb-1" size={18} />
            <p className="text-lg font-semibold">{weather.temperature}°</p>
            <p className="text-xs text-gray-500">Temperature</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <FiDroplet className="mx-auto text-blue-500 mb-1" size={18} />
            <p className="text-lg font-semibold">{weather.humidity}%</p>
            <p className="text-xs text-gray-500">Humidity</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <FiCloudRain className="mx-auto text-cyan-500 mb-1" size={18} />
            <p className="text-lg font-semibold">{weather.rainfall}mm</p>
            <p className="text-xs text-gray-500">Rainfall</p>
          </div>
        </div>
        
        {/* Advice */}
        <div className={`p-3 rounded-xl text-sm ${
          weather.impact === "positive" 
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
            : weather.impact === "negative"
            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        }`}>
          <p className="font-medium mb-1">📌 Market Advice</p>
          <p className="text-xs">{weather.advice}</p>
        </div>
        
        {/* Affected Commodities */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Most Affected Commodities</p>
          <div className="flex flex-wrap gap-2">
            {["Tomato", "Onion", "Potato", "Leafy Greens"].map((item) => (
              <span
                key={item}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </CardComponent>
  );
}
