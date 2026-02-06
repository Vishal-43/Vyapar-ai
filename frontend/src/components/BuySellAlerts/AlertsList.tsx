import React, { useEffect } from "react";
import { useBuySellAlerts } from "../../context/BuySellAlertContext";
import AlertCard from "./AlertCard";

export default function AlertsList() {
  const { alerts, isLoading, error, fetchAlerts } = useBuySellAlerts();

  useEffect(() => {
    // console.log("AlertsList mounted, fetching alerts...");
    fetchAlerts().catch((err) => {
      console.error("Failed to fetch alerts:", err);
    });
  }, []);

  // console.log("AlertsList render - isLoading:", isLoading, "alerts:", alerts, "error:", error);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 glass-card rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium tracking-wide animate-pulse">Scanning Markets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        <p className="font-bold text-lg mb-2 text-red-800 dark:text-red-300">Unable to Fetch Alerts</p>
        <p className="text-red-600 dark:text-red-400 text-sm mb-6 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => fetchAlerts()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-lg hover:shadow-red-600/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-card text-center py-20 rounded-2xl border-2" style={{ borderStyle: "dashed", borderColor: "var(--border)" }}>
        <p className="text-xl font-medium mb-2" style={{ color: "var(--text-main)" }}>No Buy/Sell Alerts Yet</p>
        <p className="text-base" style={{ color: "var(--text-soft)" }}>
          Click "Create New Alert" to set up your first buy/sell alert
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
