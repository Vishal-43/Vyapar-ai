import React, { useState } from 'react';
import Navbar from '../components/dashboard/Navbar/Navbar';
import DashFooter from '../components/dashboard/Home/dashFooter';
import GraphBackgroundCorner from '../components/Background/GraphBackgroundCorner';
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute -top-40 -left-40 h-105 w-105 rounded-full bg-blue-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-105 w-105 rounded-full bg-cyan-400/10 blur-[120px]" />

      <Navbar />
      <GraphBackgroundCorner />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Weather Risk Assessment</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Assess weather-related risks for your crops and get protective recommendations.
          </p>
        </header>

        <div className="space-y-6">
          <WeatherRiskForm onSubmit={handleSubmit} loading={loading} />
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 font-medium">Error: {error}</p>
            </div>
          )}
          
          {report && <RiskDashboard report={report} />}
        </div>
      </main>

      <DashFooter />
    </div>
  );
};

export default WeatherRisk;
