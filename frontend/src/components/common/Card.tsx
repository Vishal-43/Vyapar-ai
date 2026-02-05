import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "default" | "elevated" | "outlined" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface CardMetricProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const variantMap = {
  default:
    "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm",
  elevated:
    "bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-lg shadow-md",
  outlined:
    "bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-700 rounded-lg",
  flat: "bg-gray-50 dark:bg-gray-900 rounded-lg",
};

/**
 * Card - Base reusable card component with multiple variants
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  onClick,
  variant = "default",
  padding = "md",
}) => {
  const paddingClass = paddingMap[padding];
  const variantClass = variantMap[variant];

  return (
    <div
      onClick={onClick}
      className={`${variantClass} ${paddingClass} ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * CardHeader - Header section of a card
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
  action,
}) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div className="flex-1">{children}</div>
    {action && <div className="ml-4">{action}</div>}
  </div>
);

/**
 * CardBody - Body section of a card
 */
export const CardBody: React.FC<CardBodyProps> = ({ children, className = "" }) => (
  <div className={`${className}`}>{children}</div>
);

/**
 * CardFooter - Footer section of a card
 */
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = "" }) => (
  <div
    className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);

/**
 * CardMetric - Card variant for displaying a single metric
 */
export const CardMetric: React.FC<CardMetricProps> = ({
  label,
  value,
  icon,
  trend,
  className = "",
}) => (
  <Card variant="default" padding="md" className={className}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </span>
          {trend && (
            <span
              className={`text-xs font-semibold ${
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
      </div>
      {icon && (
        <div className="text-gray-400 dark:text-gray-600 flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export default Card;
