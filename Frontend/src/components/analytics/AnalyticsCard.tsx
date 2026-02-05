import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  sparkline?: number[];
  description?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger";
  onClick?: () => void;
}

/**
 * AnalyticsCard - KPI metric card with trend indicator and sparkline
 * Shows key metrics with trend arrows, sparklines, and comparisons
 * Supports multiple variants and interactive behavior
 */
export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendLabel,
  sparkline,
  description,
  icon,
  variant = "primary",
  onClick,
}) => {
  const getBgColor = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      case "danger":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getTrendColor = () => {
    if (!trend) return "text-gray-500 dark:text-gray-400";
    return trend > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  };

  const getIconColor = () => {
    switch (variant) {
      case "success":
        return "text-emerald-600 dark:text-emerald-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      case "danger":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-6 transition-all ${getBgColor()} ${
        onClick ? "cursor-pointer hover:shadow-lg" : ""
      }`}
    >
      {}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
        </div>
        {icon && <div className={`text-2xl ${getIconColor()}`}>{icon}</div>}
      </div>

      {}
      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
          {unit && (
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-2">
              {unit}
            </span>
          )}
        </p>
      </div>

      {}
      <div className="flex items-center justify-between">
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}>
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend < 0 ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
            <span>
              {Math.abs(trend)}%{" "}
              {trendLabel ? `${trendLabel}` : trend > 0 ? "up" : "down"}
            </span>
          </div>
        )}

        {}
        {sparkline && sparkline.length > 0 && (
          <div className="flex items-end gap-1 h-8">
            {sparkline.map((value, idx) => {
              const max = Math.max(...sparkline);
              const min = Math.min(...sparkline);
              const height = max === min ? 50 : ((value - min) / (max - min)) * 100;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-sm transition-all ${
                    variant === "success"
                      ? "bg-emerald-400"
                      : variant === "warning"
                      ? "bg-amber-400"
                      : variant === "danger"
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${value}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {}
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {description}
        </p>
      )}
    </div>
  );
};

export default AnalyticsCard;
