import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import GraphBackgroundBottom from "../components/Background/graphBackgroundBottom";
import SupplyChainTracker from "../components/SupplyChain/SupplyChainTracker";
import { FiTruck, FiMapPin, FiPackage, FiClock, FiPlus } from "react-icons/fi";
import { useState } from "react";

interface NewShipmentForm {
  commodity: string;
  quantity: number;
  origin: string;
  destination: string;
}

export default function SupplyChain() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewShipmentForm>({
    commodity: "",
    quantity: 0,
    origin: "",
    destination: "",
  });

  const handleAddShipment = () => {
    if (!form.commodity || !form.origin || !form.destination || form.quantity <= 0) return;

    const saved = localStorage.getItem("vypaar_shipments");
    const shipments = saved ? JSON.parse(saved) : [];

    const newShipment = {
      id: `SHIP-${Date.now()}`,
      commodity: form.commodity,
      quantity: form.quantity,
      origin: form.origin,
      destination: form.destination,
      status: "pending",
      eta: new Date(Date.now() + 86400000 * 2).toISOString(),
      progress: 0,
      nodes: [
        { id: "1", location: form.origin, type: "farm", status: "active", timestamp: new Date().toISOString(), details: "Ready for pickup" },
        { id: "2", location: "Collection Center", type: "warehouse", status: "delayed", timestamp: "" },
        { id: "3", location: "In Transit", type: "transport", status: "delayed", timestamp: "" },
        { id: "4", location: form.destination, type: "market", status: "delayed", timestamp: "" },
      ],
    };

    shipments.push(newShipment);
    localStorage.setItem("vypaar_shipments", JSON.stringify(shipments));
    
    setForm({ commodity: "", quantity: 0, origin: "", destination: "" });
    setShowForm(false);
    window.location.reload();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundBottom />

      <main className="relative z-10 max-w-7xl mx-auto px-4 pt-28 space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-main)" }}>
              Supply Chain Management
            </h1>
            <p className="mt-1" style={{ color: "var(--text-soft)" }}>
              Track shipments from farm to market
            </p>
          </header>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Add Shipment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FiTruck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>3</p>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>Active Shipments</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>180</p>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>Quintals in Transit</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <FiClock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>2</p>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>Pending Pickup</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <FiMapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>5</p>
                <p className="text-sm" style={{ color: "var(--text-soft)" }}>Delivery Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supply Chain Tracker */}
        <SupplyChainTracker />

        {/* Add Shipment Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4" style={{ color: "var(--text-main)" }}>
                Add New Shipment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-soft)" }}>
                    Commodity
                  </label>
                  <input
                    type="text"
                    value={form.commodity}
                    onChange={(e) => setForm({ ...form, commodity: e.target.value })}
                    placeholder="e.g., Potato, Onion"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-soft)" }}>
                    Quantity (Quintals)
                  </label>
                  <input
                    type="number"
                    value={form.quantity || ""}
                    onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-soft)" }}>
                    Origin
                  </label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm({ ...form, origin: e.target.value })}
                    placeholder="e.g., Agra Farm"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-soft)" }}>
                    Destination
                  </label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="e.g., Delhi Mandi"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg border font-medium hover:opacity-70 transition-opacity"
                  style={{ borderColor: "var(--border)", color: "var(--text-main)", background: "var(--panel)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddShipment}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  Add Shipment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <DashFooter />
    </div>
  );
}
