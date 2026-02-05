import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface BuySellAlert {
  id: number;
  commodity_id: number;
  commodity_name: string;
  market_id: number;
  market_name: string;
  buy_threshold: number;
  sell_threshold: number;
  current_price: number | null;
  signal: "BUY" | "SELL" | "HOLD" | null;
  signal_strength: "STRONG" | "MODERATE" | "WEAK" | null;
  priority: string;
  enabled: boolean;
  notification_channels: string[];
  message?: string;
  triggered_at?: string;
  last_checked_at?: string;
  created_at: string;
  updated_at?: string;
}

interface CreateAlertRequest {
  commodity_id: number;
  market_id: number;
  buy_threshold: number;
  sell_threshold: number;
  priority?: string;
  notification_channels?: string[];
  message?: string;
  enabled?: boolean;
}

interface UpdateAlertRequest {
  buy_threshold?: number;
  sell_threshold?: number;
  priority?: string;
  enabled?: boolean;
  notification_channels?: string[];
  message?: string;
}

interface BuySellAlertContextType {
  alerts: BuySellAlert[];
  isLoading: boolean;
  error: string | null;
  fetchAlerts: () => Promise<void>;
  createAlert: (alert: CreateAlertRequest) => Promise<BuySellAlert>;
  updateAlert: (alertId: number, data: UpdateAlertRequest) => Promise<BuySellAlert>;
  deleteAlert: (alertId: number) => Promise<void>;
  getAlert: (alertId: number) => Promise<BuySellAlert>;
}

const BuySellAlertContext = createContext<BuySellAlertContextType | undefined>(
  undefined
);

export const useBuySellAlerts = () => {
  const context = useContext(BuySellAlertContext);
  if (!context) {
    throw new Error("useBuySellAlerts must be used within BuySellAlertProvider");
  }
  return context;
};

interface BuySellAlertProviderProps {
  children: ReactNode;
}

export const BuySellAlertProvider: React.FC<BuySellAlertProviderProps> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<BuySellAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = `${BACKEND_URL}/api/v1/buysell-alerts?limit=1000`;
      console.log("Fetching alerts from:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Alerts data received:", data);
      setAlerts(data.alerts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch alerts";
      setError(message);
      console.error("Error fetching buy/sell alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async (alert: CreateAlertRequest): Promise<BuySellAlert> => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/buysell-alerts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alert),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create alert");
      }

      const newAlert = await response.json();
      setAlerts([...alerts, newAlert]);
      return newAlert;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create alert";
      setError(message);
      console.error("Error creating buy/sell alert:", err);
      throw err;
    }
  };

  const updateAlert = async (
    alertId: number,
    data: UpdateAlertRequest
  ): Promise<BuySellAlert> => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/buysell-alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update alert");
      }

      const updatedAlert = await response.json();
      setAlerts(
        alerts.map((a) => (a.id === alertId ? updatedAlert : a))
      );
      return updatedAlert;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update alert";
      setError(message);
      console.error("Error updating buy/sell alert:", err);
      throw err;
    }
  };

  const deleteAlert = async (alertId: number) => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/buysell-alerts/${alertId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete alert");
      }

      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete alert";
      setError(message);
      console.error("Error deleting buy/sell alert:", err);
      throw err;
    }
  };

  const getAlert = async (alertId: number): Promise<BuySellAlert> => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/buysell-alerts/${alertId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alert");
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch alert";
      setError(message);
      console.error("Error fetching buy/sell alert:", err);
      throw err;
    }
  };

  return (
    <BuySellAlertContext.Provider
      value={{
        alerts,
        isLoading,
        error,
        fetchAlerts,
        createAlert,
        updateAlert,
        deleteAlert,
        getAlert,
      }}
    >
      {children}
    </BuySellAlertContext.Provider>
  );
};
