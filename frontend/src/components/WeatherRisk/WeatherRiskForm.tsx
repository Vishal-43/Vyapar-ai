import React from 'react';
import { useForm } from 'react-hook-form';

export type WeatherRiskInput = {
  commodity: string;
  sowing_date: string;
  location: string;
};

export const WeatherRiskForm: React.FC<{ onSubmit: (data: WeatherRiskInput) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm<WeatherRiskInput>({
    defaultValues: {
      commodity: '',
      sowing_date: '',
      location: '',
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <label>Commodity: <input {...register('commodity', { required: true })} /></label><br />
      <label>Sowing Date: <input type="date" {...register('sowing_date', { required: true })} /></label><br />
      <label>Location: <input {...register('location', { required: true })} /></label><br />
      <button type="submit">Assess Weather Risk</button>
    </form>
  );
};
