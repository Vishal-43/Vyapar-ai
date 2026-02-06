import React from 'react';
import { useForm } from 'react-hook-form';
import { CloudRain, MapPin, Sprout, Calendar } from 'lucide-react';

export type WeatherRiskInput = {
  commodity: string;
  sowing_date: string;
  location: string;
};

export const WeatherRiskForm: React.FC<{ 
  onSubmit: (data: WeatherRiskInput) => void;
  loading?: boolean;
}> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<WeatherRiskInput>({
    defaultValues: {
      commodity: '',
      sowing_date: '',
      location: '',
    },
  });
  
  const cities = [
    'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];
  
  const commodities = [
    'Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Potato',
    'Tomato', 'Onion', 'Soybean', 'Groundnut', 'Mustard', 'Chickpea'
  ];
  
  return (
    <div className="glass-card rounded-xl shadow-lg p-6 border" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center gap-2 mb-6">
        <CloudRain className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-main)" }}>Assessment Form</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
            <Sprout className="w-4 h-4" />
            Commodity
          </label>
          <select 
            {...register('commodity', { required: 'Commodity is required' })}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
            style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
          >
            <option value="">Select a commodity</option>
            {commodities.map(commodity => (
              <option key={commodity} value={commodity}>{commodity}</option>
            ))}
          </select>
          {errors.commodity && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.commodity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
            <Calendar className="w-4 h-4" />
            Sowing Date
          </label>
          <input 
            type="date" 
            {...register('sowing_date', { required: 'Sowing date is required' })}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
            style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
          />
          {errors.sowing_date && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.sowing_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-soft)" }}>
            <MapPin className="w-4 h-4" />
            Location
          </label>
          <select 
            {...register('location', { required: 'Location is required' })}
            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition"
            style={{ borderColor: "var(--border)", background: "var(--panel)", color: "var(--text-main)" }}
          >
            <option value="">Select a city</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.location && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Assessing...
            </>
          ) : (
            <>
              <CloudRain className="w-5 h-5" />
              Assess Weather Risk
            </>
          )}
        </button>
      </form>
    </div>
  );
};
