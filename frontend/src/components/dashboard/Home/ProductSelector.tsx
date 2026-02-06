import { Package } from "lucide-react";
import { useForecast } from "../../../context/ForecastContext";

const inputBase =
  "w-full h-12 rounded-xl px-4 text-sm transition-colors " +
  "bg-black border border-gray-300 " +
  "dark:bg-white/5 dark:border-white/10 " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export default function ProductSelector() {
  const {
    selection,
    setSelection,
    products,
    categories,
  } = useForecast();

  const filteredProducts = products.filter(
    (p) => p.category === selection.category
  );

  return (
    <div className="glass-card p-6 space-y-5">
      {}
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-emerald-600" />
        <h3 className="font-medium">Product Configuration</h3>
      </div>

      {}
      <select
        className={inputBase}
        value={selection.category ?? ""}
        onChange={(e) =>
          setSelection({
            category: e.target.value,
            product: undefined,
          })
        }
      >
        <option value="">Select Category</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {}
      <select
        className={inputBase}
        disabled={!selection.category}
        value={selection.product ?? ""}
        onChange={(e) =>
          setSelection({
            product: e.target.value,
          })
        }
      >
        <option value="">Select Product</option>
        {filteredProducts.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
