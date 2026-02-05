import React, { useState } from "react";
import { FiX, FiSliders } from "react-icons/fi";

interface FilterOption {
  label: string;
  value: string;
}

export interface FilterPanelProps {
  onFilterChange?: (filters: FilterState) => void;
  commodities?: FilterOption[];
  markets?: FilterOption[];
  showDateRange?: boolean;
}

interface FilterState {
  commodities: string[];
  markets: string[];
  priceMin?: number;
  priceMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * FilterPanel - Advanced filtering UI for analytics
 * Supports commodity, market, price range, and date filtering
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  commodities = [
    { label: "Rice", value: "rice" },
    { label: "Wheat", value: "wheat" },
    { label: "Maize", value: "maize" },
  ],
  markets = [
    { label: "Delhi", value: "delhi" },
    { label: "Mumbai", value: "mumbai" },
    { label: "Bangalore", value: "bangalore" },
  ],
  showDateRange = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    commodities: [],
    markets: [],
  });

  const handleCommodityChange = (value: string) => {
    const updated = filters.commodities.includes(value)
      ? filters.commodities.filter((c) => c !== value)
      : [...filters.commodities, value];

    const newFilters = { ...filters, commodities: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleMarketChange = (value: string) => {
    const updated = filters.markets.includes(value)
      ? filters.markets.filter((m) => m !== value)
      : [...filters.markets, value];

    const newFilters = { ...filters, markets: updated };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handlePriceChange = (field: "priceMin" | "priceMax", value: string) => {
    const newFilters = { ...filters, [field]: value ? parseFloat(value) : undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleDateChange = (field: "dateFrom" | "dateTo", value: string) => {
    const newFilters = { ...filters, [field]: value || undefined };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    const cleared = { commodities: [], markets: [] };
    setFilters(cleared);
    onFilterChange?.(cleared);
  };

  const activeFilterCount =
    filters.commodities.length +
    filters.markets.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition"
      >
        <FiSliders className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50 p-6">
          {}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Commodities
            </label>
            <div className="space-y-2">
              {commodities.map((commodity) => (
                <label
                  key={commodity.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.commodities.includes(commodity.value)}
                    onChange={() => handleCommodityChange(commodity.value)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {commodity.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Markets
            </label>
            <div className="space-y-2">
              {markets.map((market) => (
                <label
                  key={market.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.markets.includes(market.value)}
                    onChange={() => handleMarketChange(market.value)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {market.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Price Range (₹)
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin || ""}
                onChange={(e) => handlePriceChange("priceMin", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax || ""}
                onChange={(e) => handlePriceChange("priceMax", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {}
          {showDateRange && (
            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => handleDateChange("dateFrom", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleDateChange("dateTo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {}
          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition font-medium"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
