import React from 'react';
import { useForm } from 'react-hook-form';

export type SellingStrategyInput = {
  commodity: string;
  quantity: number;
  current_price: number;
  harvest_date: string;
};

export const SellingStrategyForm: React.FC<{ onSubmit: (data: SellingStrategyInput) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm<SellingStrategyInput>({
    defaultValues: {
      commodity: '',
      quantity: 0,
      current_price: 0,
      harvest_date: '',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Commodity: <input {...register('commodity', { required: true })} /></label><br />
      <label>Quantity (kg): <input type="number" step="0.01" {...register('quantity', { required: true })} /></label><br />
      <label>Current Price: <input type="number" step="0.01" {...register('current_price', { required: true })} /></label><br />
      <label>Harvest Date: <input type="date" {...register('harvest_date', { required: true })} /></label><br />
      <button type="submit">Get Selling Strategy</button>
    </form>
  );
};
