import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import CardComponent from "../ui/CardComponent";
import { useContextAnalysis } from "../../context/ContextAnalysis";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface PriceDataPoint {
  date: string;
  price: number;
  predicted?: number;
  min_price?: number;
  max_price?: number;
}

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: "1W", days: 7 },
  { label: "2W", days: 14 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
];

export default function PriceChart() {
  const { selectorData } = useContextAnalysis();
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[2]); // Default 1M
  const [isLoading, setIsLoading] = useState(true);
  const [priceChange, setPriceChange] = useState<{ value: number; percent: number }>({ value: 0, percent: 0 });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (!selectorData.product || !selectorData.market) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetch(
          `${BACKEND_URL}/api/price-history?` +
            `commodity=${encodeURIComponent(selectorData.product)}` +
            `&market=${encodeURIComponent(selectorData.market)}` +
            `&days=${selectedRange.days}`
        );

        if (res.ok) {
          const data = await res.json();
          setPriceData(data.prices || []);
          setNotice(data.notice || null);

          // Calculate price change
          if (data.prices && data.prices.length >= 2) {
            const firstPrice = data.prices[0].price;
            const lastPrice = data.prices[data.prices.length - 1].price;
            const change = lastPrice - firstPrice;
            const percentChange = ((change / firstPrice) * 100);
            setPriceChange({ value: change, percent: percentChange });
          }
        }
      } catch (error) {
        console.error("Failed to fetch price history:", error);
        setNotice("Unable to fetch price history right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPriceHistory();
  }, [selectorData.product, selectorData.market, selectedRange]);

  // Calculate chart bounds
  const prices = priceData.map((d) => d.price).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;

  // Determine color based on price trend
  const isPositive = priceChange.value >= 0;
  const chartColor = isPositive ? "#10b981" : "#ef4444";
  const chartColorRgb = isPositive ? "16, 185, 129" : "239, 68, 68";

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <span>Price History</span>
            {currentPrice > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">₹{currentPrice.toFixed(0)}</span>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {priceChange.percent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedRange.label === range.label
                    ? "bg-emerald-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : priceData.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-gray-500 gap-2 text-sm">
          <span>Select a commodity and market to view price history</span>
          {notice && (
            <span className="text-xs text-amber-600 dark:text-amber-400">{notice}</span>
          )}
        </div>
      ) : (
        <div className="h-80 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <AreaChart
              data={priceData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-soft)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                }}
              />

              <YAxis
                domain={[minPrice * 0.95, maxPrice * 1.05]}
                tick={{ fill: "var(--text-soft)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value.toFixed(0)}`}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                }}
                formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Price"]}
              />

              {/* Average Price Line */}
              <ReferenceLine
                y={avgPrice}
                stroke="#6b7280"
                strokeDasharray="5 5"
                label={{
                  value: `Avg: ₹${avgPrice.toFixed(0)}`,
                  position: "right",
                  fill: "#6b7280",
                  fontSize: 10,
                }}
              />

              {/* Price Area */}
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#priceGradient)"
                animationDuration={1000}
                dot={false}
                activeDot={{
                  r: 6,
                  stroke: chartColor,
                  strokeWidth: 2,
                  fill: "var(--bg-main)",
                }}
              />

              {/* Predicted Prices (if available) */}
              {priceData.some((d) => d.predicted) && (
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke={`rgba(${chartColorRgb}, 0.5)`}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="none"
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {notice && priceData.length > 0 && (
        <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          {notice}
        </div>
      )}

      {/* Price Stats */}
      {priceData.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">High</p>
            <p className="text-sm font-semibold text-emerald-500">₹{maxPrice.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Low</p>
            <p className="text-sm font-semibold text-red-500">₹{minPrice.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
            <p className="text-sm font-semibold">₹{avgPrice.toFixed(0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Volatility</p>
            <p className="text-sm font-semibold">
              {(((maxPrice - minPrice) / avgPrice) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </CardComponent>
  );
}
