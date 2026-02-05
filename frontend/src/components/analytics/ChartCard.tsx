import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface ChartCardProps {
  title: string;
  description?: string;
  data: ChartData[];
  type: "line" | "bar" | "area";
  dataKey: string | string[];
  xAxisKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  loading?: boolean;
}

/**
 * ChartCard - Reusable chart wrapper with consistent styling
 * Supports line, bar, and area charts with dark mode
 */
export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  data,
  type,
  dataKey,
  xAxisKey = "name",
  height = 300,
  showLegend = true,
  showGrid = true,
  loading = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "#374151" : "#e5e7eb";
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const strokeColor = isDark ? "#4b5563" : "#d1d5db";

  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];
  const colors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
    active,
    payload,
    label,
  }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
      {}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>

      {}
      <ResponsiveContainer width="100%" height={height}>
        {type === "line" && (
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke={textColor} style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ color: textColor }} />}
            {dataKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
              />
            ))}
          </LineChart>
        )}

        {type === "bar" && (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke={textColor} style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ color: textColor }} />}
            {dataKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[idx % colors.length]}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        )}

        {type === "area" && (
          <AreaChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={textColor}
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke={textColor} style={{ fontSize: "12px" }} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend wrapperStyle={{ color: textColor }} />}
            {dataKeys.map((key, idx) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[idx % colors.length]}
                stroke={colors[idx % colors.length]}
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
