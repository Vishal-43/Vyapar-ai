import { FiAlertTriangle, FiCloudRain, FiInfo } from "react-icons/fi";
import InsightComponent from "../ui/InsightComponent";
import { useInsights } from "../../context/InsightContext";

export default function InsightCard() {
  const { insights } = useInsights();

  const iconMap = {
    high: <FiAlertTriangle size={20} />,
    medium: <FiCloudRain size={20} />,
    info: <FiInfo size={20} />,
  };

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <InsightComponent
          key={insight.id}
          title={insight.title}
          reason={insight.reason}
          priority={insight.priority}
          confidence={insight.confidence}
          timeHorizon={insight.timeHorizon}
          icon={iconMap[insight.priority]}
        />
      ))}
    </div>
  );
}
