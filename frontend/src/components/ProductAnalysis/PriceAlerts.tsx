import { useState, useEffect } from "react";
import { FiBell, FiPlus, FiX, FiTrendingUp, FiTrendingDown, FiCheck } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface PriceAlert {
  id: string;
  commodity: string;
  market: string;
  targetPrice: number;
  alertType: "above" | "below";
  isActive: boolean;
  currentPrice?: number;
  triggered?: boolean;
}

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    commodity: "",
    market: "",
    targetPrice: "",
    alertType: "above" as "above" | "below",
  });
  const [commodities, setCommodities] = useState<string[]>([]);
  const [markets, setMarkets] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    // Load saved alerts from localStorage
    const saved = localStorage.getItem("priceAlerts");
    if (saved) {
      setAlerts(JSON.parse(saved));
    }

    // Fetch commodities and markets
    Promise.all([
      fetch(`${BACKEND_URL}/api/commodities`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/markets`).then((r) => r.json()),
    ])
      .then(([commoditiesData, marketsData]) => {
        setCommodities(commoditiesData.map((c: any) => c.name));
        setMarkets(marketsData);
        if (commoditiesData.length > 0) {
          setNewAlert((prev) => ({ ...prev, commodity: commoditiesData[0].name }));
        }
        if (marketsData.length > 0) {
          setNewAlert((prev) => ({ ...prev, market: marketsData[0].name }));
        }
      })
      .catch(console.error);
  }, []);

  // Check alerts against current prices
  useEffect(() => {
    const checkAlerts = async () => {
      const updatedAlerts = await Promise.all(
        alerts.map(async (alert) => {
          try {
            const res = await fetch(
              `${BACKEND_URL}/api/price-history?commodity=${encodeURIComponent(alert.commodity)}&market=${encodeURIComponent(alert.market)}&days=1`
            );
            if (res.ok) {
              const data = await res.json();
              const currentPrice = data.prices?.[0]?.price || 0;
              const triggered =
                alert.alertType === "above"
                  ? currentPrice >= alert.targetPrice
                  : currentPrice <= alert.targetPrice;
              return { ...alert, currentPrice, triggered };
            }
          } catch {
            // Ignore errors
          }
          return alert;
        })
      );
      setAlerts(updatedAlerts);
    };

    if (alerts.length > 0) {
      checkAlerts();
    }
  }, [alerts.length]);

  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem("priceAlerts", JSON.stringify(newAlerts));
  };

  const addAlert = () => {
    if (!newAlert.commodity || !newAlert.market || !newAlert.targetPrice) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      commodity: newAlert.commodity,
      market: newAlert.market,
      targetPrice: Number(newAlert.targetPrice),
      alertType: newAlert.alertType,
      isActive: true,
    };

    saveAlerts([...alerts, alert]);
    setNewAlert({ ...newAlert, targetPrice: "" });
    setShowAddForm(false);
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter((a) => a.id !== id));
  };

  // Toggle alert is available for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleAlert = (id: string) => {
    saveAlerts(
      alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  return (
    <CardComponent
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <FiBell className="text-amber-500" />
            <span>Price Alerts</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            {showAddForm ? <FiX size={18} /> : <FiPlus size={18} />}
          </button>
        </div>
      }
    >
      {/* Add Alert Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Commodity</label>
              <select
                value={newAlert.commodity}
                onChange={(e) => setNewAlert({ ...newAlert, commodity: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {commodities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Market</label>
              <select
                value={newAlert.market}
                onChange={(e) => setNewAlert({ ...newAlert, market: e.target.value })}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                {markets.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Alert Type</label>
              <select
                value={newAlert.alertType}
                onChange={(e) => setNewAlert({ ...newAlert, alertType: e.target.value as "above" | "below" })}
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <option value="above">Price Above</option>
                <option value="below">Price Below</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Target Price (₹)</label>
              <input
                type="number"
                value={newAlert.targetPrice}
                onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                placeholder="2500"
                className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          </div>
          
          <button
            onClick={addAlert}
            className="w-full py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition"
          >
            Create Alert
          </button>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <FiBell size={32} className="mx-auto mb-2 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-xs mt-1">Click + to add an alert</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                alert.triggered
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.alertType === "above" 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-red-500/10 text-red-500"
                }`}>
                  {alert.alertType === "above" ? <FiTrendingUp /> : <FiTrendingDown />}
                </div>
                <div>
                  <p className="text-sm font-medium">{alert.commodity}</p>
                  <p className="text-xs text-gray-500">
                    {alert.market} • {alert.alertType === "above" ? "Above" : "Below"} ₹{alert.targetPrice}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {alert.currentPrice && (
                  <span className="text-xs text-gray-500">
                    ₹{alert.currentPrice.toFixed(0)}
                  </span>
                )}
                {alert.triggered && (
                  <div className="p-1 bg-amber-500 text-white rounded-full">
                    <FiCheck size={12} />
                  </div>
                )}
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <FiX size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </CardComponent>
  );
}
