import React, { useState } from "react";
import { useBuySellAlerts } from "../../context/BuySellAlertContext";

interface BuySellAlert {
  id: number;
  commodity_id: number;
  commodity_name: string;
  market_id: number;
  market_name: string;
  buy_threshold: number;
  sell_threshold: number;
  current_price: number | null;
  signal: "BUY" | "SELL" | "HOLD" | null;
  signal_strength: "STRONG" | "MODERATE" | "WEAK" | null;
  priority: string;
  enabled: boolean;
  notification_channels: string[];
  message?: string;
  created_at: string;
}

interface AlertCardProps {
  alert: BuySellAlert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const { deleteAlert, updateAlert } = useBuySellAlerts();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this alert?")) {
      setIsDeleting(true);
      try {
        await deleteAlert(alert.id);
      } catch (error) {
        console.error("Failed to delete alert:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleToggleEnabled = async () => {
    try {
      await updateAlert(alert.id, { enabled: !alert.enabled });
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }
  };

  const getSignalColor = (signal: string | null) => {
    switch (signal) {
      case "BUY":
        return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "SELL":
        return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default:
        return "glass-card";
    }
  };

  const getSignalBadgeColor = (signal: string | null) => {
    switch (signal) {
      case "BUY":
        return "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300";
      case "SELL":
        return "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300";
      default:
        return ""; // Use CSS variables for default
    }
  };

  const getPriceStatus = (current: number | null, buy: number, sell: number) => {
    if (!current) return "Unknown";
    if (current <= buy) return "Below Buy";
    if (current >= sell) return "Above Sell";
    return "In Range";
  };

  return (
    <div className={`border rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${getSignalColor(alert.signal)}`}>
      {}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg" style={{ color: "var(--text-main)" }}>
            {alert.commodity_name}
          </h3>
          <p className="text-sm" style={{ color: "var(--text-soft)" }}>{alert.market_name}</p>
        </div>
        {alert.signal && (
          <span
            className={`px-3 py-1 text-xs font-semibold whitespace-nowrap ml-2 ${getSignalBadgeColor(
              alert.signal
            )}`}
            style={{ 
              borderRadius: 0,
              ...(alert.signal !== "BUY" && alert.signal !== "SELL" && { 
                background: "var(--panel)", 
                color: "var(--text-main)",
                border: "1px solid var(--border)"
              })
            }}
          >
            {alert.signal} {alert.signal_strength && `(${alert.signal_strength})`}
          </span>
        )}
      </div>

      {}
      <div className="space-y-3 mb-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        {alert.current_price !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80" style={{ color: "var(--text-soft)" }}>Current Price:</span>
            <span className="font-semibold" style={{ color: "var(--text-main)" }}>
              ₹{alert.current_price.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80" style={{ color: "var(--text-soft)" }}>Buy Threshold:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            ₹{alert.buy_threshold.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm opacity-80" style={{ color: "var(--text-soft)" }}>Sell Threshold:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            ₹{alert.sell_threshold.toFixed(2)}
          </span>
        </div>
        {alert.current_price !== null && (
          <div className="flex justify-between items-center">
            <span className="text-sm opacity-80" style={{ color: "var(--text-soft)" }}>Status:</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
              {getPriceStatus(alert.current_price, alert.buy_threshold, alert.sell_threshold)}
            </span>
          </div>
        )}
      </div>

      {}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-80" style={{ color: "var(--text-soft)" }}>Priority:</span>
          <span className="font-medium" style={{ color: "var(--text-main)" }}>{alert.priority}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="opacity-80" style={{ color: "var(--text-soft)" }}>Status:</span>
          <span
            className={`font-medium ${
              alert.enabled
                ? "text-green-600 dark:text-green-400"
                : ""
            }`}
            style={!alert.enabled ? { color: "var(--text-soft)" } : {}}
          >
            {alert.enabled ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {}
      <div className="flex gap-2">
        <button
          onClick={handleToggleEnabled}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            alert.enabled
              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
              : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
          }`}
        >
          {alert.enabled ? "Disable" : "Enable"}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {isDeleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
