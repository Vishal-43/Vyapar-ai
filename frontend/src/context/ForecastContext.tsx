
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export type ForecastSelection = {
  state?: string;
  city?: string;
  market?: string;

  category?: string;
  product?: string;

  forecastRange?: "7" | "14" | "30" | "90" | "180";
};

interface Market {
  id: number;
  name: string;
  state: string;
  city: string;
}

interface Commodity {
  id: number;
  name: string;
  category?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
}

type ForecastContextType = {
  
  selection: ForecastSelection;
  setSelection: (data: Partial<ForecastSelection>) => void;

  
  markets: Market[];
  commodities: Commodity[];
  categories: string[];
  products: Product[];
  forecastRanges: Array<{ label: string; value: "7" | "14" | "30" | "90" | "180" }>;

  
  generateForecast: () => Promise<void>;
  isSelectionComplete: boolean;
  isLoading: boolean;
};

const ForecastContext = createContext<ForecastContextType | null>(null);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [selection, setSelectionState] =
    useState<ForecastSelection>({});

  const [markets, setMarkets] = useState<Market[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const setSelection = (data: Partial<ForecastSelection>) => {
    setSelectionState((prev) => ({ ...prev, ...data }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [marketsRes, commoditiesRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/markets`),
          fetch(`${BACKEND_URL}/api/commodities`),
        ]);

        if (marketsRes.ok) {
          const data = await marketsRes.json();
          setMarkets(data);
        }

        if (commoditiesRes.ok) {
          const data = await commoditiesRes.json();
          setCommodities(data);
        }
      } catch (error) {
        console.error("Failed to fetch markets/commodities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        commodities
          .map((c) => c.category || "Other")
          .filter((cat) => cat !== undefined)
      )
    ).sort();
  }, [commodities]);

  const products = useMemo(() => {
    return commodities.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category || "Other",
    }));
  }, [commodities]);

  const forecastRanges = [
    { label: "7 Days", value: "7" as const },
    { label: "14 Days", value: "14" as const },
  ];

  const isSelectionComplete = useMemo(() => {
    return Boolean(
      selection.state &&
      selection.city &&
      selection.market &&
      selection.category &&
      selection.product &&
      selection.forecastRange
    );
  }, [selection]);

  
  const generateForecast = async () => {
    if (!isSelectionComplete) {
      throw new Error("Forecast selection incomplete");
    }

    const payload = {
      state: selection.state!,
      city: selection.city!,
      market: selection.market!,
      category: selection.category!,
      product: selection.product!,
      forecast_range: Number(selection.forecastRange),
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Forecast API failed");
      }

      const forecastData = await res.json();
      
      localStorage.setItem('forecastData', JSON.stringify(forecastData));
      localStorage.setItem('forecastSelection', JSON.stringify(selection));
    } catch (error) {
      console.error("Forecast generation failed:", error);
      throw error;
    }
  };

  return (
    <ForecastContext.Provider
      value={{
        selection,
        setSelection,

        markets,
        commodities,
        categories,
        products,
        forecastRanges,

        generateForecast,
        isSelectionComplete,
        isLoading,
      }}
    >
      {children}
    </ForecastContext.Provider>
  );
}

export function useForecast() {
  const ctx = useContext(ForecastContext);
  if (!ctx) {
    throw new Error(
      "useForecast must be used inside ForecastProvider"
    );
  }
  return ctx;
}
