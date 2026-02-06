import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundBottom from "../components/Background/graphBackgroundBottom";

import { ContextAnalysisProvider } from "../context/ContextAnalysis";
import ActionRequiredCard from "../components/Inventory/ActionRequiredCard";
import DecisionInsightCard from "../components/Inventory/DecisionInsightCard";
import StockCompare from "../components/Inventory/StockCompare";
import YourStock from "../components/Inventory/YourStock";
import StockComponent from "../components/ProductAnalysis/StockComponent";
import BulkImport from "../components/Inventory/BulkImport";
import { InventoryProvider } from "../context/InventoryContext";
import { ForecastProvider } from "../context/ForecastContext";

export default function Inventory() {
  return (
    <ContextAnalysisProvider>
      <div className="relative min-h-screen overflow-hidden">
        {}
        <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

        <Navbar />
        <GraphBackgroundBottom />

        <main className="relative z-10 max-w-7xl mx-auto px-4 pt-28 space-y-8 pb-12">
          {}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Inventory Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor stock levels and get AI-powered recommendations
            </p>
          </div>

          {}
          <StockComponent />

          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActionRequiredCard />
            <DecisionInsightCard />
          </div>

          {}
          <StockCompare />

          {}
          <ForecastProvider>
            <InventoryProvider>
              <BulkImport />
            </InventoryProvider>
          </ForecastProvider>
        </main>

        <DashFooter />
      </div>
    </ContextAnalysisProvider>
  );
}
