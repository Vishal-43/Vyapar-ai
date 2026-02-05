import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

export type CostInput = {
  commodity: string;
  hectares: number;
  costs: { category: string; amount: number }[];
  expected_yield: number;
  current_price: number;
};

const defaultCosts = [
  { category: 'Seeds', amount: 0 },
  { category: 'Fertilizer', amount: 0 },
  { category: 'Labor', amount: 0 },
  { category: 'Water', amount: 0 },
  { category: 'Pesticide', amount: 0 },
];

export const CostInputForm: React.FC<{ onSubmit?: (data: CostInput) => void }> = ({ onSubmit }) => {
  const { control, handleSubmit, register } = useForm<CostInput>({
    defaultValues: {
      commodity: '',
      hectares: 1,
      costs: defaultCosts,
      expected_yield: 0,
      current_price: 0,
    },
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (data: CostInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/cost-breakeven/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to analyze profitability');
      const resData = await response.json();
      setResult(resData);
      if (onSubmit) onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <label>Commodity: <input {...register('commodity', { required: true })} /></label><br />
        <label>Hectares: <input type="number" step="0.01" {...register('hectares', { required: true })} /></label><br />
        <label>Expected Yield (per hectare): <input type="number" step="0.01" {...register('expected_yield', { required: true })} /></label><br />
        <label>Current Price: <input type="number" step="0.01" {...register('current_price', { required: true })} /></label><br />
        <fieldset>
          <legend>Costs (per hectare):</legend>
          {defaultCosts.map((cost, idx) => (
            <div key={cost.category}>
              <label>{cost.category}: <input type="number" step="0.01" {...register(`costs.${idx}.amount` as const, { required: true })} /></label>
            </div>
          ))}
        </fieldset>
        <button type="submit" disabled={loading}>{loading ? 'Analyzing...' : 'Analyze Profitability'}</button>
      </form>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {result && (
        <div style={{ marginTop: 16, border: '1px solid #ccc', padding: 12 }}>
          <h4>Profitability Analysis Result</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </>
  );
};
