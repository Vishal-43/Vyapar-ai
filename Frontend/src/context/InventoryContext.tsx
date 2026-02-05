
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { useContextAnalysis } from "./ContextAnalysis";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface InventoryRow {
  id: number;
  market: string;
  product: string;
  category?: string;
  current: number;
  suggested: number;
  risk: string;
}

type InventoryFilters = {
  market?: string;
  category?: string;
  product?: string;
};

type InventoryContextType = {
  filters: InventoryFilters;
  setFilters: (f: Partial<InventoryFilters>) => void;

  inventory: InventoryRow[];
  allInventory: InventoryRow[];

  updateStock: () => Promise<void>;
  updateItem: (id: number, current: number) => void;
  isUpdating: boolean;
  isLoading: boolean;
};

const InventoryContext =
  createContext<InventoryContextType | null>(null);

export function InventoryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { recommendationTable, selectorData } = useContextAnalysis();
  const [filters, setFiltersState] = useState<InventoryFilters>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const allInventory: InventoryRow[] = useMemo(() => {
    return recommendationTable.map((rec, idx) => ({
      id: idx + 1,
      market: selectorData.market || "General",
      product: rec.product,
      category: undefined,
      current: rec.current,
      suggested: rec.suggested,
      risk: rec.risk,
    }));
  }, [recommendationTable, selectorData]);

  const isLoading = false;

  
  const setFilters = (f: Partial<InventoryFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  };

  
  const updateItem = (id: number, current: number) => {
    console.log("Update item:", id, current);
  };

  
  const inventory = useMemo(() => {
    return allInventory.filter((row) => {
      return (
        (!filters.market || row.market === filters.market) &&
        (!filters.category || row.category === filters.category) &&
        (!filters.product || row.product === filters.product)
      );
    });
  }, [filters, allInventory]);

  
  const updateStock = async () => {
    try {
      setIsUpdating(true);

      const items = inventory.map(item => ({
        id: item.id,
        current: item.current,
      }));

      const res = await fetch(`${BACKEND_URL}/api/inventory/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        throw new Error("Failed to update stock");
      }

      const result = await res.json();
      console.log("Stock updated successfully:", result);
    } catch (error) {
      console.error("Stock update error:", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        filters,
        setFilters,
        inventory,
        allInventory,
        updateStock,
        updateItem,
        isUpdating,
        isLoading,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error(
      "useInventory must be used inside InventoryProvider"
    );
  }
  return ctx;
}
