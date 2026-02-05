import { useModelAccuracy } from "../../context/ModelContext";
import { FiTarget } from "react-icons/fi";

export default function AccuracyHero() {
  const { metrics } = useModelAccuracy();

  return (
    <div className="border border-[var(--border)] bg-[rgba(var(--glass-white),0.65)] backdrop-blur-xl p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
        <FiTarget className="text-emerald-600" size={26} />
      </div>

      <h2 className="text-4xl font-bold text-emerald-600">
        {metrics.forecastAccuracy}%
      </h2>

      <p className="text-sm text-soft mt-1">
        Forecast Accuracy
      </p>

      <p className="mt-3 text-sm text-emerald-600">
        ↑ {metrics.improvement}% vs traditional methods
      </p>
    </div>
  );
}
