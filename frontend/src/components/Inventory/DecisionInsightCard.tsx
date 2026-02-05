import CardComponent from "../ui/CardComponent";
import { FiInfo } from "react-icons/fi";
import { useContextAnalysis } from "../../context/ContextAnalysis";

export default function DecisionInsightCard() {
  const { impactData } = useContextAnalysis();

  const primaryFestival = impactData.festival?.[0];
  const primaryWeather = impactData.weather?.[0];

  return (
    <CardComponent
      title="Decision Insight"
      icon={<FiInfo size={18} />}
    >
      <p className="text-l leading-relaxed text-soft">
        {primaryFestival && (
          <>
            Based on upcoming{" "}
            <strong className="text-main">
              {primaryFestival.title}
            </strong>
            {primaryFestival.subtitle
              ? ` (${primaryFestival.subtitle})`
              : ""}
            , historical demand patterns indicate a likely increase in sales.
          </>
        )}

        {primaryWeather && (
          <>
            {" "}
            However,{" "}
            <strong className="text-main">
              {primaryWeather.title.toLowerCase()}
            </strong>
            {primaryWeather.subtitle
              ? ` (${primaryWeather.subtitle.toLowerCase()})`
              : ""}{" "}
            may partially offset this demand.
          </>
        )}
      </p>
    </CardComponent>
  );
}
