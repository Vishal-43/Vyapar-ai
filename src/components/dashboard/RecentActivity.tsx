import { useState, useEffect } from "react";
import { FiTrendingUp, FiTrendingDown, FiPackage, FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ActivityItem {
  id: string;
  type: "price_change" | "inventory" | "recommendation" | "alert";
  title: string;
  description: string;
  timestamp: string;
  icon: "up" | "down" | "package" | "alert" | "check";
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Fetch insights to create activity feed
      const insightsRes = await fetch(`${BACKEND_URL}/api/ai/insights`);
      const insights = insightsRes.ok ? await insightsRes.json() : [];

      const activityItems: ActivityItem[] = [];

      // Add insights as activities
      insights.slice(0, 3).forEach((insight: any, idx: number) => {
        activityItems.push({
          id: `insight-${idx}`,
          type: "price_change",
          title: insight.title,
          description: insight.reason,
          timestamp: new Date().toISOString(),
          icon: insight.title.includes("momentum") ? "up" : "down",
        });
      });

      // Add some simulated recent activities
      activityItems.push(
        {
          id: "inv-1",
          type: "inventory",
          title: "Inventory Updated",
          description: "Stock levels synchronized with latest data",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          icon: "package",
        },
        {
          id: "rec-1",
          type: "recommendation",
          title: "New Buy Signal",
          description: "AI detected favorable buying opportunity",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: "check",
        },
        {
          id: "alert-1",
          type: "alert",
          title: "Price Alert Triggered",
          description: "Target price reached for monitored commodity",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          icon: "alert",
        }
      );

      setActivities(activityItems.slice(0, 6));
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "up":
        return <FiTrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <FiTrendingDown className="w-4 h-4 text-red-500" />;
      case "package":
        return <FiPackage className="w-4 h-4 text-blue-500" />;
      case "alert":
        return <FiAlertCircle className="w-4 h-4 text-amber-500" />;
      case "check":
        return <FiCheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, idx) => (
            <div
              key={activity.id}
              className={`flex gap-3 ${
                idx !== activities.length - 1
                  ? "pb-3 border-b border-gray-100 dark:border-gray-800"
                  : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                {getIcon(activity.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
