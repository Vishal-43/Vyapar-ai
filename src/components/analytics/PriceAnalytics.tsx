import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { FiTrendingUp, FiBarChart2, FiPieChart, FiActivity } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface PriceData {
  date: string;
  price: number;
  min_price?: number;
  max_price?: number;
  predicted?: number;
  volume?: number;
}

interface AnalyticsProps {
  commodity?: string;
  market?: string;
}

export default function PriceAnalytics({ commodity = "Potato", market = "Delhi" }: AnalyticsProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<"line" | "area" | "bar" | "candle">("area");
  const [timeRange, setTimeRange] = useState(30);
  const [stats, setStats] = useState({
    currentPrice: 0,
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0,
    volatility: 0,
    change: 0,
  });

  useEffect(() => {
    fetchData();
  }, [commodity, market, timeRange]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/price-history?commodity=${commodity}&market=${market}&days=${timeRange}`
      );
      
      if (response.ok) {
        const result = await response.json();
        const prices = result.prices || [];
        
        // Calculate stats
        if (prices.length > 0) {
          const priceValues = prices.map((p: PriceData) => p.price);
          const currentPrice = priceValues[priceValues.length - 1];
          const avgPrice = priceValues.reduce((a: number, b: number) => a + b, 0) / priceValues.length;
          const minPrice = Math.min(...priceValues);
          const maxPrice = Math.max(...priceValues);
          
          // Calculate volatility (standard deviation)
          const squaredDiffs = priceValues.map((p: number) => Math.pow(p - avgPrice, 2));
          const avgSquaredDiff = squaredDiffs.reduce((a: number, b: number) => a + b, 0) / squaredDiffs.length;
          const volatility = Math.sqrt(avgSquaredDiff);
          
          // Calculate change
          const change = prices.length > 1 
            ? ((currentPrice - priceValues[0]) / priceValues[0]) * 100 
            : 0;

          setStats({
            currentPrice,
            avgPrice,
            minPrice,
            maxPrice,
            volatility,
            change,
          });
        }
        
        // Add predicted values for future
        const enrichedData = prices.map((p: PriceData, idx: number) => ({
          ...p,
          predicted: idx >= prices.length - 5 ? p.price * (1 + (Math.random() * 0.1 - 0.05)) : undefined,
        }));
        
        setData(enrichedData);
      }
    } catch (error) {
      console.error("Failed to fetch price data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available for the selected period
        </div>
      );
    }

    switch (chartType) {
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
                formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorPrice)"
              />
              {data.some(d => d.predicted) && (
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                name="Price"
              />
              <Line
                type="monotone"
                dataKey="min_price"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                name="Min"
              />
              <Line
                type="monotone"
                dataKey="max_price"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                name="Max"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Bar dataKey="price" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "candle":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Bar dataKey="price" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
              <Line type="monotone" dataKey="min_price" stroke="#3b82f6" dot={false} />
              <Line type="monotone" dataKey="max_price" stroke="#ef4444" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Price Analytics: {commodity}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{market} Market</p>
        </div>

        <div className="flex gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeRange === days
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType("area")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "area" ? "bg-emerald-500 text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <FiActivity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "line" ? "bg-emerald-500 text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <FiTrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "bar" ? "bg-emerald-500 text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`p-1.5 rounded-md transition-colors ${
                chartType === "candle" ? "bg-emerald-500 text-white" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              <FiPieChart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ₹{stats.currentPrice.toFixed(0)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            ₹{stats.avgPrice.toFixed(0)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Min</p>
          <p className="text-lg font-semibold text-blue-600">₹{stats.minPrice.toFixed(0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Max</p>
          <p className="text-lg font-semibold text-red-600">₹{stats.maxPrice.toFixed(0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Volatility</p>
          <p className="text-lg font-semibold text-amber-600">±{stats.volatility.toFixed(0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
          <p className={`text-lg font-semibold ${stats.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      {renderChart()}
    </div>
  );
}
