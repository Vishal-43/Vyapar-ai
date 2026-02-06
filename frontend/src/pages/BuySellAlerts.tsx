import React, { useState } from "react";
import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import { BuySellAlertProvider } from "../context/BuySellAlertContext";
import AlertsList from "../components/BuySellAlerts/AlertsList";
import CreateAlertForm from "../components/BuySellAlerts/CreateAlertForm";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";

function BuySellAlertsContent() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      <GraphBackgroundCorner />
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-20">
        {}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight" style={{ color: "var(--text-main)" }}>Buy/Sell Alerts</h1>
          <p className="text-lg max-w-2xl" style={{ color: "var(--text-soft)" }}>
            Set up automatic buy and sell signals based on price thresholds. 
            Get notified instantly when opportunities arise.
          </p>
        </div>

        {}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
              showForm
                ? "text-white hover:bg-purple-700"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
            }`}
            style={showForm ? { background: "var(--panel)", border: "2px solid var(--border)", color: "var(--text-main)" } : {}}
          >
            {showForm ? (
                <>
                  <span>Close Form</span>
                </>
            ) : (
                <>
                  <span>+ Create New Alert</span>
                </>
            )}
          </button>
        </div>

        {}
        {showForm && (
          <div className="mb-6 sm:mb-8">
            <CreateAlertForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        {}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: "var(--text-main)" }}>
            <span className="w-2 h-8 rounded-full bg-emerald-500 block"></span>
            Your Active Alerts
          </h2>
          <AlertsList />
        </div>
      </main>

      <DashFooter />
    </div>
  );
}

export default function BuySellAlerts() {
  return (
    <BuySellAlertProvider>
      <BuySellAlertsContent />
    </BuySellAlertProvider>
  );
}
