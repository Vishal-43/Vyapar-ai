import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiRefreshCw } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface PriceItem {
  commodity: string;
  market: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function TopPricesWidget() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"gainers" | "losers" | "all">("all");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const [commoditiesRes, marketsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
      ]);

      if (!commoditiesRes.ok || !marketsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const commodities = await commoditiesRes.json();
      const markets = await marketsRes.json();

      const priceData: PriceItem[] = [];

      // Get prices for each commodity in first market
      for (const commodity of commodities.slice(0, 10)) {
        for (const market of markets.slice(0, 2)) {
          try {
            const res = await fetch(
              `${BACKEND_URL}/api/price-history?commodity=${commodity.name}&market=${market.name}&days=2`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.prices && data.prices.length > 0) {
                const latestPrice = data.prices[data.prices.length - 1].price;
                const previousPrice = data.prices.length > 1 
                  ? data.prices[data.prices.length - 2].price 
                  : latestPrice;
                const change = latestPrice - previousPrice;
                
                priceData.push({
                  commodity: commodity.name,
                  market: market.name,
                  price: latestPrice,
                  change: change,
                  changePercent: previousPrice > 0 ? (change / previousPrice) * 100 : 0,
                });
              }
            }
          } catch {
            // Skip failed requests
          }
        }
      }

      setPrices(priceData);
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrices = prices
    .filter((p) => {
      if (view === "gainers") return p.changePercent > 0;
      if (view === "losers") return p.changePercent < 0;
      return true;
    })
    .sort((a, b) => {
      if (view === "gainers") return b.changePercent - a.changePercent;
      if (view === "losers") return a.changePercent - b.changePercent;
      return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    })
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Price Movements
        </h3>
        <button
          onClick={fetchPrices}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "gainers", "losers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              view === tab
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            {tab === "all" ? "All" : tab === "gainers" ? "Top Gainers" : "Top Losers"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : filteredPrices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No price data available
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPrices.map((item, idx) => (
            <div
              key={`${item.commodity}-${item.market}-${idx}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {item.commodity}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.market}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{item.price.toFixed(2)}
                </p>
                <div
                  className={`flex items-center justify-end gap-1 text-xs ${
                    item.changePercent > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : item.changePercent < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500"
                  }`}
                >
                  {item.changePercent > 0 ? (
                    <FiTrendingUp className="w-3 h-3" />
                  ) : item.changePercent < 0 ? (
                    <FiTrendingDown className="w-3 h-3" />
                  ) : (
                    <FiMinus className="w-3 h-3" />
                  )}
                  {item.changePercent >= 0 ? "+" : ""}
                  {item.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
