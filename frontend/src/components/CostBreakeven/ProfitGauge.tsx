import React from 'react';

export const ProfitGauge: React.FC<{ netProfit: number }> = ({ netProfit }) => {
  let color = 'gray';
  if (netProfit > 10000) color = 'green';
  else if (netProfit > 0) color = 'orange';
  else color = 'red';
  return (
    <div style={{ border: `2px solid ${color}`, padding: 16, borderRadius: 8 }}>
      <h3>Net Profit: <span style={{ color }}>{netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></h3>
    </div>
  );
};
