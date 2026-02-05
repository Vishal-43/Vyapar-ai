
import { FiMapPin, FiBox, FiCalendar } from "react-icons/fi";
import { useContextAnalysis } from "../../context/ContextAnalysis";
import CardComponent from "../ui/CardComponent";

const selectorIcons: Record<string, React.ReactNode> = {
  market: <FiMapPin size={16} />,
  product: <FiBox size={16} />,
  forecastRange: <FiCalendar size={16} />,
};

export default function SelectorComponent() {
  const { selectorData } = useContextAnalysis();

  return (
    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-3
        gap-4 sm:gap-5
        
      "
    >
      {Object.entries(selectorData).map(([key, value]) => (
        <CardComponent
          key={key}
          title={key.replace(/([A-Z])/g, " $1")}
          icon={selectorIcons[key]}
        >
          <p
            className="
              text-l
              
              leading-relaxed
            "
          >
            {value}
          </p>
        </CardComponent>
      ))}
    </div>
  );
}
