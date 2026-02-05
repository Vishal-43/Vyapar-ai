import React, { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export type RecommendationType = "BUY" | "SELL" | "HOLD" | "STOCK_UP" | "STOCK_DOWN";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type TimeHorizon = "SHORT_TERM" | "MID_TERM" | "LONG_TERM";
export type AccuracyRating = "CORRECT" | "INCORRECT" | "PARTIAL" | "PENDING";

export interface Recommendation {
  id: number;
  commodity_id?: number;
  commodity_name: string;
  market_id?: number;
  market_name?: string;
  recommendation_type: RecommendationType;
  confidence: ConfidenceLevel;
  reasoning: string;
  current_price?: number | null;
  target_price?: number | null;
  expected_change_pct?: number | null;
  time_horizon: TimeHorizon;
  created_at: string;
  expires_at?: string | null;
  model_version?: string;
  acknowledged: boolean;
  acknowledgement_note?: string | null;
  last_evaluated_at?: string | null;
}

export interface RecommendationHistoryItem {
  id: number;
  commodity_name: string;
  recommendation_type: RecommendationType;
  confidence: ConfidenceLevel;
  created_at: string;
  outcome: AccuracyRating;
  actual_change_pct?: number | null;
  roi_pct?: number | null;
  note?: string | null;
}

export interface RecommendationMetrics {
  total_recommendations: number;
  correct_count: number;
  incorrect_count: number;
  partial_count: number;
  accuracy_rate: number;
  average_roi_pct: number;
  by_type_accuracy: Record<string, number>;
  generated_at: string;
}

interface RecommendationContextType {
  recommendations: Recommendation[];
  history: RecommendationHistoryItem[];
  metrics: RecommendationMetrics | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchRecommendations: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
  acknowledgeRecommendation: (id: number, note?: string) => Promise<void>;
  recordAccuracy: (
    id: number,
    outcome: AccuracyRating,
    actualChangePct?: number,
    roiPct?: number,
    note?: string
  ) => Promise<void>;
}

const RecommendationContext = createContext<RecommendationContextType | undefined>(
  undefined
);

export const useRecommendations = () => {
  const context = useContext(RecommendationContext);
  if (!context) {
    throw new Error("useRecommendations must be used within RecommendationProvider");
  }
  return context;
};

interface RecommendationProviderProps {
  children: ReactNode;
}

export const RecommendationProvider: React.FC<RecommendationProviderProps> = ({
  children,
}) => {
  const { getToken } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<RecommendationHistoryItem[]>([]);
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getHeaders = async () => {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/v1/recommendations/`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/v1/recommendations/history`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch history";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BACKEND_URL}/api/v1/recommendations/metrics`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch metrics";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const acknowledgeRecommendation = useCallback(async (id: number, note?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${BACKEND_URL}/api/v1/recommendations/${id}/acknowledge`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ note }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to acknowledge recommendation");
      }

      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === id
            ? { ...rec, acknowledged: true, acknowledgement_note: note || null }
            : rec
        )
      );
      handleSuccess("Recommendation acknowledged");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to acknowledge";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const recordAccuracy = useCallback(async (
    id: number,
    outcome: AccuracyRating,
    actualChangePct?: number,
    roiPct?: number,
    note?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const response = await fetch(
        `${BACKEND_URL}/api/v1/recommendations/${id}/accuracy`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            outcome,
            actual_change_pct: actualChangePct,
            roi_pct: roiPct,
            note,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to record accuracy");
      }

      handleSuccess("Accuracy recorded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record accuracy";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  return (
    <RecommendationContext.Provider
      value={{
        recommendations,
        history,
        metrics,
        isLoading,
        error,
        successMessage,
        fetchRecommendations,
        fetchHistory,
        fetchMetrics,
        acknowledgeRecommendation,
        recordAccuracy,
      }}
    >
      {children}
    </RecommendationContext.Provider>
  );
};
