import { useState } from "react";
import { FiPlus, FiX, FiPackage } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  commodities: { id: number; name: string }[];
  markets: { id: number; name: string }[];
}

function AddStockModal({ isOpen, onClose, onSuccess, commodities, markets }: AddStockModalProps) {
  const [formData, setFormData] = useState({
    commodity_id: "",
    market_id: "",
    quantity: "",
    unit_cost: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodity_id: parseInt(formData.commodity_id),
          market_id: parseInt(formData.market_id),
          quantity: parseFloat(formData.quantity),
          unit_cost: parseFloat(formData.unit_cost) || 0,
          notes: formData.notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add stock");
      }

      onSuccess();
      onClose();
      setFormData({ commodity_id: "", market_id: "", quantity: "", unit_cost: "", notes: "" });
    } catch (err) {
      setError("Failed to add stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiPackage className="text-emerald-500" />
            Add New Stock
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Commodity Select */}
          <div>
            <label className="block text-sm font-medium mb-2">Commodity</label>
            <select
              required
              value={formData.commodity_id}
              onChange={(e) => setFormData({ ...formData, commodity_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select commodity</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Market Select */}
          <div>
            <label className="block text-sm font-medium mb-2">Market</label>
            <select
              required
              value={formData.market_id}
              onChange={(e) => setFormData({ ...formData, market_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select market</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantity (Quintals)</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="100"
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium mb-2">Unit Cost (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="2500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddStockButtonProps {
  onRefresh?: () => void;
}

export default function AddStockButton({ onRefresh }: AddStockButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commodities, setCommodities] = useState<{ id: number; name: string }[]>([]);
  const [markets, setMarkets] = useState<{ id: number; name: string }[]>([]);

  const fetchOptions = async () => {
    try {
      const [commoditiesRes, marketsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
      ]);

      if (commoditiesRes.ok) {
        const data = await commoditiesRes.json();
        setCommodities(data);
      }

      if (marketsRes.ok) {
        const data = await marketsRes.json();
        setMarkets(data);
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
    }
  };

  const handleOpenModal = () => {
    fetchOptions();
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <CardComponent title="Add New Stock">
        <p className="text-sm text-soft leading-relaxed mb-4">
          Add new inventory items to track your stock levels and get AI-powered
          recommendations.
        </p>
        <button
          onClick={handleOpenModal}
          className="
            w-full py-3 text-sm font-semibold
            bg-emerald-600 text-white hover:bg-emerald-700 
            hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)] 
            active:scale-[0.98]
            transition flex items-center justify-center gap-2
          "
        >
          <FiPlus size={18} />
          Add Stock
        </button>
      </CardComponent>

      <AddStockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        commodities={commodities}
        markets={markets}
      />
    </>
  );
}
