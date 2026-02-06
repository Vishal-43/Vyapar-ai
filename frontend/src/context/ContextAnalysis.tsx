
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
        let queryParams = "";
        
        if (selectionStr) {
          const selection = JSON.parse(selectionStr);
          if (selection.market && selection.product) {
            const days = selection.forecastRange || 7;
            queryParams = `?commodity_name=${encodeURIComponent(selection.product)}&market_name=${encodeURIComponent(selection.market)}&days=${days}`;
          }
        }
          
        const res = await fetch(`${BACKEND_URL}/api/product-analysis${queryParams}`);
        
        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
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
