import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiArrowRight } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Mover {
  commodity: string;
  market: string;
  price: number;
  change: number;
  trend: "up" | "down";
}

export default function TopMovers() {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"gainers" | "losers">("gainers");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovers = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/commodities`);
        if (!res.ok) return;
        
        const commodities = await res.json();
        const movers: Mover[] = [];

        // Get price changes for each commodity
        for (const commodity of commodities.slice(0, 10)) {
          try {
            const priceRes = await fetch(
              `${BACKEND_URL}/api/market-comparison?commodity=${encodeURIComponent(commodity.name)}`
            );
            if (priceRes.ok) {
              const data = await priceRes.json();
              if (data.markets && data.markets.length > 0) {
                const market = data.markets[0];
                movers.push({
                  commodity: commodity.name,
                  market: market.market,
                  price: market.price,
                  change: market.change,
                  trend: market.change >= 0 ? "up" : "down",
                });
              }
            }
          } catch {
            // Skip failed requests
          }
        }

        // Sort by change
        const sorted = movers.sort((a, b) => b.change - a.change);
        setGainers(sorted.filter((m) => m.change > 0).slice(0, 5));
        setLosers(sorted.filter((m) => m.change < 0).slice(-5).reverse());
      } catch (error) {
        console.error("Failed to fetch movers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovers();
  }, []);

  const currentList = activeTab === "gainers" ? gainers : losers;

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <span>Top Movers</span>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab("gainers")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                activeTab === "gainers"
                  ? "bg-emerald-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setActiveTab("losers")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                activeTab === "losers"
                  ? "bg-red-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Losers
            </button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No {activeTab} found
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((mover, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition"
              onClick={() => navigate("/dashboard/analysis")}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    mover.trend === "up"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                      : "bg-red-100 dark:bg-red-900/30 text-red-600"
                  }`}
                >
                  {mover.trend === "up" ? (
                    <FiTrendingUp size={14} />
                  ) : (
                    <FiTrendingDown size={14} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{mover.commodity}</p>
                  <p className="text-xs text-gray-500">{mover.market}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-semibold">₹{mover.price.toFixed(0)}</p>
                <p
                  className={`text-xs font-medium ${
                    mover.trend === "up" ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {mover.change >= 0 ? "+" : ""}
                  {mover.change.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
          
          <button
            onClick={() => navigate("/dashboard/analysis")}
            className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-1 transition"
          >
            View All <FiArrowRight size={14} />
          </button>
        </div>
      )}
    </CardComponent>
  );
}
