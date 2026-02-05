import { useState, useRef } from "react";
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle, FiDownload } from "react-icons/fi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      setPreviewData([]);
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const data = lines.slice(1, 6).map(line => {
      const values = line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || "";
      });
      return row;
    });

    setPreviewData(data);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        setResult({ success: 0, failed: 0, errors: ["File is empty or has no data rows"] });
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const requiredHeaders = ["commodity", "market", "quantity"];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setResult({
          success: 0,
          failed: 0,
          errors: [`Missing required columns: ${missingHeaders.join(", ")}`],
        });
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // First get commodity and market mappings
      const [commoditiesRes, marketsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/commodities`),
        fetch(`${BACKEND_URL}/api/markets`),
      ]);

      const commodities = commoditiesRes.ok ? await commoditiesRes.json() : [];
      const markets = marketsRes.ok ? await marketsRes.json() : [];

      const commodityMap = new Map(commodities.map((c: any) => [c.name.toLowerCase(), c.id]));
      const marketMap = new Map(markets.map((m: any) => [m.name.toLowerCase(), m.id]));

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx]?.trim() || "";
        });

        const commodityId = commodityMap.get(row.commodity?.toLowerCase());
        const marketId = marketMap.get(row.market?.toLowerCase());

        if (!commodityId) {
          errors.push(`Row ${i}: Commodity "${row.commodity}" not found`);
          failed++;
          continue;
        }

        if (!marketId) {
          errors.push(`Row ${i}: Market "${row.market}" not found`);
          failed++;
          continue;
        }

        const quantity = parseFloat(row.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Row ${i}: Invalid quantity "${row.quantity}"`);
          failed++;
          continue;
        }

        try {
          const response = await fetch(`${BACKEND_URL}/api/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              commodity_id: commodityId,
              market_id: marketId,
              quantity: quantity,
              unit_cost: parseFloat(row.unit_cost) || 0,
              notes: row.notes || "",
            }),
          });

          if (response.ok) {
            success++;
          } else {
            const errorData = await response.json();
            errors.push(`Row ${i}: ${errorData.detail || "Failed to add"}`);
            failed++;
          }
        } catch (error) {
          errors.push(`Row ${i}: Network error`);
          failed++;
        }
      }

      setResult({ success, failed, errors: errors.slice(0, 10) });
    } catch (error) {
      setResult({
        success: 0,
        failed: 0,
        errors: ["Failed to process file. Please check the format."],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = "commodity,market,quantity,unit_cost,notes\nPotato,Delhi,100,1500,Initial stock\nOnion,Mumbai,50,2000,\n";
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FiUpload className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bulk Import Inventory
          </h3>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          <FiDownload className="w-4 h-4" />
          Template
        </button>
      </div>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          file
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
            : "border-gray-300 dark:border-gray-700 hover:border-emerald-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FiFile className="w-8 h-8 text-emerald-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreviewData([]);
                setResult(null);
              }}
              className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <FiUpload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-400 mt-1">CSV file only</p>
          </>
        )}
      </div>

      {/* Preview */}
      {previewData.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preview (first 5 rows):
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {Object.keys(previewData[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    {Object.values(row).map((value: any, vIdx) => (
                      <td key={vIdx} className="px-3 py-2 text-gray-900 dark:text-white">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FiUpload className="w-5 h-5" />
              Import Inventory
            </>
          )}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className={`mt-4 p-4 rounded-xl ${
          result.failed === 0 
            ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800" 
            : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        }`}>
          <div className="flex items-start gap-3">
            {result.failed === 0 ? (
              <FiCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Import Complete
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {result.success} items imported successfully
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                  {result.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
