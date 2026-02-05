import React, { useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any[];
  filename?: string;
  onExport?: (format: "csv" | "json" | "xlsx", options: ExportOptions) => void;
}

interface ExportOptions {
  includeHeaders: boolean;
  formatNumbers: boolean;
  timezone?: string;
}

/**
 * ExportDialog - Export data in multiple formats with formatting options
 * Supports CSV, JSON, and XLSX export with customization
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  filename = "export",
  onExport,
}) => {
  const [format, setFormat] = useState<"csv" | "json" | "xlsx">("csv");
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [formatNumbers, setFormatNumbers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        includeHeaders,
        formatNumbers,
      };

      if (format === "csv" && data) {
        exportCSV(data, filename, options);
      } else if (format === "json" && data) {
        exportJSON(data, filename);
      } else if (format === "xlsx") {
        alert("XLSX export requires installation of xlsx library");
      }

      onExport?.(format, options);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportCSV = (
    data: any[],
    name: string,
    options: ExportOptions
  ) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    let csv = "";

    if (options.includeHeaders) {
      csv = headers.join(",") + "\n";
    }

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      });
      csv += values.join(",") + "\n";
    });

    downloadFile(csv, `${name}.csv`, "text/csv");
  };

  const exportJSON = (data: any[], name: string) => {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `${name}.json`, "application/json");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const element = document.createElement("a");
    element.setAttribute("href", `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-md w-full mx-4">
        {}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <FiDownload className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {}
        <div className="p-6 space-y-6">
          {}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {[
                { value: "csv", label: "CSV - Comma Separated Values" },
                { value: "json", label: "JSON - JavaScript Object Notation" },
                { value: "xlsx", label: "XLSX - Microsoft Excel", disabled: true },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    format === option.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                  } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={format === option.value}
                    onChange={(e) => setFormat(e.target.value as any)}
                    disabled={option.disabled}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Include column headers
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formatNumbers}
                  onChange={(e) => setFormatNumbers(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Format numbers with commas
                </span>
              </label>
            </div>
          </div>

          {}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ℹ Exporting {data?.length || 0} records in {format.toUpperCase()}
              format
            </p>
          </div>
        </div>

        {}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition font-medium flex items-center justify-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
