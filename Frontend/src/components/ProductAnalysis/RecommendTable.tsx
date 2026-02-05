import { FiTrendingUp } from "react-icons/fi";
import { useContextAnalysis } from "../../context/ContextAnalysis";
import TableComponent from "../ui/TableComponent";

export default function RecommendTable() {
  const { recommendationTable } = useContextAnalysis();

  return (
    <TableComponent
      title="Stock Recommendation"
      icon={<FiTrendingUp size={16} />}
      columns={[
        {
          key: "product",
          label: "Product",
        },
        {
          key: "current",
          label: "Current Stock",
          align: "right",
          render: (v) => `${v} Kg`,
        },
        {
          key: "suggested",
          label: "Suggested Stock",
          align: "right",
          render: (v) => `${v} Kg`,
        },
        {
          key: "buffer",
          label: "Buffer",
          align: "right",
          render: (v) => `+${v} Kg`,
        },
        {
          key: "risk",
          label: "Risk",
          align: "center",
          render: (v) => (
            <span
              className="
                inline-flex items-center px-2 py-0.5
                text-sm font-medium
                border
              "
              style={{
                borderColor: "var(--border)",
                color:
                  v === "Low"
                    ? "rgb(var(--emerald-main))"
                    : "var(--text-main)",
              }}
            >
              {v}
            </span>
          ),
        },
      ]}
      data={recommendationTable}
    />
  );
}
