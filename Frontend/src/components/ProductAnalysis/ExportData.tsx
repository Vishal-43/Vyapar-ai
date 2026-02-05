import { useState } from "react";
import { FiDownload, FiFileText, FiTable, FiCheck } from "react-icons/fi";
import CardComponent from "../ui/CardComponent";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

type ExportFormat = "csv" | "json";

export default function ExportData() {
  const [exportType, setExportType] = useState<"prices" | "inventory" | "forecasts">("prices");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      let data: any[] = [];
      let filename = "";

      switch (exportType) {
        case "prices": {
          const res = await fetch(`${BACKEND_URL}/api/export/prices?days=30`);
          if (res.ok) {
            const result = await res.json();
            data = Array.isArray(result) ? result : [];
            filename = `price_history_${new Date().toISOString().split("T")[0]}`;
          }
          break;
        }
        case "inventory": {
          const res = await fetch(`${BACKEND_URL}/api/inventory`);
          if (res.ok) {
            const result = await res.json();
            data = Array.isArray(result) ? result : (result.items || []);
            filename = `inventory_${new Date().toISOString().split("T")[0]}`;
          }
          break;
        }
        case "forecasts": {
          // Get forecast data from localStorage selection
          const selection = JSON.parse(localStorage.getItem("forecastSelection") || "{}");
          const res = await fetch(`${BACKEND_URL}/api/forecast`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: selection.product || "Potato",
              market: selection.market || "Azadpur",
              forecast_range: 14,
            }),
          });
          if (res.ok) {
            const forecastData = await res.json();
            data = forecastData.forecasts || [];
            filename = `forecast_${selection.product || "commodity"}_${new Date().toISOString().split("T")[0]}`;
          }
          break;
        }
      }

      if (data.length === 0) {
        alert("No data available to export. Please ensure there is data in the database.");
        return;
      }

      let content: string;
      let mimeType: string;

      if (format === "csv") {
        // Convert to CSV
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(","),
          ...data.map((row) =>
            headers
              .map((header) => {
                const val = row[header];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
                  return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
              })
              .join(",")
          ),
        ];
        content = csvRows.join("\n");
        mimeType = "text/csv";
        filename += ".csv";
      } else {
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        filename += ".json";
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <CardComponent
      title={
        <div className="flex items-center gap-2">
          <FiDownload className="text-blue-500" />
          <span>Export Data</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Data Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Data Type</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "prices", label: "Price History", icon: FiTable },
              { id: "inventory", label: "Inventory", icon: FiFileText },
              { id: "forecasts", label: "Forecasts", icon: FiTable },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setExportType(id as typeof exportType)}
                className={`p-3 rounded-xl border text-center transition ${
                  exportType === id
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="mx-auto mb-1" size={18} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat("csv")}
              className={`p-3 rounded-xl border text-center transition ${
                format === "csv"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="text-lg font-bold">.CSV</span>
              <p className="text-xs text-gray-500 mt-1">Excel compatible</p>
            </button>
            <button
              onClick={() => setFormat("json")}
              className={`p-3 rounded-xl border text-center transition ${
                format === "json"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="text-lg font-bold">.JSON</span>
              <p className="text-xs text-gray-500 mt-1">Developer format</p>
            </button>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={exportData}
          disabled={isExporting}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${
            exportSuccess
              ? "bg-emerald-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600"
          } disabled:opacity-50`}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Exporting...
            </>
          ) : exportSuccess ? (
            <>
              <FiCheck size={18} />
              Downloaded!
            </>
          ) : (
            <>
              <FiDownload size={18} />
              Download {format.toUpperCase()}
            </>
          )}
        </button>

        <p className="text-xs text-center text-gray-500">
          Export up to 30 days of data in your preferred format
        </p>
      </div>
    </CardComponent>
  );
}
