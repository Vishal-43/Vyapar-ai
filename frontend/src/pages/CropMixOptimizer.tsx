import React, { useState } from 'react';
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
      const response = await fetch('/api/crop-mix/optimize', {
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Crop Mix Optimizer</h2>
      <CropMixOptimizerForm onSubmit={handleSubmit} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {result && <CropMixOptimizerResult result={result} />}
    </div>
  );
};

export default CropMixOptimizer;
