import { Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForecast } from "../../../context/ForecastContext";

export default function ForecastRangeAndGenerate() {
  const navigate = useNavigate();
  const {
    selection,
    setSelection,
    generateForecast,
    isSelectionComplete,
    forecastRanges,
  } = useForecast();

  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!isSelectionComplete || isLoading) return;

    try {
      setIsLoading(true);
      await generateForecast();
      navigate("/dashboard/product-analysis");
    } catch (err) {
      console.error("Forecast generation failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6 space-y-6">
      {}
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <h3 className="text-sm sm:text-base font-medium">
          Forecast Range & Generate
        </h3>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {forecastRanges.map((range) => {
          const active = selection.forecastRange === range.value;

          return (
            <button
              key={range.value}
              type="button"
              disabled={isLoading}
              onClick={() =>
                setSelection({ forecastRange: range.value })
              }
              className={`
                min-h-14 sm:min-h-15
                rounded-xl border
                px-4 py-3
                flex flex-col items-center justify-center
                text-sm font-medium
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-emerald-400/40

                ${
                  active
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-[0_10px_28px_rgba(16,185,129,0.35)]"
                    : "bg-white/70 text-black border-gray-300 hover:border-emerald-400 hover:text-emerald-700"
                }
              `}
            >
              <span>{range.label}</span>
            </button>
          );
        })}
      </div>

      {}
      <button
        onClick={handleGenerate}
        disabled={!isSelectionComplete || isLoading}
        className={`
          w-full min-h-12 sm:min-h-13
          rounded-xl
          flex items-center justify-center gap-2
          text-sm font-medium
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-400/40

          ${
            isSelectionComplete && !isLoading
              ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-[0_12px_30px_rgba(16,185,129,0.35)] active:scale-[0.98]"
              : "bg-gray-300 text-black cursor-not-allowed"
          }
        `}
      >
        {isLoading ? "Generating Forecast…" : "Generate Forecast"}
        {!isLoading && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
