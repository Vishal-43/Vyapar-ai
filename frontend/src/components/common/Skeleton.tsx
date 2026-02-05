import React from "react";

interface SkeletonProps {
  className?: string;
  count?: number;
}

/**
 * Reusable loading skeleton component.
 * Shows animated placeholder while data is loading.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "", count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`}
        />
      ))}
    </>
  );
};

/**
 * Loading skeleton for table rows.
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-800">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Loading skeleton for a card/list item.
 */
export const CardSkeleton: React.FC = () => (
  <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-4 w-full mb-3" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

/**
 * Loading skeleton for a page section.
 */
export const PageSectionSkeleton: React.FC = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48 mb-6" />
    {Array.from({ length: 3 }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Loading skeleton for a grid of items.
 */
export const GridSkeleton: React.FC<{ columns?: number; items?: number }> = ({
  columns = 3,
  items = 6,
}) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
    {Array.from({ length: items }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
