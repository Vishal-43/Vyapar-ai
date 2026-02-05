import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import CardComponent from "../ui/CardComponent";
import { FiCalendar } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface SeasonalData {
  month: string;
  price: number;
  avgPrice: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Seasonal patterns for different commodities (percentage multiplier)
const SEASONAL_PATTERNS: Record<string, number[]> = {
  "Potato": [1.1, 1.05, 0.95, 0.9, 0.85, 0.9, 1.0, 1.1, 1.15, 1.2, 1.15, 1.1],
  "Onion": [1.0, 0.95, 0.9, 0.85, 0.8, 0.9, 1.1, 1.25, 1.3, 1.2, 1.1, 1.0],
  "Tomato": [0.9, 0.85, 0.8, 0.85, 0.95, 1.1, 1.25, 1.3, 1.2, 1.1, 1.0, 0.95],
  "Wheat": [1.0, 0.95, 0.9, 0.85, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.1, 1.05],
  "Rice": [1.0, 1.0, 0.95, 0.95, 0.9, 0.9, 0.95, 1.0, 1.05, 1.1, 1.1, 1.05],
};

export default function SeasonalTrends() {
  const [commodity, setCommodity] = useState("Potato");
  const [commodities, setCommodities] = useState<string[]>([]);
  const [seasonalData, setSeasonalData] = useState<SeasonalData[]>([]);
  const [currentMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/commodities`)
      .then((r) => r.json())
      .then((data) => {
        setCommodities(data.map((c: any) => c.name));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Generate seasonal trend data
    const pattern = SEASONAL_PATTERNS[commodity] || Array(12).fill(1);
    const basePrice = {
      "Potato": 1200,
      "Onion": 1500,
      "Tomato": 2000,
      "Wheat": 2200,
      "Rice": 3500,
    }[commodity] || 2000;

    const data = MONTHS.map((month, idx) => ({
      month,
      price: Math.round(basePrice * pattern[idx] * (0.95 + Math.random() * 0.1)),
      avgPrice: Math.round(basePrice * pattern[idx]),
    }));

    setSeasonalData(data);
  }, [commodity]);

  // Find best months to buy/sell
  const sortedByPrice = [...seasonalData].sort((a, b) => a.avgPrice - b.avgPrice);
  const bestBuyMonths = sortedByPrice.slice(0, 3).map((d) => d.month);
  const bestSellMonths = sortedByPrice.slice(-3).reverse().map((d) => d.month);

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-purple-500" />
            <span>Seasonal Price Trends</span>
          </div>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg border-0"
          >
            {commodities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seasonalData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--text-soft)", fontSize: 10 }}
                axisLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fill: "var(--text-soft)", fontSize: 10 }}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
                formatter={(value) => [`₹${value}`, "Price"]}
              />
              <Legend />
              
              {/* Average trend line */}
              <Line
                type="monotone"
                dataKey="avgPrice"
                name="Avg Trend"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              
              {/* Current year prices */}
              <Line
                type="monotone"
                dataKey="price"
                name="This Year"
                stroke="#10b981"
                strokeWidth={2}
                dot={(props) => {
                  const { cx, cy, index } = props;
                  if (index === currentMonth) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#10b981"
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={3} fill="#10b981" />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Best Months */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
              🛒 Best Months to Buy
            </p>
            <div className="flex gap-2">
              {bestBuyMonths.map((m) => (
                <span
                  key={m}
                  className="px-2 py-1 bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
              💰 Best Months to Sell
            </p>
            <div className="flex gap-2">
              {bestSellMonths.map((m) => (
                <span
                  key={m}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Current Position */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
          <p className="font-medium text-blue-700 dark:text-blue-300">
            📍 Current: {MONTHS[currentMonth]}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {bestBuyMonths.includes(MONTHS[currentMonth])
              ? "Good time to buy - prices are typically lower this month."
              : bestSellMonths.includes(MONTHS[currentMonth])
              ? "Good time to sell - prices are typically higher this month."
              : "Moderate pricing period - consider market conditions."}
          </p>
        </div>
      </div>
    </CardComponent>
  );
}
