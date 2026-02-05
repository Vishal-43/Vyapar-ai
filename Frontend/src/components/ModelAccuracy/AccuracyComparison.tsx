import { useModelAccuracy } from "../../context/ModelContext";

export default function AccuracyComparison() {
  const { metrics } = useModelAccuracy();

  return (
    <div className="border border-[var(--border)] bg-[rgba(var(--glass-white),0.65)] backdrop-blur-xl p-6 space-y-5">
      <h3 className="text-sm font-semibold text-main">
        AI vs Traditional Forecasting
      </h3>

      {}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>AI Model Accuracy</span>
          <span className="text-emerald-600">
            {metrics.aiAccuracy}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-white/10">
          <div
            className="h-3 bg-emerald-500"
            style={{ width: `${metrics.aiAccuracy}%` }}
          />
        </div>
      </div>

      {}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Traditional (Simple Avg)</span>
          <span>{metrics.traditionalAccuracy}%</span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-white/10">
          <div
            className="h-3 bg-gray-500"
            style={{ width: `${metrics.traditionalAccuracy}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-emerald-600 font-medium">
        Improvement: +{metrics.improvement}%
      </p>
    </div>
  );
}
