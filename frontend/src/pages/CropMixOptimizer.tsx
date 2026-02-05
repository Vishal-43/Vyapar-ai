import React, { useState } from 'react';
import Navbar from '../components/dashboard/Navbar/Navbar';
import DashFooter from '../components/dashboard/Home/dashFooter';
import GraphBackgroundCorner from '../components/Background/GraphBackgroundCorner';
import { CropMixOptimizerForm, CropMixInput } from '../components/CropMixOptimizer/CropMixOptimizerForm';
import { CropMixOptimizerResult, CropMixResult } from '../components/CropMixOptimizer/CropMixOptimizerResult';

const CropMixOptimizer: React.FC = () => {
  const [result, setResult] = useState<CropMixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CropMixInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/v1/crop-mix/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to optimize crop mix');
      const resData = await response.json();
      setResult(resData);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-green-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-emerald-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundCorner />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Crop Mix Optimizer</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Optimize your crop allocation to maximize profits based on soil, climate, and market conditions.
          </p>
        </header>

        <div className="space-y-6">
          <CropMixOptimizerForm onSubmit={handleSubmit} loading={loading} />
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-medium">Error: {error}</p>
            </div>
          )}
          
          {result && <CropMixOptimizerResult result={result} />}
        </div>
      </main>

      <DashFooter />
    </div>
  );
};

export default CropMixOptimizer;
