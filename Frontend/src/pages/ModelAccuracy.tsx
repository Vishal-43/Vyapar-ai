import Navbar from "../components/dashboard/Navbar/Navbar";
import DashFooter from "../components/dashboard/Home/dashFooter";
import { ModelProvider, useModelAccuracy } from "../context/ModelContext";

import AccuracyHero from "../components/ModelAccuracy/AccuracyHero";
import ErrorMetricCard from "../components/ModelAccuracy/ErrorMetricCard";
import AccuracyComparison from "../components/ModelAccuracy/AccuracyComparison";
import ModelGraph from "../components/ModelAccuracy/ModelGraph";
import GraphBackgroundCorner from "../components/Background/GraphBackgroundCorner";

function MetricsGrid() {
  const { metrics } = useModelAccuracy();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ErrorMetricCard
        title="Mean Absolute Error (MAE)"
        value={`${metrics.mae}`}
        subtitle="kg average error"
        traditional={`${metrics.maeTraditional}`}
        improvement="46%"
      />

      <ErrorMetricCard
        title="Mean Absolute % Error (MAPE)"
        value={`${metrics.mape}%`}
        subtitle="percentage error"
        traditional={`${metrics.mapeTraditional}%`}
        improvement="52%"
      />
    </div>
  );
}

export default function ModelAccuracy() {
  return (
    <>
    <GraphBackgroundCorner/>
    <ModelProvider>
      <div className="relative min-h-screen overflow-hidden">
        <Navbar />

        <main className="relative z-10 max-w-6xl mx-auto px-4 pt-28 space-y-6">
          <header>
            <h1 className="text-3xl font-semibold">
              Model Accuracy
            </h1>
            <p className="text-soft">
              Performance metrics for the AI forecasting model
            </p>
          </header>

          <AccuracyHero />
          <MetricsGrid />

          {}
          <ModelGraph />

          <AccuracyComparison />
        </main>

        <DashFooter />
      </div>
    </ModelProvider>
        </>

  );
}
