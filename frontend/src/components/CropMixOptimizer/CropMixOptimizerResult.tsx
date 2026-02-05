import React from 'react';

export type CropMixResult = {
  optimized_mix: { name: string; area: number; expected_profit: number }[];
  total_expected_profit: number;
  notes?: string[];
};

export const CropMixOptimizerResult: React.FC<{ result: CropMixResult }> = ({ result }) => (
  <div>
    <h3>Optimized Crop Mix</h3>
    <ul>
      {result.optimized_mix.map((crop, idx) => (
        <li key={idx}>
          <b>{crop.name}</b>: {crop.area} ha (Expected Profit: ₹{crop.expected_profit})
        </li>
      ))}
    </ul>
    <p><b>Total Expected Profit:</b> ₹{result.total_expected_profit}</p>
    {result.notes && result.notes.length > 0 && (
      <>
        <h4>Notes</h4>
        <ul>
          {result.notes.map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      </>
    )}
  </div>
);
