import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import { ContextAnalysisProvider } from "../context/ContextAnalysis";

import SelectorComponent from "../components/ProductAnalysis/SelectorComponent";
import StockComponent from "../components/ProductAnalysis/StockComponent";
import PriceChart from "../components/ProductAnalysis/PriceChart";
import DemandGraph from "../components/ProductAnalysis/DemandGraph";
import ImpactComponent from "../components/ProductAnalysis/ImpactComponent";
import MarketComparison from "../components/ProductAnalysis/MarketComparison";
import ProfitCalculator from "../components/ProductAnalysis/ProfitCalculator";
import PriceAlerts from "../components/ProductAnalysis/PriceAlerts";
import ExportData from "../components/ProductAnalysis/ExportData";

const ProductAnalysis = () => {
  return (
    <ContextAnalysisProvider>
      <Navbar />
      <main
        className="mx-auto px-4 pt-20 pb-12 space-y-8 max-w-6xl">
          <header>
            <h1 className="text-3xl font-semibold">
              Product Analysis
            </h1>
            <p className="text-soft">
              In-depth insights and recommendations for your products
            </p>
          </header>
        <SelectorComponent />
        
        {/* Price Chart - Full Width */}
        <PriceChart />
        
        {/* Market Comparison & Profit Calculator - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MarketComparison />
          <ProfitCalculator />
        </div>
        
        {/* Stock Metrics */}
        <StockComponent />
        
        {/* Demand Graph */}
        <DemandGraph />
        
        {/* Price Alerts & Export - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceAlerts />
          <ExportData />
        </div>
        
        {/* Impact Analysis */}
        <ImpactComponent />
      </main>

      <DashFooter />
    </ContextAnalysisProvider>
  );
};

export default ProductAnalysis;
