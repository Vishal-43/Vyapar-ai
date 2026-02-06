import React, { useState } from 'react';
import Navbar from '../components/dashboard/Navbar/Navbar';
import DashFooter from '../components/dashboard/Home/dashFooter';
import { WeatherRiskForm, WeatherRiskInput } from '../components/WeatherRisk/WeatherRiskForm';
import { RiskDashboard, WeatherRiskReport } from '../components/WeatherRisk/RiskDashboard';

const WeatherRisk: React.FC = () => {
  const [report, setReport] = useState<WeatherRiskReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: WeatherRiskInput) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch('/api/v1/weather-risk/assess-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to assess weather risk');
      const resData = await response.json();
      setReport(resData);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto px-4 pt-20 pb-12 space-y-8 max-w-6xl">
        <header>
          <h1 className="text-3xl font-semibold">
            Weather Risk Assessment
          </h1>
          <p className="text-soft">
            Assess weather-related risks for your crops and get protective recommendations
          </p>
        </header>

        <WeatherRiskForm onSubmit={handleSubmit} loading={loading} />
        
        {error && (
          <div className="glass-card p-4 rounded-none border-l-4 border-red-500">
            <p className="text-red-600 dark:text-red-400 font-medium">Error: {error}</p>
          </div>
        )}
        
        {report && <RiskDashboard report={report} />}
      </main>

      <DashFooter />
    </>
  );
};

export default WeatherRisk;
