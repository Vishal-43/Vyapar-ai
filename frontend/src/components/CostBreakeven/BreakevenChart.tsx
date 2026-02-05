import React from 'react';

export const BreakevenChart: React.FC<{ breakevenPrice: number; currentPrice: number }> = ({ breakevenPrice, currentPrice }) => {
  const percent = ((currentPrice - breakevenPrice) / breakevenPrice) * 100;
  return (
    <div>
      <h4>Breakeven Price: ₹{breakevenPrice.toFixed(2)}</h4>
      <h4>Current Price: ₹{currentPrice.toFixed(2)}</h4>
      <div style={{ width: 300, height: 20, background: '#eee', borderRadius: 10, margin: '8px 0' }}>
        <div style={{ width: `${Math.max(0, Math.min(100, percent + 50))}%`, height: '100%', background: percent > 0 ? 'green' : 'red', borderRadius: 10 }} />
      </div>
      <span>{percent > 0 ? `Above breakeven by ${percent.toFixed(1)}%` : `Below breakeven by ${Math.abs(percent).toFixed(1)}%`}</span>
    </div>
  );
};
