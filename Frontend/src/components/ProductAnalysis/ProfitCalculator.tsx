import { useState, useEffect } from "react";
import { FiDollarSign, FiTrendingUp, FiPercent, FiPackage } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface CalculatorInputs {
  commodity: string;
  buyMarket: string;
  sellMarket: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  transportCost: number;
  otherCosts: number;
}

export default function ProfitCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    commodity: "Potato",
    buyMarket: "",
    sellMarket: "",
    quantity: 100,
    buyPrice: 0,
    sellPrice: 0,
    transportCost: 500,
    otherCosts: 200,
  });
  
  const [commodities, setCommodities] = useState<string[]>([]);
  const [markets, setMarkets] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/commodities`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/markets`).then((r) => r.json()),
    ])
      .then(([commoditiesData, marketsData]) => {
        setCommodities(commoditiesData.map((c: any) => c.name));
        setMarkets(marketsData);
        if (marketsData.length >= 2) {
          setInputs((prev) => ({
            ...prev,
            buyMarket: marketsData[0].name,
            sellMarket: marketsData[1].name,
          }));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch prices when commodity or markets change
  useEffect(() => {
    const fetchPrices = async () => {
      if (!inputs.buyMarket || !inputs.sellMarket) return;
      
      try {
        const [buyRes, sellRes] = await Promise.all([
          fetch(
            `${BACKEND_URL}/api/price-history?commodity=${encodeURIComponent(inputs.commodity)}&market=${encodeURIComponent(inputs.buyMarket)}&days=1`
          ),
          fetch(
            `${BACKEND_URL}/api/price-history?commodity=${encodeURIComponent(inputs.commodity)}&market=${encodeURIComponent(inputs.sellMarket)}&days=1`
          ),
        ]);

        if (buyRes.ok && sellRes.ok) {
          const buyData = await buyRes.json();
          const sellData = await sellRes.json();
          
          const buyPrice = buyData.prices?.[0]?.price || 0;
          const sellPrice = sellData.prices?.[0]?.price || 0;
          
          setInputs((prev) => ({
            ...prev,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      }
    };

    fetchPrices();
  }, [inputs.commodity, inputs.buyMarket, inputs.sellMarket]);

  // Calculate profits
  const totalBuyCost = inputs.buyPrice * inputs.quantity;
  const totalSellRevenue = inputs.sellPrice * inputs.quantity;
  const totalCosts = totalBuyCost + inputs.transportCost + inputs.otherCosts;
  const netProfit = totalSellRevenue - totalCosts;
  const profitMargin = totalSellRevenue > 0 ? (netProfit / totalSellRevenue) * 100 : 0;
  const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
  const isProfitable = netProfit > 0;

  return (
    <CardComponent title="Profit Calculator">
      <div className="space-y-4">
        {/* Commodity Selection */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Commodity</label>
          <select
            value={inputs.commodity}
            onChange={(e) => setInputs({ ...inputs, commodity: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {commodities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Market Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Buy From</label>
            <select
              value={inputs.buyMarket}
              onChange={(e) => setInputs({ ...inputs, buyMarket: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sell At</label>
            <select
              value={inputs.sellMarket}
              onChange={(e) => setInputs({ ...inputs, sellMarket: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              {markets.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity and Prices */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Quantity (Qtl)</label>
            <input
              type="number"
              value={inputs.quantity}
              onChange={(e) => setInputs({ ...inputs, quantity: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Buy Price (₹)</label>
            <input
              type="number"
              value={inputs.buyPrice}
              onChange={(e) => setInputs({ ...inputs, buyPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Sell Price (₹)</label>
            <input
              type="number"
              value={inputs.sellPrice}
              onChange={(e) => setInputs({ ...inputs, sellPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Additional Costs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Transport Cost (₹)</label>
            <input
              type="number"
              value={inputs.transportCost}
              onChange={(e) => setInputs({ ...inputs, transportCost: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Other Costs (₹)</label>
            <input
              type="number"
              value={inputs.otherCosts}
              onChange={(e) => setInputs({ ...inputs, otherCosts: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div className={`mt-4 p-4 rounded-xl ${isProfitable ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isProfitable ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                <FiDollarSign className={isProfitable ? "text-emerald-500" : "text-red-500"} size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Profit</p>
                <p className={`text-lg font-bold ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>
                  ₹{netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isProfitable ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                <FiPercent className={isProfitable ? "text-emerald-500" : "text-red-500"} size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Profit Margin</p>
                <p className={`text-lg font-bold ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <FiTrendingUp className="text-blue-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">ROI</p>
                <p className="text-lg font-bold text-blue-600">{roi.toFixed(1)}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FiPackage className="text-purple-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Investment</p>
                <p className="text-lg font-bold text-purple-600">
                  ₹{totalCosts.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`text-center text-sm font-medium ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>
          {isProfitable
            ? `✅ Profitable trade! You can earn ₹${(netProfit / inputs.quantity).toFixed(0)} per quintal`
            : "⚠️ This trade may result in a loss. Consider other markets."}
        </div>
      </div>
    </CardComponent>
  );
}
