import { useState, useEffect } from "react";
import { FiStar, FiTrendingUp, FiTrendingDown, FiPlus, FiTrash2, FiRefreshCw } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface WatchlistItem {
  id: string;
  commodity: string;
  market: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export default function WatchlistCard() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [commodities, setCommodities] = useState<{ id: number; name: string }[]>([]);
  const [markets, setMarkets] = useState<{ id: number; name: string }[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");

  useEffect(() => {
    fetchWatchlist();
    fetchCommoditiesAndMarkets();
  }, []);

  const fetchCommoditiesAndMarkets = async () => {
    try {
      const [commRes, marketRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
      ]);
      if (commRes.ok) setCommodities(await commRes.json());
      if (marketRes.ok) setMarkets(await marketRes.json());
    } catch (error) {
      console.error("Failed to fetch commodities/markets:", error);
    }
  };

  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage and fetch fresh prices
      const saved = localStorage.getItem("vypaar_watchlist");
      if (saved) {
        const items = JSON.parse(saved) as WatchlistItem[];
        // Fetch fresh prices for each item
        const updatedItems = await Promise.all(
          items.map(async (item) => {
            try {
              const res = await fetch(
                `${BACKEND_URL}/api/price-history?commodity=${item.commodity}&market=${item.market}&days=2`
              );
              if (res.ok) {
                const data = await res.json();
                if (data.prices && data.prices.length > 0) {
                  const latestPrice = data.prices[data.prices.length - 1].price;
                  const previousPrice = data.prices.length > 1 
                    ? data.prices[data.prices.length - 2].price 
                    : latestPrice;
                  const change = latestPrice - previousPrice;
                  return {
                    ...item,
                    price: latestPrice,
                    change: change,
                    changePercent: previousPrice > 0 ? (change / previousPrice) * 100 : 0,
                    lastUpdated: new Date().toISOString(),
                  };
                }
              }
            } catch {
              // Keep existing data on error
            }
            return item;
          })
        );
        setWatchlist(updatedItems);
        localStorage.setItem("vypaar_watchlist", JSON.stringify(updatedItems));
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!selectedCommodity || !selectedMarket) return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/price-history?commodity=${selectedCommodity}&market=${selectedMarket}&days=2`
      );
      
      let price = 0;
      let change = 0;
      
      if (res.ok) {
        const data = await res.json();
        if (data.prices && data.prices.length > 0) {
          price = data.prices[data.prices.length - 1].price;
          if (data.prices.length > 1) {
            change = price - data.prices[data.prices.length - 2].price;
          }
        }
      }

      const newItem: WatchlistItem = {
        id: `${selectedCommodity}-${selectedMarket}-${Date.now()}`,
        commodity: selectedCommodity,
        market: selectedMarket,
        price: price,
        change: change,
        changePercent: price > 0 ? (change / (price - change)) * 100 : 0,
        lastUpdated: new Date().toISOString(),
      };

      const updated = [...watchlist, newItem];
      setWatchlist(updated);
      localStorage.setItem("vypaar_watchlist", JSON.stringify(updated));
      setShowAddForm(false);
      setSelectedCommodity("");
      setSelectedMarket("");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    }
  };

  const removeFromWatchlist = (id: string) => {
    const updated = watchlist.filter((item) => item.id !== id);
    setWatchlist(updated);
    localStorage.setItem("vypaar_watchlist", JSON.stringify(updated));
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiStar className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Watchlist
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchWatchlist}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Select Commodity</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">Select Market</option>
              {markets.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={addToWatchlist}
            disabled={!selectedCommodity || !selectedMarket}
            className="w-full py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Watchlist
          </button>
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FiStar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No items in watchlist</p>
          <p className="text-sm mt-1">Add commodities to track prices</p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div
              key={item.id}
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
              <div className="text-right mr-3">
                <p className="font-semibold text-gray-900 dark:text-white">
                  ₹{item.price.toFixed(2)}
                </p>
                <div
                  className={`flex items-center justify-end gap-1 text-xs ${
                    item.change >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {item.change >= 0 ? (
                    <FiTrendingUp className="w-3 h-3" />
                  ) : (
                    <FiTrendingDown className="w-3 h-3" />
                  )}
                  {item.changePercent.toFixed(2)}%
                </div>
              </div>
              <button
                onClick={() => removeFromWatchlist(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
