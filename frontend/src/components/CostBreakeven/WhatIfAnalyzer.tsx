import React from 'react';

export const WhatIfAnalyzer: React.FC<{ onSimulate: (delta: { price?: number; yield?: number }) => void }> = ({ onSimulate }) => {
  const [price, setPrice] = React.useState<number | undefined>();
  const [yieldVal, setYield] = React.useState<number | undefined>();
  return (
    <div>
      <h4>What-If Analyzer</h4>
      <label>Simulate Price: <input type="number" step="0.01" value={price ?? ''} onChange={e => setPrice(Number(e.target.value))} /></label>
      <label>Simulate Yield: <input type="number" step="0.01" value={yieldVal ?? ''} onChange={e => setYield(Number(e.target.value))} /></label>
      <button onClick={() => onSimulate({ price, yield: yieldVal })}>Simulate</button>
    </div>
  );
};
