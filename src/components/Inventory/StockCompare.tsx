import CardComponent from "../ui/CardComponent";
import { useContextAnalysis } from "../../context/ContextAnalysis";

export default function StockCompare() {
  const { stockMetrics } = useContextAnalysis();

  const max = Math.max(
    stockMetrics.stockNeeded,
    stockMetrics.predictedDemand
  );

  const currentPct = (stockMetrics.predictedDemand / max) * 100;
  const suggestedPct = (stockMetrics.stockNeeded / max) * 100;

  return (
    <CardComponent title="Stock Comparison">
      <div className="space-y-4">
        {}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-soft">Current Stock</span>
            <span>{stockMetrics.predictedDemand} kg</span>
          </div>
          <div className="h-2 rounded bg-gray-200 dark:bg-white/10">
            <div
              className="h-2 rounded bg-gray-500"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        </div>

        {}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-soft">Suggested Stock</span>
            <span>{stockMetrics.stockNeeded} kg</span>
          </div>
          <div className="h-2 rounded bg-gray-200 dark:bg-white/10">
            <div
              className="h-2 rounded bg-emerald-500"
              style={{ width: `${suggestedPct}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-soft">
          • Buffer included in suggestion
        </p>
      </div>
    </CardComponent>
  );
}
