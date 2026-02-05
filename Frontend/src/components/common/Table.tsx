import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  rowClassName?: string;
  striped?: boolean;
  hover?: boolean;
  pagination?: {
    pageSize: number;
    onPageChange?: (page: number) => void;
  };
}

interface SortState {
  key: string | null;
  direction: "asc" | "desc";
}

/**
 * Reusable data table component with sorting and pagination.
 * Provides a clean, professional way to display tabular data.
 */
export const Table = React.forwardRef<
  HTMLDivElement,
  TableProps<any>
>(function Table(
  {
    columns,
    data,
    keyExtractor,
    rowClassName = "",
    striped = true,
    hover = true,
    pagination,
  },
  ref
) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;

    setCurrentPage(1);
    if (sort.key === key) {
      setSort({
        key,
        direction: sort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ key, direction: "asc" });
    }
  };

  let sortedData = [...data];
  if (sort.key) {
    sortedData.sort((a, b) => {
      const aValue = a[sort.key as keyof typeof a];
      const bValue = b[sort.key as keyof typeof b];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sort.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  let displayData = sortedData;
  let totalPages = 1;
  if (pagination) {
    totalPages = Math.ceil(sortedData.length / pagination.pageSize);
    const startIdx = (currentPage - 1) * pagination.pageSize;
    displayData = sortedData.slice(
      startIdx,
      startIdx + pagination.pageSize
    );
  }

  return (
    <div ref={ref} className="flex flex-col">
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => handleSort(String(col.key), col.sortable)}
                  className={`px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 ${
                    col.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" : ""
                  } ${col.className || ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && sort.key === String(col.key) && (
                      <>
                        {sort.direction === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr
                key={keyExtractor(row, idx)}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  striped && idx % 2 === 0
                    ? "bg-gray-50 dark:bg-gray-900/30"
                    : "bg-white dark:bg-gray-950"
                } ${hover ? "hover:bg-gray-100 dark:hover:bg-gray-900/50" : ""} ${rowClassName}`}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${col.className || ""}`}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayData.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}

      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} · {sortedData.length} total items
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                pagination.onPageChange?.(newPage);
              }}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                pagination.onPageChange?.(newPage);
              }}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

Table.displayName = "Table";

export default Table;
