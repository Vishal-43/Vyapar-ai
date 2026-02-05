import React, { useState } from "react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useDataImport } from "../context/DataImportContext";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import Breadcrumbs from "../components/common/Breadcrumbs";
import type { ImportType } from "../context/DataImportContext";

type ImportStep = "upload" | "preview" | "validate" | "import" | "complete";

const DataImport: React.FC = () => {
  const {
    currentJob,
    isLoading,
    error,
    uploadFile,
    validateImport,
    startImport,
    clearCurrentJob,
  } = useDataImport();

  const [step, setStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>("SALES_DATA");
  const [proceedWithErrors, setProceedWithErrors] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const importTypeDescriptions = {
    SALES_DATA: {
      title: "Sales Data",
      description: "Import sales history with prices and quantities",
      columns:
        "date, market_name, commodity_name, price, quantity, unit, grade",
      example: "2026-01-29, Azadpur Market, Wheat, 2500.00, 100, kg, A-grade",
    },
    MARKET_PRICES: {
      title: "Market Prices",
      description: "Import market price data from Agmarknet or other sources",
      columns:
        "date, market_name, commodity_name, min_price, max_price, modal_price, arrival_quantity",
      example: "2026-01-29, Mumbai Market, Rice, 2400.00, 2600.00, 2500.00, 1000",
    },
    INVENTORY: {
      title: "Inventory Data",
      description: "Import inventory levels and movements",
      columns:
        "date, market_name, commodity_name, quantity_in_stock, quantity_sold, quantity_damaged, unit, notes",
      example: "2026-01-29, Azadpur Market, Potato, 5000, 1200, 50, kg, Good condition",
    },
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setUploadError("Please select a CSV file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file");
      return;
    }

    try {
      const response = await uploadFile(selectedFile, importType);
      setPreview(response.preview);
      setStep("preview");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleValidate = async () => {
    if (!currentJob) return;

    try {
      const job = await validateImport(currentJob.job_id);
      setStep("validate");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Validation failed");
    }
  };

  const handleStartImport = async () => {
    if (!currentJob) return;

    try {
      const job = await startImport(currentJob.job_id, proceedWithErrors);
      setStep("import");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleReset = () => {
    clearCurrentJob();
    setStep("upload");
    setSelectedFile(null);
    setPreview([]);
    setUploadError(null);
    setProceedWithErrors(false);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(Object.keys(importTypeDescriptions) as ImportType[]).map((type) => (
          <label key={type} className="cursor-pointer">
            <input
              type="radio"
              name="importType"
              value={type}
              checked={importType === type}
              onChange={(e) => setImportType(e.target.value as ImportType)}
              className="sr-only"
            />
            <div
              className={`glass-card p-4 border-2 transition-all hover:shadow-lg ${
                importType === type
                  ? "border-[rgb(var(--emerald-main))]"
                  : "hover:border-opacity-70"
              }`}
              style={{
                borderColor: importType === type ? "rgb(var(--emerald-main))" : "var(--border)",
                background: importType === type ? "rgba(var(--emerald-main), 0.1)" : undefined,
                borderRadius: 0
              }}
            >
              <div className="font-semibold" style={{ color: "var(--text-main)" }}>
                {importTypeDescriptions[type].title}
              </div>
              <div className="text-sm mt-1" style={{ color: "var(--text-soft)" }}>
                {importTypeDescriptions[type].description}
              </div>
            </div>
          </label>
        ))}
      </div>

      {}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 sm:p-12 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors bg-gray-50 dark:bg-gray-900/50">
        <div className="flex justify-center mb-4">
          <Upload className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: "var(--text-soft)" }} />
        </div>
        <p className="text-sm sm:text-base mb-4" style={{ color: "var(--text-soft)" }}>
          Drag and drop your CSV file here, or click to select
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input">
          <button
            onClick={() => document.getElementById("file-input")?.click()}
            className="px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 transition-opacity font-medium shadow-sm"
            style={{ borderRadius: 0 }}
          >
            Select File
          </button>
        </label>

        {selectedFile && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-emerald-800 dark:text-emerald-200 font-medium"> {selectedFile.name}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </div>

      {}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Required Columns:</p>
        <code className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 block font-mono mb-3 bg-white dark:bg-gray-950 p-2 rounded border border-blue-100 dark:border-blue-900">
          {importTypeDescriptions[importType].columns}
        </code>
        <p className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Example:</p>
        <code className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 block font-mono p-2 border" style={{ background: "var(--panel)", borderColor: "rgba(59, 130, 246, 0.2)", borderRadius: 0 }}>
          {importTypeDescriptions[importType].example}
        </code>
      </div>

      {uploadError && (
        <div className="glass-card p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3" style={{ borderRadius: 0 }}>
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-800 dark:text-red-300">{uploadError}</div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className="w-full px-6 py-3 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-semibold flex items-center justify-center gap-2 shadow-sm"
        style={{ borderRadius: 0 }}
      >
        {isLoading ? "Uploading..." : "Upload & Preview"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-main)" }}>Data Preview</h3>
        <div className="glass-card overflow-x-auto border shadow-sm" style={{ borderColor: "var(--border)", borderRadius: 0 }}>
          <table className="w-full text-sm">
            <thead className="border-b" style={{ background: "rgba(var(--glass-white), 0.3)", borderColor: "var(--border)" }}>
              <tr>
                {preview[0] &&
                  Object.keys(preview[0]).map((key) => (
                    <th
                      key={key}
                      className="px-3 sm:px-4 py-2 text-left font-semibold whitespace-nowrap"
                      style={{ color: "var(--text-main)" }}
                    >
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b hover:opacity-70 transition-opacity" style={{ borderColor: "var(--border)" }}>
                  {Object.values(row).map((value: any, colIdx) => (
                    <td key={colIdx} className="px-3 sm:px-4 py-2 whitespace-nowrap" style={{ color: "var(--text-soft)" }}>
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm mt-2" style={{ color: "var(--text-soft)" }}>
          Showing first 5 of {currentJob?.stats?.total_records || 0} records
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setStep("upload")}
          className="px-6 py-2.5 border text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium shadow-sm"
          style={{ borderColor: "var(--border)", borderRadius: 0 }}
        >
          Back
        </button>
        <button
          onClick={handleValidate}
          disabled={isLoading}
          className="flex-1 px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity font-semibold flex items-center justify-center gap-2 shadow-sm"
          style={{ borderRadius: 0 }}
        >
          {isLoading ? "Validating..." : "Validate Data"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderValidateStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 border shadow-sm" style={{ borderColor: "var(--border)", borderRadius: 0 }}>
          <div className="text-xs sm:text-sm" style={{ color: "var(--text-soft)" }}>Total Records</div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-main)" }}>
            {currentJob?.stats?.total_records || 0}
          </div>
        </div>
        <div className="glass-card p-4 border shadow-sm" style={{ borderColor: "rgba(16, 185, 129, 0.3)", background: "rgba(16, 185, 129, 0.1)", borderRadius: 0 }}>
          <div className="text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">Valid Records</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-200">
            {currentJob?.stats?.valid_records || 0}
          </div>
        </div>
        <div className="glass-card p-4 border shadow-sm" style={{ borderColor: "rgba(234, 179, 8, 0.3)", background: "rgba(234, 179, 8, 0.1)", borderRadius: 0 }}>
          <div className="text-yellow-700 dark:text-yellow-400 text-xs sm:text-sm">Invalid Records</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-900 dark:text-yellow-200">
            {currentJob?.stats?.invalid_records || 0}
          </div>
        </div>
        <div className="glass-card p-4 border shadow-sm" style={{ borderColor: "rgba(249, 115, 22, 0.3)", background: "rgba(249, 115, 22, 0.1)", borderRadius: 0 }}>
          <div className="text-orange-700 dark:text-orange-400 text-xs sm:text-sm">Duplicates</div>
          <div className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-200">
            {currentJob?.stats?.duplicate_records || 0}
          </div>
        </div>
      </div>

      {currentJob?.stats?.validation_errors && currentJob.stats.validation_errors.length > 0 && (
        <div className="glass-card bg-red-50 dark:bg-red-900/20 border p-4" style={{ borderColor: "rgba(239, 68, 68, 0.3)", borderRadius: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h4 className="font-semibold text-red-900 dark:text-red-200">
              {currentJob.stats.validation_errors.length} Validation Errors
            </h4>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {currentJob.stats.validation_errors.slice(0, 10).map((err, idx) => (
              <div key={idx} className="text-sm p-2 bg-white dark:bg-gray-900 border" style={{ borderColor: "rgba(239, 68, 68, 0.2)", borderRadius: 0 }}>
                <div className="text-red-900 dark:text-red-200 font-mono">
                  Row {err.row}: {err.error_message}
                </div>
                {err.suggestion && (
                  <div className="text-red-700 text-xs mt-1">
                     {err.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 mt-4 p-2 bg-white dark:bg-gray-900" style={{ borderRadius: 0 }}>
            <input
              type="checkbox"
              checked={proceedWithErrors}
              onChange={(e) => setProceedWithErrors(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-red-900 dark:text-red-200">
              Proceed with import despite errors
            </span>
          </label>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setStep("preview")}
          className="px-6 py-2.5 border text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium shadow-sm"
          style={{ borderColor: "var(--border)", borderRadius: 0 }}
        >
          Back
        </button>
        <button
          onClick={handleStartImport}
          disabled={isLoading || (currentJob?.stats?.invalid_records || 0) > 0 && !proceedWithErrors}
          className="flex-1 px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 active:opacity-80 disabled:opacity-50 transition-opacity font-semibold flex items-center justify-center gap-2 shadow-sm"
          style={{ borderRadius: 0 }}
        >
          {isLoading ? "Starting..." : "Start Import"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <div className="space-y-6">
      <div className="glass-card p-5 sm:p-6 border shadow-sm" style={{ borderColor: "var(--border)", borderRadius: 0 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center" style={{ background: "rgba(var(--emerald-main), 0.1)", borderRadius: 0 }}>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[rgb(var(--emerald-main))] animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-main)" }}>
              {currentJob?.status === "COMPLETED"
                ? "Import Completed"
                : "Importing Data"}
            </h3>
            <p className="text-sm" style={{ color: "var(--text-soft)" }}>
              {currentJob?.status === "COMPLETED"
                ? "All data has been successfully imported"
                : "Please wait while we import your data..."}
            </p>
          </div>
        </div>

        {}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "var(--text-main)" }}>Progress</span>
            <span className="text-sm font-bold" style={{ color: "var(--text-main)" }}>
              {currentJob?.progress_percentage || 0}%
            </span>
          </div>
          <div className="w-full h-2.5 shadow-inner" style={{ background: "var(--panel)", borderRadius: 0 }}>
            <div
              className="bg-[rgb(var(--emerald-main))] h-2.5 transition-all duration-500 shadow-sm"
              style={{
                width: `${currentJob?.progress_percentage || 0}%`,
              }}
            />
          </div>
        </div>

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-3" style={{ borderRadius: 0 }}>
            <div className="text-xs" style={{ color: "var(--text-soft)" }}>Inserted</div>
            <div className="text-base sm:text-lg font-bold" style={{ color: "var(--text-main)" }}>
              {currentJob?.stats?.inserted_records || 0}
            </div>
          </div>
          <div className="glass-card p-3" style={{ borderRadius: 0 }}>
            <div className="text-xs" style={{ color: "var(--text-soft)" }}>Skipped</div>
            <div className="text-base sm:text-lg font-bold" style={{ color: "var(--text-main)" }}>
              {currentJob?.stats?.skipped_records || 0}
            </div>
          </div>
          <div className="glass-card p-3" style={{ borderRadius: 0 }}>
            <div className="text-xs" style={{ color: "var(--text-soft)" }}>Duplicates</div>
            <div className="text-base sm:text-lg font-bold" style={{ color: "var(--text-main)" }}>
              {currentJob?.stats?.duplicate_records || 0}
            </div>
          </div>
          <div className="glass-card p-3" style={{ borderRadius: 0 }}>
            <div className="text-xs" style={{ color: "var(--text-soft)" }}>Time Remaining</div>
            <div className="text-base sm:text-lg font-bold" style={{ color: "var(--text-main)" }}>
              {currentJob?.estimated_time_remaining
                ? `${Math.ceil(currentJob.estimated_time_remaining)}s`
                : "−"}
            </div>
          </div>
        </div>
      </div>

      {currentJob?.status === "COMPLETED" && (
        <div className="glass-card p-4 bg-green-50 dark:bg-green-900/20 border flex gap-3 items-start" style={{ borderColor: "rgba(34, 197, 94, 0.3)", borderRadius: 0 }}>
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-green-800 dark:text-green-200">
            <p className="font-semibold">Import Successful!</p>
            <p className="text-sm mt-1">
              {currentJob.stats?.inserted_records || 0} records have been added
              to the database.
            </p>
          </div>
        </div>
      )}

      {currentJob?.status === "FAILED" && (
        <div className="glass-card p-4 bg-red-50 dark:bg-red-900/20 border flex gap-3 items-start" style={{ borderColor: "rgba(239, 68, 68, 0.3)", borderRadius: 0 }}>
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-800 dark:text-red-200">
            <p className="font-semibold">Import Failed</p>
            <p className="text-sm mt-1">{currentJob.error_message}</p>
          </div>
        </div>
      )}

      {currentJob?.status === "COMPLETED" && (
        <button
          onClick={handleReset}
          className="w-full px-6 py-2.5 bg-[rgb(var(--emerald-main))] text-white hover:opacity-90 active:opacity-80 transition-opacity font-semibold shadow-sm"
          style={{ borderRadius: 0 }}
        >
          Import Another File
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case "upload":
        return renderUploadStep();
      case "preview":
        return renderPreviewStep();
      case "validate":
        return renderValidateStep();
      case "import":
        return renderImportStep();
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      {}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Data Import", href: "/data/import" },
            ]}
          />
          <h1 className="text-3xl font-bold mt-2" style={{ color: "var(--text-main)" }}>Import Data</h1>
          <p className="mt-1" style={{ color: "var(--text-soft)" }}>
            Upload CSV files to import sales, market price, or inventory data
          </p>
        </div>
      </div>

      {}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {}
        <div className="flex gap-2 sm:gap-4 mb-8">
          {(
            [
              { key: "upload", label: "Upload" },
              { key: "preview", label: "Preview" },
              { key: "validate", label: "Validate" },
              { key: "import", label: "Import" },
            ] as const
          ).map((s, idx, arr) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-semibold transition-all text-sm sm:text-base ${
                    arr.findIndex((x) => x.key === step) >= idx
                      ? "bg-[rgb(var(--emerald-main))] text-white shadow-lg"
                      : ""
                  }`}
                  style={{
                    borderRadius: 0,
                    background: arr.findIndex((x) => x.key === step) >= idx ? undefined : "var(--panel)",
                    color: arr.findIndex((x) => x.key === step) >= idx ? undefined : "var(--text-soft)"
                  }}
                >
                  {idx + 1}
                </div>
                <label className="text-xs font-semibold mt-2 text-center hidden sm:block" style={{ color: "var(--text-soft)" }}>
                  {s.label}
                </label>
              </div>
              {idx < arr.length - 1 && (
                <div
                  className={`flex-1 h-1 mt-4 sm:mt-5 transition-colors ${
                    arr.findIndex((x) => x.key === step) > idx
                      ? "bg-[rgb(var(--emerald-main))]"
                      : ""
                  }`}
                  style={{
                    background: arr.findIndex((x) => x.key === step) > idx ? undefined : "var(--border)",
                    borderRadius: 0
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 lg:p-8 shadow-sm">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataImport;
