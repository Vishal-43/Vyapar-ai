import React from 'react';

export type AlternativeSellWindow = {
  month: string;
  expected_price: number;
  reason: string;
};

export type SellingRecommendation = {
  strategy: string;
  expected_price: number;
  storage_cost: number;
  confidence: number;
  reasoning: string;
  alternative_windows?: AlternativeSellWindow[];
};

export const StrategyResult: React.FC<{ result: SellingRecommendation }> = ({ result }) => (
  <div>
    <h3>Recommended Strategy: {result.strategy}</h3>
    <p>Expected Price: ₹{result.expected_price.toFixed(2)}</p>
    <p>Storage Cost: ₹{result.storage_cost.toFixed(2)}</p>
    <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>
    <p>Reasoning: {result.reasoning}</p>
    {result.alternative_windows && (
      <div>
        <h4>Alternative Sell Windows</h4>
        <ul>
          {result.alternative_windows.map((w, idx) => (
            <li key={idx}>{w.month}: ₹{w.expected_price.toFixed(2)} ({w.reason})</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
