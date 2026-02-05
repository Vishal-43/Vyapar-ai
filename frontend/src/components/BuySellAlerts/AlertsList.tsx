import React, { useEffect } from "react";
import { useBuySellAlerts } from "../../context/BuySellAlertContext";
import AlertCard from "./AlertCard";

export default function AlertsList() {
  const { alerts, isLoading, error, fetchAlerts } = useBuySellAlerts();

  useEffect(() => {
    console.log("AlertsList mounted, fetching alerts...");
    fetchAlerts().catch((err) => {
      console.error("Failed to fetch alerts:", err);
    });
  }, []);

  console.log("AlertsList render - isLoading:", isLoading, "alerts:", alerts, "error:", error);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-[rgb(var(--emerald-main))] mx-auto mb-4" style={{ borderRadius: 0 }}></div>
          <p style={{ color: "var(--text-soft)" }}>Loading alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
        <p className="font-semibold text-red-800 dark:text-red-200 mb-2"> Error Loading Alerts</p>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        <button
          onClick={() => fetchAlerts()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-card text-center py-16" style={{ borderStyle: "dashed" }}>
        <p className="text-lg font-medium mb-1" style={{ color: "var(--text-main)" }}>No Buy/Sell Alerts Yet</p>
        <p className="text-sm" style={{ color: "var(--text-soft)" }}>
          Click "Create New Alert" to set up your first buy/sell alert
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
