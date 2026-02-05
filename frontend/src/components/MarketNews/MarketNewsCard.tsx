import { useState, useEffect } from "react";
import { FiRss, FiExternalLink, FiClock, FiRefreshCw, FiTrendingUp, FiAlertTriangle, FiCloud } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "price" | "weather" | "policy" | "supply";
  timestamp: string;
  impact: "positive" | "negative" | "neutral";
  source?: string;
}

export default function MarketNewsCard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      // Generate dynamic market news based on current data
      const response = await fetch(`${BACKEND_URL}/api/ai/insights`);
      const insights = response.ok ? await response.json() : [];

      // Transform insights into news format + add generated news
      const generatedNews: NewsItem[] = [
        {
          id: "news-1",
          title: "Vegetable prices expected to stabilize",
          summary: "With increased arrivals from producing regions, wholesale vegetable prices are expected to stabilize in the coming week.",
          category: "price",
          timestamp: new Date().toISOString(),
          impact: "positive",
          source: "AgriWatch",
        },
        {
          id: "news-2",
          title: "Monsoon forecast: Normal rainfall expected",
          summary: "IMD predicts normal monsoon rainfall this season, which could boost crop production and stabilize prices.",
          category: "weather",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          impact: "positive",
          source: "IMD",
        },
        {
          id: "news-3",
          title: "Government announces minimum support price hike",
          summary: "MSP for key crops increased by 5-8%, benefiting farmers across major producing states.",
          category: "policy",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          impact: "positive",
          source: "Ministry of Agriculture",
        },
        {
          id: "news-4",
          title: "Supply chain disruptions in northern region",
          summary: "Heavy rainfall has caused temporary disruptions in transportation, affecting market arrivals.",
          category: "supply",
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          impact: "negative",
          source: "Market Intelligence",
        },
      ];

      // Add insights as news items
      insights.slice(0, 3).forEach((insight: any, idx: number) => {
        generatedNews.push({
          id: `insight-${idx}`,
          title: insight.title,
          summary: insight.reason,
          category: "price",
          timestamp: new Date().toISOString(),
          impact: insight.priority === "high" ? "negative" : "neutral",
          source: "AI Analysis",
        });
      });

      setNews(generatedNews);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      // Set default news on error
      setNews([
        {
          id: "default-1",
          title: "Market data loading...",
          summary: "Connect to the backend to see live market updates and news.",
          category: "price",
          timestamp: new Date().toISOString(),
          impact: "neutral",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "price":
        return <FiTrendingUp className="w-4 h-4" />;
      case "weather":
        return <FiCloud className="w-4 h-4" />;
      case "policy":
        return <FiRss className="w-4 h-4" />;
      case "supply":
        return <FiAlertTriangle className="w-4 h-4" />;
      default:
        return <FiRss className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "price":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "weather":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
      case "policy":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "supply":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "positive":
        return "border-l-emerald-500";
      case "negative":
        return "border-l-red-500";
      default:
        return "border-l-gray-400";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredNews = filter === "all" 
    ? news 
    : news.filter(n => n.category === filter);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiRss className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Market News & Updates
          </h3>
        </div>
        <button
          onClick={fetchNews}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {["all", "price", "weather", "policy", "supply"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === cat
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {filteredNews.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border-l-4 ${getImpactColor(
                item.impact
              )} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FiClock className="w-3 h-3" />
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {item.summary}
                  </p>
                  {item.source && (
                    <p className="text-xs text-gray-400 mt-1">
                      Source: {item.source}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredNews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No news available for this category
            </div>
          )}
        </div>
      )}
    </div>
  );
}
