import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundTop from "../components/Background/graphBackgroundTop";
import { InsightProvider } from "../context/InsightContext";
import InsightCard from "../components/Insights/InsightCard";

export default function Insights() {
  return (
    <InsightProvider>
      <div className="relative min-h-screen overflow-hidden">
        {}
        <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

        <Navbar />
        <GraphBackgroundTop />

        <main className="relative z-10 max-w-5xl mx-auto px-4 pt-28 space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">
              AI Insights & Alerts
            </h1>
            <p className="text-soft mt-1">
              Actionable intelligence derived from demand, weather, and market signals.
            </p>
          </header>

          <InsightCard />
        </main>

        <DashFooter />
      </div>
    </InsightProvider>
  );
}
