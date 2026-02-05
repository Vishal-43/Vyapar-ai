import TableComponent from "../ui/TableComponent";
import CardComponent from "../ui/CardComponent";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../../context/InventoryContext";
import AddStockButton from "./AddStockButton";

export default function YourStock() {
  const { inventory, isUpdating, isLoading, updateItem } = useInventory();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"></div>
        <CardComponent title="Forecast Actions">
          <p className="text-sm text-soft leading-relaxed mb-2">
            Modify your forecast configuration such as time horizon (7 or 14 days),
          </p>
          <button
            onClick={() => navigate("/dashboard/selector")}
            className="w-full py-3 text-sm font-semibold bg-emerald-600 dark:text-white text-black hover:bg-emerald-700 hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)] active:scale-[0.98] transition"
          >
            Change Forecast
          </button>
        </CardComponent>
      </div>

      <TableComponent
        title="Your Stocks"
        loading={isLoading || isUpdating}
        columns={[
          { key: "product", label: "Product" },

          {
            key: "current",
            label: "Current Stock",
            align: "right",
            render: (value, row) => (
              <input
                type="number"
                value={value}
                onChange={(e) => updateItem(row.id, parseFloat(e.target.value) || 0)}
                className="
                  w-20 px-2 py-1 text-right
                  bg-transparent border border-gray-300
                  dark:border-gray-600
                  rounded text-sm
                  focus:outline-none focus:border-emerald-500
                "
                min="0"
                step="0.1"
              />
            ),
          },

          {
            key: "suggested",
            label: "Suggested",
            align: "right",
            render: (value) => (typeof value === 'number' ? value.toFixed(1) : (parseFloat(value as string) || 0).toFixed(1)),
          },

          {
            key: "__buffer",
            label: "Buffer",
            align: "right",
            render: (_, row) => {
              const buffer = row.suggested - row.current;
              return (
                <span
                  className={
                    buffer > 0
                      ? "text-emerald-600"
                      : "text-orange-500"
                  }
                >
                  {buffer > 0 ? `+${buffer.toFixed(1)}` : buffer.toFixed(1)}
                </span>
              );
            },
          },

          {
            key: "risk",
            label: "Risk",
            render: (value) => {
              const color =
                value === "Low"
                  ? "text-emerald-600"
                  : value === "Medium"
                  ? "text-yellow-600"
                  : "text-red-600";

              return (
                <span className={`font-medium ${color}`}>
                  {value}
                </span>
              );
            },
          },
        ]}
        data={inventory}
      />
    </div>
  );
}
