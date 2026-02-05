
import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { AnalysisContextValue, ImpactItem } from "./types";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function ContextAnalysisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [analysis, setAnalysis] = useState<AnalysisContextValue>({
    selectorData: { market: "", product: "", forecastRange: "" },
    stockMetrics: { predictedDemand: 0, stockNeeded: 0, overstockRisk: 0, understockRisk: 0 },
    demandGraphData: [],
    impactData: { festival: [], weather: [] },
    recommendationTable: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const previousSelectionRef = useRef<string | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const loadForecastData = async () => {
      if (loadingRef.current) {
        return;
      }
      
      try {
        loadingRef.current = true;
        setIsLoading(true);
        
        const selectionStr = localStorage.getItem('forecastSelection');
        
        if (selectionStr) {
          const selection = JSON.parse(selectionStr);
          
          if (!selection.market || !selection.product) {
            // Fallback to product-analysis endpoint without filters
            const res = await fetch(`${BACKEND_URL}/api/product-analysis`);
            if (res.ok) {
              const data = await res.json();
              setAnalysis(data);
            }
            return;
          }
          
          const forecastPayload = {
            state: selection.state || "",
            city: selection.city || "",
            market: selection.market,
            category: selection.category || "",
            product: selection.product,
            forecast_range: Number(selection.forecastRange || 7),
          };
          
          const forecastRes = await fetch(`${BACKEND_URL}/api/forecast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(forecastPayload),
          });
          
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            
            const demandGraphData = forecastData.forecasts?.map((f: any, idx: number) => ({
              day: `Day ${idx + 1}`,
              actual: f.predicted_price * 0.95,
              forecast: f.predicted_price,
            })) || [];
            
            const avgPredictedPrice = forecastData.averagePrice || 0;
            const predictedDemand = Math.round(avgPredictedPrice * 1.2);
            
            const weatherImpact: ImpactItem[] = [
              { 
                title: "Temperature Rise", 
                subtitle: "Expected 3°C increase", 
                delta: "+12%", 
                positive: forecastData.trend === "up" 
              },
              { 
                title: "Rainfall Pattern", 
                subtitle: "Moderate precipitation", 
                delta: "+5%", 
                positive: true 
              },
            ];
            
            const festivalImpact: ImpactItem[] = [
              { 
                title: "Upcoming Festival", 
                subtitle: "High demand expected", 
                delta: "+25%", 
                positive: true 
              },
              { 
                title: "Market Holiday", 
                subtitle: "Reduced supply window", 
                delta: "-8%", 
                positive: false 
              },
            ];
            
            setAnalysis({
              selectorData: {
                market: selection.market,
                product: selection.product,
                forecastRange: `${selection.forecastRange || 7} Days`,
              },
              stockMetrics: {
                predictedDemand: predictedDemand,
                stockNeeded: Math.round(predictedDemand * 1.1),
                overstockRisk: 15,
                understockRisk: 10,
              },
              demandGraphData: demandGraphData,
              impactData: { festival: festivalImpact, weather: weatherImpact },
              recommendationTable: [],
            });
          } else {
            // Fallback: try forecast endpoint for basic data
            const forecastPayload = {
              state: selection.state || "",
              city: selection.city || "",
              market: selection.market,
              category: selection.category || "",
              product: selection.product,
              forecast_range: Number(selection.forecastRange || 7),
            };
            
            const forecastRes = await fetch(`${BACKEND_URL}/api/forecast`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(forecastPayload),
            });
            
            if (forecastRes.ok) {
              const forecastData = await forecastRes.json();
              
              // Transform forecast data to match AnalysisContextValue
              const demandGraphData = forecastData.forecasts?.map((f: any, idx: number) => ({
                day: `Day ${idx + 1}`,
                actual: f.predicted_price * 0.95,
                forecast: f.predicted_price,
              })) || [];
              
              const avgPredictedPrice = forecastData.averagePrice || 0;
              const predictedDemand = Math.round(avgPredictedPrice * 1.2);
              
              setAnalysis({
                selectorData: {
                  market: forecastData.market || selection.market,
                  product: forecastData.product || selection.product,
                  forecastRange: `${forecastData.rangeDays || selection.forecastRange} Days`,
                },
                stockMetrics: {
                  predictedDemand,
                  stockNeeded: Math.round(predictedDemand * 1.15),
                  overstockRisk: forecastData.trend === "down" ? 35 : 15,
                  understockRisk: forecastData.trend === "up" ? 40 : 20,
                },
                demandGraphData,
                impactData: { festival: [], weather: [] },
                recommendationTable: [
                  {
                    product: forecastData.product || selection.product,
                    current: Math.round(avgPredictedPrice * 0.8),
                    suggested: Math.round(predictedDemand * 1.15),
                    buffer: 15,
                    risk: forecastData.trend === "up" ? "High" : "Low",
                  },
                ],
              });
            }
          }
        } else {
          const res = await fetch(`${BACKEND_URL}/api/product-analysis`);
          if (res.ok) {
            const data = await res.json();
            setAnalysis(data);
          }
        }
      } catch (error) {
        console.error("Failed to load forecast data:", error);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    const selectionStr = localStorage.getItem('forecastSelection');
    if (selectionStr !== previousSelectionRef.current) {
      previousSelectionRef.current = selectionStr;
      loadForecastData();
    } else if (!previousSelectionRef.current) {
      loadForecastData();
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'forecastSelection' && e.newValue !== previousSelectionRef.current) {
        previousSelectionRef.current = e.newValue;
        loadForecastData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const value: AnalysisContextValue = {
    ...analysis,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useContextAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) {
    throw new Error(
      "useContextAnalysis must be used inside ContextAnalysisProvider"
    );
  }
  return ctx;
}
