import CardComponent from "../ui/CardComponent";
import { FiShield } from "react-icons/fi";
import { useContextAnalysis } from "../../context/ContextAnalysis";

export default function ActionRequiredCard() {
  const { stockMetrics, selectorData } = useContextAnalysis();

  const deficit =
    stockMetrics.stockNeeded - stockMetrics.predictedDemand;

  const forecastDays =
    selectorData.forecastRange.match(/\d+/)?.[0] ?? "";

  return (
    <CardComponent
      title="Action Required"
      icon={<FiShield size={18} />}
    >
      <div className="space-y-1">
        <p className="text-lg font-semibold text-emerald-600">
          Order {Math.abs(deficit)} kg more
        </p>

        <p className="text-soft text-lg">
          To meet predicted demand
          {forecastDays && ` for the next ${forecastDays} days`}
        </p>
      </div>
    </CardComponent>
  );
}
