import React, { useState, useEffect } from "react";
import { useBuySellAlerts } from "../../context/BuySellAlertContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface Commodity {
  id: number;
  name: string;
  category: string;
}

interface Market {
  id: number;
  name: string;
  state: string;
}

interface CreateAlertFormProps {
  onSuccess?: () => void;
}

export default function CreateAlertForm({ onSuccess }: CreateAlertFormProps) {
  const { createAlert, fetchAlerts } = useBuySellAlerts();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    commodity_id: "",
    market_id: "",
    buy_threshold: "",
    sell_threshold: "",
    priority: "MEDIUM",
    notification_channels: ["in_app"],
    message: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching commodities and markets from:", BACKEND_URL);
        const [commodRes, marketsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/v1/market-data/commodities?limit=100`),
          fetch(`${BACKEND_URL}/api/v1/market-data/markets?limit=100`),
        ]);

        console.log("Commodities response status:", commodRes.status);
        console.log("Markets response status:", marketsRes.status);

        if (commodRes.ok) {
          const data = await commodRes.json();
          console.log("Commodities data:", data);
          const commArray = Array.isArray(data) ? data : (data.data || data.commodities || []);
          setCommodities(commArray);
        }
        if (marketsRes.ok) {
          const data = await marketsRes.json();
          console.log("Markets data:", data);
          const mktArray = Array.isArray(data) ? data : (data.data || data.markets || []);
          setMarkets(mktArray);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!formData.commodity_id || !formData.market_id) {
        throw new Error("Please select commodity and market");
      }

      const buyThreshold = parseFloat(formData.buy_threshold);
      const sellThreshold = parseFloat(formData.sell_threshold);

      if (isNaN(buyThreshold) || isNaN(sellThreshold)) {
        throw new Error("Please enter valid prices");
      }

      if (buyThreshold >= sellThreshold) {
        throw new Error("Buy threshold must be less than sell threshold");
      }

      await createAlert({
        commodity_id: parseInt(formData.commodity_id),
        market_id: parseInt(formData.market_id),
        buy_threshold: buyThreshold,
        sell_threshold: sellThreshold,
        priority: formData.priority,
        notification_channels: formData.notification_channels,
        message: formData.message || undefined,
        enabled: true,
      });

      setFormData({
        commodity_id: "",
        market_id: "",
        buy_threshold: "",
        sell_threshold: "",
        priority: "MEDIUM",
        notification_channels: ["in_app"],
        message: "",
      });

      await fetchAlerts();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
      console.error("Error creating alert:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-6 sm:p-8 rounded-2xl border shadow-lg relative overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-400"></div>
      
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold" style={{ color: "var(--text-main)" }}>
          Set New Price Alert
        </h3>
        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-lg">
          Automated Monitoring
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl text-sm flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {}
        <div className="space-y-2">
          <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
            Commodity <span className="text-red-500">*</span>
          </label>
          <div className="relative">
              <select
                value={formData.commodity_id}
                onChange={(e) => setFormData({ ...formData, commodity_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                style={{ 
                  borderColor: "var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text-main)",
                }}
                required
              >
                <option value="">Select commodity</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
          </div>
        </div>

        {}
        <div className="space-y-2">
          <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
            Market <span className="text-red-500">*</span>
          </label>
          <div className="relative">
              <select
                value={formData.market_id}
                onChange={(e) => setFormData({ ...formData, market_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                style={{ 
                  borderColor: "var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text-main)",
                }}
                required
              >
                <option value="">Select market</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.state})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
          </div>
        </div>

        {}
        <div className="space-y-2">
          <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
            Buy Threshold (₹) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.buy_threshold}
                onChange={(e) => setFormData({ ...formData, buy_threshold: e.target.value })}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                style={{ 
                  borderColor: "var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text-main)",
                }}
                required
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-soft)" }}>₹</div>
          </div>
        </div>

        {}
        <div className="space-y-2">
          <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
            Sell Threshold (₹) <span className="text-red-500">*</span>
          </label>
           <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sell_threshold}
                onChange={(e) => setFormData({ ...formData, sell_threshold: e.target.value })}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                style={{ 
                  borderColor: "var(--border)", 
                  background: "var(--panel)", 
                  color: "var(--text-main)",
                }}
                required
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--text-soft)" }}>₹</div>
          </div>
        </div>

        {}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
            Priority
          </label>
          <div className="flex gap-4 p-1 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
             {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.priority === p 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : ''
                    }`}
                    style={formData.priority !== p ? { background: "transparent", color: "var(--text-soft)" } : {}}
                    onMouseEnter={(e) => { if (formData.priority !== p) e.currentTarget.style.background = "var(--border)"; }}
                    onMouseLeave={(e) => { if (formData.priority !== p) e.currentTarget.style.background = "transparent"; }}
                >
                    {p}
                </button>
             ))}
          </div>
        </div>
      </div>

      {}
      <div className="mb-8 space-y-2">
        <label className="block text-sm font-medium opacity-90" style={{ color: "var(--text-main)" }}>
          Alert Message (Optional)
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Add a custom note describing why you set this alert..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
          style={{ 
            borderColor: "var(--border)", 
            background: "var(--panel)", 
            color: "var(--text-main)",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Alert...
            </>
        ) : (
            <>
                <span>Create Alert</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </>
        )}
      </button>
    </form>
  );
}
