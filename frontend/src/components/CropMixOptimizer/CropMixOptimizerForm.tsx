import React from 'react';
import { useForm, Controller } from 'react-hook-form';

export type CropMixInput = {
  crops: { name: string; area: number }[];
  total_area: number;
  location: string;
  season: string;
};

const defaultCrops = [
  { name: 'Wheat', area: 0 },
  { name: 'Rice', area: 0 },
  { name: 'Maize', area: 0 },
];

export const CropMixOptimizerForm: React.FC<{ onSubmit: (data: CropMixInput) => void }> = ({ onSubmit }) => {
  const { control, handleSubmit, register } = useForm<CropMixInput>({
    defaultValues: {
      crops: defaultCrops,
      total_area: 1,
      location: '',
      season: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Total Area (hectares): <input type="number" step="0.01" {...register('total_area', { required: true })} /></label><br />
      <label>Location: <input {...register('location', { required: true })} /></label><br />
      <label>Season: <input {...register('season', { required: true })} /></label><br />
      <fieldset>
        <legend>Crops and Area Allocation:</legend>
        {defaultCrops.map((crop, idx) => (
          <div key={crop.name}>
            <label>{crop.name} Area: <input type="number" step="0.01" {...register(`crops.${idx}.area` as const, { required: true })} /></label>
          </div>
        ))}
      </fieldset>
      <button type="submit">Optimize Crop Mix</button>
    </form>
  );
};
