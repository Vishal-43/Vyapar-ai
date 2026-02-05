import GraphComponent from "../ui/GraphComponent";
import { useModelAccuracy } from "../../context/ModelContext";

export default function ModelGraph() {
  const { graphData } = useModelAccuracy();

  const aiData = graphData.map((d) => ({
    day: d.day,
    actual: d.actual,
    forecast: d.aiForecast,
  }));

  const traditionalData = graphData.map((d) => ({
    day: d.day,
    actual: d.actual,
    forecast: d.traditionalForecast,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <GraphComponent
        title="AI Model vs Actual Demand"
        data={aiData}
      />

      <GraphComponent
        title="Traditional Model vs Actual Demand"
        data={traditionalData}
      />
    </div>
  );
}
