
import { createContext, useContext, useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface InsightItem {
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

interface InsightContextValue {
  insights: InsightItem[];
  isLoading: boolean;
}

const InsightContext = createContext<InsightContextValue | null>(null);

export function InsightProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/ai/insights`);
        if (res.ok) {
          const data = await res.json();
          setInsights(data);
        } else {
          console.error("Failed to fetch insights:", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const value: InsightContextValue = {
    insights,
    isLoading,
  };

  return (
    <InsightContext.Provider value={value}>
      {children}
    </InsightContext.Provider>
  );
}

export function useInsights(): InsightContextValue {
  const ctx = useContext(InsightContext);
  if (!ctx) {
    throw new Error("useInsights must be used inside InsightProvider");
  }
  return ctx;
}
