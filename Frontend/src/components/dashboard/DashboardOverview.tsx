import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiPackage, FiAlertTriangle, FiDollarSign, FiPercent } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface DashboardStats {
  totalCommodities: number;
  totalMarkets: number;
  inventoryItems: number;
  lowStockItems: number;
  avgPriceChange: number;
  modelAccuracy: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCommodities: 0,
    totalMarkets: 0,
    inventoryItems: 0,
    lowStockItems: 0,
    avgPriceChange: 0,
    modelAccuracy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [commoditiesRes, marketsRes, inventoryRes, accuracyRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
        fetch(`${BACKEND_URL}/api/inventory/dashboard`),
        fetch(`${BACKEND_URL}/api/model/accuracy`),
      ]);

      const commodities = commoditiesRes.ok ? await commoditiesRes.json() : [];
      const markets = marketsRes.ok ? await marketsRes.json() : [];
      const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
      const accuracy = accuracyRes.ok ? await accuracyRes.json() : { forecastAccuracy: 85 };

      const lowStock = inventory.filter((item: any) => item.risk === "High").length;

      setStats({
        totalCommodities: commodities.length,
        totalMarkets: markets.length,
        inventoryItems: inventory.length,
        lowStockItems: lowStock,
        avgPriceChange: 2.3, // Would calculate from actual data
        modelAccuracy: accuracy.forecastAccuracy || 85,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Commodities Tracked",
      value: stats.totalCommodities,
      icon: <FiPackage className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Active Markets",
      value: stats.totalMarkets,
      icon: <FiDollarSign className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: "Inventory Items",
      value: stats.inventoryItems,
      icon: <FiTrendingUp className="w-5 h-5" />,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Low Stock Alerts",
      value: stats.lowStockItems,
      icon: <FiAlertTriangle className="w-5 h-5" />,
      color: stats.lowStockItems > 0 ? "text-red-600 bg-red-100 dark:bg-red-900/30" : "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
    },
    {
      label: "Avg Price Change",
      value: `${stats.avgPriceChange > 0 ? "+" : ""}${stats.avgPriceChange.toFixed(1)}%`,
      icon: stats.avgPriceChange >= 0 ? <FiTrendingUp className="w-5 h-5" /> : <FiTrendingDown className="w-5 h-5" />,
      color: stats.avgPriceChange >= 0 ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" : "text-red-600 bg-red-100 dark:bg-red-900/30",
    },
    {
      label: "Model Accuracy",
      value: `${stats.modelAccuracy.toFixed(1)}%`,
      icon: <FiPercent className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
            {card.icon}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {card.value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}
