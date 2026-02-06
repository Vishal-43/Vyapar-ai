import { useEffect, useState } from "react";
import { FiBarChart2, FiCheckCircle, FiClock, FiTrendingUp, FiDatabase } from "react-icons/fi";
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Skeleton } from "../components/common";
import DashFooter from "../components/dashboard/Home/dashFooter";
import { useRecommendations } from "../context/RecommendationContext";
import type {
  Recommendation,
  RecommendationHistoryItem,
} from "../context/RecommendationContext";

const tabs = [
  { id: "active", label: "Active", icon: <FiTrendingUp /> },
  { id: "history", label: "History", icon: <FiClock /> },
  { id: "metrics", label: "Metrics", icon: <FiBarChart2 /> },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "BUY":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
    case "SELL":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
    case "STOCK_UP":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
    case "STOCK_DOWN":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200";
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case "HIGH":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-200";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-200";
  }
};

export default function Recommendations() {
  const [activeTab, setActiveTab] = useState("active");
  const [useDummyData, setUseDummyData] = useState(false);
  const [dummyRecommendations, setDummyRecommendations] = useState<Recommendation[]>([]);
  const [dummyHistory, setDummyHistory] = useState<RecommendationHistoryItem[]>([]);
  const [dummyMetrics, setDummyMetrics] = useState<any>(null);
  
  const {
    recommendations,
    history,
    metrics,
    isLoading,
    error,
    successMessage,
    fetchRecommendations,
    fetchHistory,
    fetchMetrics,
    acknowledgeRecommendation,
  } = useRecommendations();

  const generateDummyData = () => {
    // Generate dummy active recommendations
    const dummyRecs: Recommendation[] = [
      {
        id: 1,
        commodity_name: "Wheat",
        market_name: "Azadpur Mandi",
        recommendation_type: "BUY",
        confidence: "HIGH",
        reasoning: "Strong upward trend detected based on seasonal demand and reduced supply from neighboring regions. Historical patterns show 15-20% price increase during this period.",
        current_price: 2450.00,
        target_price: 2800.00,
        expected_change_pct: 14.3,
        time_horizon: "SHORT_TERM",
        created_at: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: 2,
        commodity_name: "Potato",
        market_name: "Mumbai APMC",
        recommendation_type: "SELL",
        confidence: "MEDIUM",
        reasoning: "Market oversupply expected in the next 2 weeks. Cold storage levels are at 85% capacity. Price correction anticipated by 10-12%.",
        current_price: 1850.00,
        target_price: 1650.00,
        expected_change_pct: -10.8,
        time_horizon: "MID_TERM",
        created_at: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: 3,
        commodity_name: "Tomato",
        market_name: "Bangalore",
        recommendation_type: "STOCK_UP",
        confidence: "HIGH",
        reasoning: "Festival season approaching with high demand expected. Weather forecasts show unfavorable conditions for next harvest, suggesting supply constraints.",
        current_price: 3200.00,
        target_price: 4100.00,
        expected_change_pct: 28.1,
        time_horizon: "SHORT_TERM",
        created_at: new Date().toISOString(),
        acknowledged: true,
      },
      {
        id: 4,
        commodity_name: "Onion",
        market_name: "Nashik",
        recommendation_type: "STOCK_DOWN",
        confidence: "MEDIUM",
        reasoning: "New harvest arriving in markets causing oversupply. Government intervention likely if prices continue falling. Recommend reducing inventory.",
        current_price: 2100.00,
        target_price: 1750.00,
        expected_change_pct: -16.7,
        time_horizon: "MID_TERM",
        created_at: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: 5,
        commodity_name: "Rice",
        market_name: "Delhi",
        recommendation_type: "BUY",
        confidence: "HIGH",
        reasoning: "Export demand rising with government relaxing restrictions. Basmati varieties showing strong price momentum with 12% increase in last 10 days.",
        current_price: 3800.00,
        target_price: 4300.00,
        expected_change_pct: 13.2,
        time_horizon: "LONG_TERM",
        created_at: new Date().toISOString(),
        acknowledged: false,
      },
      {
        id: 6,
        commodity_name: "Cotton",
        market_name: "Ahmedabad",
        recommendation_type: "SELL",
        confidence: "LOW",
        reasoning: "International prices weakening due to global oversupply. Textile sector demand showing signs of slowdown. Consider gradual selling strategy.",
        current_price: 5600.00,
        target_price: 5200.00,
        expected_change_pct: -7.1,
        time_horizon: "LONG_TERM",
        created_at: new Date().toISOString(),
        acknowledged: false,
      },
    ];

    // Generate dummy history
    const dummyHist: RecommendationHistoryItem[] = [
      {
        id: 101,
        commodity_name: "Sugarcane",
        recommendation_type: "BUY",
        confidence: "HIGH",
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "SUCCESS",
        actual_change_pct: 18.5,
        roi_pct: 22.3,
      },
      {
        id: 102,
        commodity_name: "Soybean",
        recommendation_type: "SELL",
        confidence: "MEDIUM",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "SUCCESS",
        actual_change_pct: -12.3,
        roi_pct: 15.7,
      },
      {
        id: 103,
        commodity_name: "Maize",
        recommendation_type: "STOCK_UP",
        confidence: "HIGH",
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "PARTIAL",
        actual_change_pct: 8.2,
        roi_pct: 5.1,
      },
      {
        id: 104,
        commodity_name: "Chili",
        recommendation_type: "BUY",
        confidence: "LOW",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "FAILURE",
        actual_change_pct: -3.5,
        roi_pct: -4.2,
      },
      {
        id: 105,
        commodity_name: "Turmeric",
        recommendation_type: "SELL",
        confidence: "MEDIUM",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        outcome: "SUCCESS",
        actual_change_pct: -9.8,
        roi_pct: 11.2,
      },
    ];

    // Generate dummy metrics
    const dummyMets = {
      total_recommendations: 32,
      correct_count: 24,
      incorrect_count: 5,
      partial_count: 3,
      accuracy_rate: 0.75,
      average_roi_pct: 12.8,
      by_type_accuracy: {
        BUY: 0.82,
        SELL: 0.78,
        STOCK_UP: 0.71,
        STOCK_DOWN: 0.65,
      },
      generated_at: new Date().toISOString(),
    };

    setDummyRecommendations(dummyRecs);
    setDummyHistory(dummyHist);
    setDummyMetrics(dummyMets);
    setUseDummyData(true);
  };

  const clearDummyData = () => {
    setUseDummyData(false);
    setDummyRecommendations([]);
    setDummyHistory([]);
    setDummyMetrics(null);
  };

  useEffect(() => {
    if (!useDummyData) {
      if (activeTab === "active") {
        fetchRecommendations();
      } else if (activeTab === "history") {
        fetchHistory();
      } else if (activeTab === "metrics") {
        fetchMetrics();
      }
    }
  }, [activeTab, fetchRecommendations, fetchHistory, fetchMetrics, useDummyData]);

  // Use dummy data if enabled, otherwise use real data
  const displayRecommendations = useDummyData ? dummyRecommendations : recommendations;
  const displayHistory = useDummyData ? dummyHistory : history;
  const displayMetrics = useDummyData ? dummyMetrics : metrics;

  const renderActive = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {displayRecommendations.map((rec: Recommendation) => (
        <div
          key={rec.id}
          className="glass-card p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold truncate" style={{ color: "var(--text-main)" }}>
                {rec.commodity_name}
              </h3>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-soft)" }}>
                {rec.market_name || "Market"} • {rec.time_horizon.replace("_", " ")}
              </p>
            </div>
            <span
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold whitespace-nowrap ${getTypeColor(
                rec.recommendation_type
              )}`}
            >
              {rec.recommendation_type}
            </span>
          </div>

          <div className="space-y-2 text-sm p-3 sm:p-4 mb-4" style={{ background: "rgba(var(--glass-white), 0.3)", borderRadius: 0 }}>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--text-soft)" }}>Current Price</span>
              <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                ₹{rec.current_price?.toFixed(2) ?? "--"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--text-soft)" }}>Target Price</span>
              <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                ₹{rec.target_price?.toFixed(2) ?? "--"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: "var(--text-soft)" }}>Expected Change</span>
              <span className={`font-semibold ${
                (rec.expected_change_pct ?? 0) > 0 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {rec.expected_change_pct?.toFixed(1) ?? "--"}%
              </span>
            </div>
          </div>

          <div className="text-sm mb-4 line-clamp-3" style={{ color: "var(--text-soft)" }}>
            {rec.reasoning}
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <span
              className={`px-2.5 sm:px-3 py-1 text-xs font-semibold ${getConfidenceColor(
                rec.confidence
              )}`}
            >
              {rec.confidence}
            </span>

            {rec.acknowledged ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <FiCheckCircle className="w-4 h-4" /> Acknowledged
              </span>
            ) : (
              <button
                onClick={() => !useDummyData && acknowledgeRecommendation(rec.id)}
                disabled={useDummyData}
                className="px-3 sm:px-4 py-2 bg-[rgb(var(--emerald-main))] text-white text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Acknowledge
              </button>
            )}
          </div>
        </div>
      ))}

      {displayRecommendations.length === 0 && (
        <div className="col-span-full glass-card text-center py-12 sm:py-16" style={{ borderStyle: "dashed" }}>
          <p style={{ color: "var(--text-soft)" }}>No active recommendations yet.</p>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <tr className="text-left text-gray-600 dark:text-gray-400">
            <th className="px-3 sm:px-4 py-3 font-semibold">Commodity</th>
            <th className="px-3 sm:px-4 py-3 font-semibold">Type</th>
            <th className="px-3 sm:px-4 py-3 font-semibold">Outcome</th>
            <th className="px-3 sm:px-4 py-3 font-semibold">Change</th>
            <th className="px-3 sm:px-4 py-3 font-semibold">ROI</th>
            <th className="px-3 sm:px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {displayHistory.map((item: RecommendationHistoryItem, index: number) => (
            <tr
              key={item.id}
              className={`${
                index !== displayHistory.length - 1 
                  ? "border-b border-gray-200 dark:border-gray-800" 
                  : ""
              } text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors`}
            >
              <td className="px-3 sm:px-4 py-3 font-medium whitespace-nowrap">{item.commodity_name}</td>
              <td className="px-3 sm:px-4 py-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getTypeColor(
                    item.recommendation_type
                  )}`}
                >
                  {item.recommendation_type}
                </span>
              </td>
              <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.outcome === "SUCCESS" 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
                }`}>
                  {item.outcome}
                </span>
              </td>
              <td className={`px-3 sm:px-4 py-3 font-semibold whitespace-nowrap ${
                (item.actual_change_pct ?? 0) > 0 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {item.actual_change_pct?.toFixed(1) ?? "--"}%
              </td>
              <td className={`px-3 sm:px-4 py-3 font-semibold whitespace-nowrap ${
                (item.roi_pct ?? 0) > 0 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-red-600 dark:text-red-400"
              }`}>
                {item.roi_pct?.toFixed(1) ?? "--"}%
              </td>
              <td className="px-3 sm:px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {new Date(item.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {displayHistory.length === 0 && (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          No historical recommendations yet.
        </div>
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">Accuracy Rate</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {displayMetrics ? `${Math.round(displayMetrics.accuracy_rate * 100)}%` : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">Average ROI</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {displayMetrics ? `${displayMetrics.average_roi_pct.toFixed(1)}%` : "--"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">Total Recommendations</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {displayMetrics ? displayMetrics.total_recommendations : "--"}
          </p>
        </div>
      </div>

      {displayMetrics && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Accuracy by Type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(displayMetrics.by_type_accuracy).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{key}</span>
                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {Math.round((value as number) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--text-main)" }}>
            Recommendations
          </h1>
          <p className="text-sm sm:text-base" style={{ color: "var(--text-soft)" }}>
            Actionable buy/sell insights with confidence scores and history.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border ${
                activeTab === tab.id
                  ? "bg-[rgb(var(--emerald-main))] text-white"
                  : "glass-card"
              }`}
              style={activeTab !== tab.id ? { color: "var(--text-main)" } : {}}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          
          {/* Dummy Data Toggle Button */}
          <div className="ml-auto">
            {!useDummyData ? (
              <button
                onClick={generateDummyData}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all"
              >
                <FiDatabase className="w-4 h-4" />
                <span className="hidden sm:inline">Load Sample Data</span>
                <span className="sm:hidden">Sample</span>
              </button>
            ) : (
              <button
                onClick={clearDummyData}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border transition-all glass-card"
                style={{ color: "var(--text-main)" }}
              >
                <FiDatabase className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Sample Data</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>
        </div>

        {useDummyData && (
          <div className="mb-6 border px-4 py-3 flex items-center gap-2" style={{ borderColor: "rgba(147, 51, 234, 0.3)", background: "rgba(147, 51, 234, 0.1)", color: "var(--text-main)" }}>
            <FiDatabase className="w-4 h-4" />
            <span className="text-sm">Viewing sample data - Switch to clear and view real data</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 border px-4 py-3" style={{ borderColor: "rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.1)", color: "var(--text-main)" }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 border px-4 py-3" style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", color: "var(--text-main)" }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : activeTab === "active" ? (
          renderActive()
        ) : activeTab === "history" ? (
          renderHistory()
        ) : (
          renderMetrics()
        )}
      </main>

      <DashFooter />
    </DashboardLayout>
  );
}
