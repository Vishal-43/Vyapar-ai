import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";
import WatchlistCard from "../components/Watchlist/WatchlistCard";
import MarketNewsCard from "../components/MarketNews/MarketNewsCard";
import PriceAnalytics from "../components/analytics/PriceAnalytics";
import { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function Watchlist() {
  const [commodities, setCommodities] = useState<{ id: number; name: string }[]>([]);
  const [markets, setMarkets] = useState<{ id: number; name: string }[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState("Potato");
  const [selectedMarket, setSelectedMarket] = useState("Delhi");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [commRes, marketRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
      ]);
      if (commRes.ok) {
        const data = await commRes.json();
        setCommodities(data);
        if (data.length > 0) setSelectedCommodity(data[0].name);
      }
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarkets(data);
        if (data.length > 0) setSelectedMarket(data[0].name);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundCorner />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-28 space-y-8 pb-12">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">
            Watchlist & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your favorite commodities and monitor price movements
          </p>
        </header>

        {/* Commodity Selector for Analytics */}
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Analytics Chart */}
        <PriceAnalytics commodity={selectedCommodity} market={selectedMarket} />

        {/* Watchlist and News Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WatchlistCard />
          <MarketNewsCard />
        </div>
      </main>

      <DashFooter />
    </div>
  );
}
