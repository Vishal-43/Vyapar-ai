import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Sprout, MapPin, Calendar, PieChart, Plus, Minus } from 'lucide-react';

export type CropMixInput = {
  crops: { name: string; area: number }[];
  total_area: number;
  location: string;
  season: string;
};

const availableCrops = [
  'Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Potato',
  'Tomato', 'Onion', 'Soybean', 'Groundnut', 'Mustard', 'Chickpea'
];

const seasons = ['Kharif', 'Rabi', 'Zaid'];

const cities = [
  'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata',
  'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
];

export const CropMixOptimizerForm: React.FC<{ 
  onSubmit: (data: CropMixInput) => void;
  loading?: boolean;
}> = ({ onSubmit, loading }) => {
  const [crops, setCrops] = useState([{ name: 'Wheat', area: 0 }]);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<CropMixInput>({
    defaultValues: {
      crops: crops,
      total_area: 1,
      location: '',
      season: '',
    },
  });

  const addCrop = () => {
    const newCrops = [...crops, { name: 'Rice', area: 0 }];
    setCrops(newCrops);
    setValue('crops', newCrops);
  };

  const removeCrop = (index: number) => {
    if (crops.length > 1) {
      const newCrops = crops.filter((_, i) => i !== index);
      setCrops(newCrops);
      setValue('crops', newCrops);
    }
  };

  return (
    <div className="glass-card rounded-xl shadow-lg p-6 border" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-semibold">Optimization Parameters</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
              <Sprout className="w-4 h-4" />
              Total Area (hectares)
            </label>
            <input 
              type="number" 
              step="0.01"
              {...register('total_area', { required: 'Total area is required', min: 0.01 })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition"
              style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
            />
            {errors.total_area && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.total_area.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <select 
              {...register('location', { required: 'Location is required' })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition"
              style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
            >
              <option value="">Select location</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.location && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
              <Calendar className="w-4 h-4" />
              Season
            </label>
            <select 
              {...register('season', { required: 'Season is required' })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition"
              style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
            >
              <option value="">Select season</option>
              {seasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
            {errors.season && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.season.message}</p>
            )}
          </div>
        </div>

        {/* Crop Allocation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-500" />
              Crop Allocation
            </h3>
            <button
              type="button"
              onClick={addCrop}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Crop
            </button>
          </div>

          <div className="space-y-3">
            {crops.map((crop, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
                      Crop Name
                    </label>
                    <select
                      {...register(`crops.${idx}.name` as const, { required: true })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                    >
                      {availableCrops.map(cropName => (
                        <option key={cropName} value={cropName}>{cropName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
                      Area (hectares)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`crops.${idx}.area` as const, { required: true, min: 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
                    />
                  </div>
                </div>
                {crops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCrop(idx)}
                    className="mt-6 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <PieChart className="w-5 h-5" />
              Optimize Crop Mix
            </>
          )}
        </button>
      </form>
    </div>
  );
};
