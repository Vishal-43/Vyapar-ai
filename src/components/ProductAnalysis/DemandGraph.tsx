import { useContextAnalysis } from "../../context/ContextAnalysis";
import GraphComponent from "../ui/GraphComponent";

export default function DemandGraph() {
  const { demandGraphData } = useContextAnalysis();

  return (
    <GraphComponent
      title="Demand Forecast vs Past Sales"
      data={demandGraphData}
    />
  );
}
