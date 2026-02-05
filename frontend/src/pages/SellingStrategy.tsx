import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";
import SellingStrategyAdvisor from "../components/SellingStrategy/SellingStrategyAdvisor";

export default function SellingStrategy() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundCorner />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Smart Selling Strategy Advisor</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get the best time-to-sell recommendation using price trends, seasonal peaks, and storage costs.
          </p>
        </header>

        <SellingStrategyAdvisor />
      </main>

      <DashFooter />
    </div>
  );
}
