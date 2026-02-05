
import React from "react";

/**
 * Allows:
 * - real keys of T
 * - virtual/computed keys like "__buffer", "__delta", etc.
 */
type TableColumnKey<T> = keyof T | `__${string}`;

interface TableColumn<T> {
  key: TableColumnKey<T>;
  label: string;
  align?: "left" | "right" | "center";
  render?: (
    value: T[keyof T] | undefined,
    row: T
  ) => React.ReactNode;
}

interface TableComponentProps<T> {
  title?: string;
  icon?: React.ReactNode;
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  skeletonRows?: number;
}

export default function TableComponent<T>({
  title,
  icon,
  columns,
  data,
  loading = false,
  skeletonRows = 4,
}: TableComponentProps<T>) {
  return (
    <div
      className="
        glass-card
        p-6 sm:p-7
        rounded-none
        transition-all duration-200
      "
    >
      {}
      {title && (
        <div className="flex items-center gap-2 mb-5">
          {icon && (
            <span className="text-[rgb(var(--emerald-main))]">
              {icon}
            </span>
          )}
          <h3
            className="
              text-base sm:text-lg
              font-semibold
              tracking-wide
              uppercase
              text-main
            "
          >
            {title}
          </h3>
        </div>
      )}

      {}
      <div
        className="overflow-x-auto"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full border-collapse">
          {}
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={String(col.key)}
                  className="
                    px-3 py-2.5
                    text-sm sm:text-[0.95rem]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-soft
                    border-b
                  "
                  style={{
                    borderColor: "var(--border)",
                    textAlign: col.align ?? "left",
                    borderRight:
                      index !== columns.length - 1
                        ? "1px solid var(--border)"
                        : undefined,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {}
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {columns.map((_, j) => (
                      <td
                        key={`skeleton-${i}-${j}`}
                        className="px-3 py-3.5 border-b"
                        style={{
                          borderColor: "var(--border)",
                        }}
                      >
                        <div
                          className="
                            h-4 w-3/4
                            rounded
                            bg-gray-200/70
                            dark:bg-white/10
                            animate-pulse
                          "
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, i) => (
                  <tr
                    key={i}
                    className="
                      transition-colors
                      hover:bg-[rgba(var(--glass-white),0.18)]
                    "
                  >
                    {columns.map((col, index) => {
                      const value =
                        typeof col.key === "string" &&
                        col.key.startsWith("__")
                          ? undefined
                          : (row as any)[col.key];

                      return (
                        <td
                          key={String(col.key)}
                          className="
                            px-3 py-3.5
                            text-base
                            font-medium
                            text-main
                            border-b
                          "
                          style={{
                            borderColor: "var(--border)",
                            textAlign: col.align ?? "left",
                            borderRight:
                              index !== columns.length - 1
                                ? "1px solid var(--border)"
                                : undefined,
                          }}
                        >
                          {col.render
                            ? col.render(value, row)
                            : String(value ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
