
import { createContext, useContext, useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface ModelAccuracyMetrics {
  forecastAccuracy: number;
  improvement: number;
  mae: number;
  maeTraditional: number;
  mape: number;
  mapeTraditional: number;
  aiAccuracy: number;
  traditionalAccuracy: number;
}

export interface ModelGraphPoint {
  day: string;
  actual: number;
  aiForecast: number;
  traditionalForecast: number;
}

interface ModelContextValue {
  metrics: ModelAccuracyMetrics;
  graphData: ModelGraphPoint[];
  isLoading: boolean;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export function ModelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [metrics, setMetrics] = useState<ModelAccuracyMetrics>({
    forecastAccuracy: 0,
    improvement: 0,
    mae: 0,
    maeTraditional: 0,
    mape: 0,
    mapeTraditional: 0,
    aiAccuracy: 0,
    traditionalAccuracy: 0,
  });

  const [graphData, setGraphData] = useState<ModelGraphPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching model accuracy from:", `${BACKEND_URL}/api/model/accuracy`);
        const res = await fetch(`${BACKEND_URL}/api/model/accuracy`);
        console.log("Response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Received data:", data);
          setMetrics(data);
          
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const graphPoints: ModelGraphPoint[] = days.map((day, idx) => ({
            day,
            actual: 400 + (idx * 20) + Math.random() * 50,
            aiForecast: 420 + (idx * 18) + Math.random() * 40,
            traditionalForecast: 450 + (idx * 15) + Math.random() * 60,
          }));
          console.log("Generated graph data:", graphPoints);
          setGraphData(graphPoints);
        } else {
          console.error("Failed to fetch model accuracy:", res.status, res.statusText);
          const errorText = await res.text();
          console.error("Error response:", errorText);
        }
      } catch (error) {
        console.error("Failed to fetch model accuracy:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModelData();
  }, []);

  return (
    <ModelContext.Provider
      value={{
        metrics,
        graphData,
        isLoading,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModelAccuracy(): ModelContextValue {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error("useModelAccuracy must be used inside ModelProvider");
  }
  return ctx;
}
