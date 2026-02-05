import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import CardComponent from "../ui/CardComponent";
import { FiRefreshCw } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface MarketPrice {
  market: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  change: number;
}

interface MarketComparisonProps {
  commodity?: string;
}

export default function MarketComparison({ commodity }: MarketComparisonProps) {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState(commodity || "Potato");
  const [commodities, setCommodities] = useState<string[]>([]);

  useEffect(() => {
    // Fetch commodities list
    fetch(`${BACKEND_URL}/api/commodities`)
      .then((res) => res.json())
      .then((data) => {
        setCommodities(data.map((c: any) => c.name));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchComparison = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/market-comparison?commodity=${encodeURIComponent(selectedCommodity)}`
        );
        if (res.ok) {
          const data = await res.json();
          setPrices(data.markets || []);
        }
      } catch (error) {
        console.error("Failed to fetch market comparison:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparison();
  }, [selectedCommodity]);

  // Find min/max for color coding
  const minPrice = prices.length > 0 ? Math.min(...prices.map((p) => p.price)) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices.map((p) => p.price)) : 0;

  const getBarColor = (price: number) => {
    if (price === minPrice) return "#10b981"; // Cheapest - green
    if (price === maxPrice) return "#ef4444"; // Most expensive - red
    return "#6366f1"; // Others - indigo
  };

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <span>Market Price Comparison</span>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:ring-2 focus:ring-emerald-500"
          >
            {commodities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <FiRefreshCw className="animate-spin text-emerald-500" size={24} />
        </div>
      ) : prices.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No price data available
        </div>
      ) : (
        <>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart
                data={prices}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-soft)", fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="market"
                  tick={{ fill: "var(--text-soft)", fontSize: 11 }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                  formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Price"]}
                />
                <Bar dataKey="price" radius={[0, 4, 4, 0]}>
                  {prices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.price)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span>Lowest Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Highest Price</span>
            </div>
          </div>

          {/* Price Summary */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500">Best Buy</p>
              <p className="text-sm font-bold text-emerald-500">
                {prices.find((p) => p.price === minPrice)?.market}
              </p>
              <p className="text-xs">₹{minPrice.toFixed(0)}/qtl</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Average</p>
              <p className="text-sm font-bold">
                ₹{(prices.reduce((a, b) => a + b.price, 0) / prices.length).toFixed(0)}
              </p>
              <p className="text-xs">per quintal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Price Spread</p>
              <p className="text-sm font-bold text-amber-500">
                {(((maxPrice - minPrice) / minPrice) * 100).toFixed(1)}%
              </p>
              <p className="text-xs">variation</p>
            </div>
          </div>
        </>
      )}
    </CardComponent>
  );
}
