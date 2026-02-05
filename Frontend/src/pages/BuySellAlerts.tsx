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
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-main)" }}>
      <GraphBackgroundCorner />
      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-20">
        {}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Buy/Sell Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up automatic buy and sell signals based on price thresholds
          </p>
        </div>

        {}
        <div className="mb-8 flex gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-5 sm:px-6 py-2.5 sm:py-3 font-semibold transition-all ${
              showForm
                ? "glass-card text-main"
                : "bg-[rgb(var(--emerald-main))] text-white hover:opacity-90"
            }`}
          >
            {showForm ? " Hide Form" : "+ Create New Alert"}
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "var(--text-main)" }}>
            Your Alerts
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
