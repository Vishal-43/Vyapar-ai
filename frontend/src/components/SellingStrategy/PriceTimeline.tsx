import React from 'react';

export const PriceTimeline: React.FC<{ prices: { month: string; price: number }[] }> = ({ prices }) => (
  <div>
    <h4>Price Timeline</h4>
    <div style={{ display: 'flex', gap: 8 }}>
      {prices.map((p, idx) => (
        <div key={idx} style={{ textAlign: 'center' }}>
          <div style={{ height: p.price / 10, width: 20, background: '#4caf50', marginBottom: 4 }} />
          <span>{p.month}</span><br />
          <span>₹{p.price.toFixed(0)}</span>
        </div>
      ))}
    </div>
  </div>
);
