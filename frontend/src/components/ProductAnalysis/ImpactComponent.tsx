import { FiCalendar, FiCloudRain } from "react-icons/fi";
import ImpactListCard from "../ui/ImpactCard";
import { useContextAnalysis } from "../../context/ContextAnalysis";

export default function ImpactComponent() {
  const { impactData } = useContextAnalysis();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ImpactListCard
        title="Festival Impact"
        icon={<FiCalendar size={16} />}
        items={impactData.festival}
      />

      <ImpactListCard
        title="Weather Impact"
        icon={<FiCloudRain size={16} />}
        items={impactData.weather}
      />
    </div>
  );
}
