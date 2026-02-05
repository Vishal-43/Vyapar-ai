import React from 'react';
import { TrendingUp, DollarSign, Sprout, Info } from 'lucide-react';

export type CropMixResult = {
  optimized_mix: { name: string; area: number; expected_profit: number }[];
  total_expected_profit: number;
  notes?: string[];
};

export const CropMixOptimizerResult: React.FC<{ result: CropMixResult }> = ({ result }) => (
  <div className="space-y-6">
    {/* Total Profit Card */}
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-3 rounded-lg">
          <DollarSign className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-90">Total Expected Profit</p>
          <h2 className="text-3xl font-bold">₹{result.total_expected_profit.toLocaleString()}</h2>
        </div>
      </div>
    </div>

    {/* Optimized Mix */}
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-500" />
        Optimized Crop Distribution
      </h3>
      <div className="space-y-3">
        {result.optimized_mix.map((crop, idx) => (
          <div 
            key={idx} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{crop.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {crop.area} hectares allocated
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ₹{crop.expected_profit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Expected Profit</p>
              </div>
            </div>
            
            {/* Progress bar for area allocation */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Area allocation</span>
                <span>{((crop.area / result.optimized_mix.reduce((sum, c) => sum + c.area, 0)) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(crop.area / result.optimized_mix.reduce((sum, c) => sum + c.area, 0)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Notes */}
    {result.notes && result.notes.length > 0 && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Info className="w-5 h-5 text-blue-500" />
          Important Notes
        </h3>
        <ul className="space-y-2">
          {result.notes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
              <span className="text-blue-500 mt-1.5 flex-shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
