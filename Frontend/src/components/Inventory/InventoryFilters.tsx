import CardComponent from "../ui/CardComponent";
import { useInventory } from "../../context/InventoryContext";
import { useForecast } from "../../context/ForecastContext";

export default function InventoryFilters() {
  const { filters, setFilters, updateStock, isUpdating } =
    useInventory();

  const { markets, categories, products } = useForecast();

  const canUpdate =
    Boolean(filters.market || filters.category || filters.product) &&
    !isUpdating;

  return (
    <CardComponent title="Filter Inventory">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {}
        <select
          className="border px-3 py-2 text-sm bg-transparent"
          value={filters.market ?? ""}
          onChange={(e) =>
            setFilters({
              market: e.target.value || undefined,
            })
          }
        >
          <option value="">All Markets</option>
          {markets.map((m) => (
            <option key={m.id} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>

        {}
        <select
          className="border px-3 py-2 text-sm bg-transparent"
          value={filters.category ?? ""}
          onChange={(e) =>
            setFilters({
              category:
                (e.target.value as typeof filters.category) ||
                undefined,
              product: undefined,
            })
          }
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {}
        <select
          className="border px-3 py-2 text-sm bg-transparent"
          value={filters.product ?? ""}
          disabled={!filters.category}
          onChange={(e) =>
            setFilters({
              product: e.target.value || undefined,
            })
          }
        >
          <option value="">All Products</option>
          {products
            .filter(
              (p) =>
                !filters.category ||
                p.category === filters.category
            )
            .map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      {}
      <button
        onClick={updateStock}
        disabled={!canUpdate}
        className="
          mt-4 w-full px-4 py-3
          text-sm font-semibold
          bg-emerald-600 text-white
          hover:bg-emerald-700
          hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)]
          active:scale-[0.98]
          disabled:opacity-50
          disabled:cursor-not-allowed
          transition
        "
      >
        {isUpdating ? "Updating Stock…" : "Update Stock"}
      </button>
    </CardComponent>
  );
}
