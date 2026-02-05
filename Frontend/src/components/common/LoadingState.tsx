import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingMessage?: string;
  emptyMessage?: string;
  onRetry?: () => void;
}

/**
 * Wrapper component for handling loading, error, and empty states.
 * Simplifies conditional rendering in pages and components.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  error,
  isEmpty,
  children,
  loadingMessage = "Loading...",
  emptyMessage = "No data available",
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/30">
        <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
          Error Loading Data
        </h3>
        <p className="text-red-700 dark:text-red-300 text-sm mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;
