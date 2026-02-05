import { useState, useEffect } from "react";
import { FiBell, FiX, FiCheck, FiAlertTriangle, FiInfo, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Notification {
  id: string;
  type: "price_alert" | "inventory" | "recommendation" | "system";
  title: string;
  message: string;
  severity: "info" | "warning" | "success" | "error";
  timestamp: string;
  read: boolean;
  link?: string;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications
    const interval = setInterval(checkForNewNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = () => {
    const saved = localStorage.getItem("vypaar_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      // Generate initial notifications
      const initial: Notification[] = [
        {
          id: "1",
          type: "price_alert",
          title: "Price Alert: Potato",
          message: "Potato prices have increased by 5% in Delhi market",
          severity: "warning",
          timestamp: new Date().toISOString(),
          read: false,
        },
        {
          id: "2",
          type: "recommendation",
          title: "New Recommendation",
          message: "AI suggests buying Onion - prices expected to rise",
          severity: "info",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          link: "/recommendations",
        },
        {
          id: "3",
          type: "inventory",
          title: "Low Stock Alert",
          message: "Tomato stock is below optimal level",
          severity: "error",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          link: "/inventory",
        },
        {
          id: "4",
          type: "system",
          title: "Model Retrained",
          message: "Price prediction model has been updated with latest data",
          severity: "success",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true,
        },
      ];
      setNotifications(initial);
      localStorage.setItem("vypaar_notifications", JSON.stringify(initial));
    }
  };

  const checkForNewNotifications = async () => {
    try {
      // Check for new insights that could be notifications
      const response = await fetch(`${BACKEND_URL}/api/ai/insights`);
      if (response.ok) {
        const insights = await response.json();
        if (insights.length > 0) {
          const latestInsight = insights[0];
          const existingIds = notifications.map(n => n.id);
          
          if (!existingIds.includes(`insight-${latestInsight.id}`)) {
            const newNotification: Notification = {
              id: `insight-${latestInsight.id}`,
              type: "price_alert",
              title: latestInsight.title,
              message: latestInsight.reason,
              severity: latestInsight.priority === "high" ? "warning" : "info",
              timestamp: new Date().toISOString(),
              read: false,
            };
            
            const updated = [newNotification, ...notifications].slice(0, 20);
            setNotifications(updated);
            localStorage.setItem("vypaar_notifications", JSON.stringify(updated));
          }
        }
      }
    } catch (error) {
      // Silently fail
    }
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("vypaar_notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("vypaar_notifications", JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("vypaar_notifications", JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem("vypaar_notifications");
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "warning":
        return <FiAlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <FiCheck className="w-5 h-5 text-emerald-500" />;
      case "error":
        return <FiTrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "success":
        return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <FiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <FiBell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                      !notification.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getSeverityBg(notification.severity)} border`}>
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-900 dark:text-white ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
