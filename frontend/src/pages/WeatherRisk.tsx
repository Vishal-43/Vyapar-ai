import React, { useState } from 'react';
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
      const response = await fetch('/api/weather-risk/assess-risk', {
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2>Weather Risk Assessment</h2>
      <WeatherRiskForm onSubmit={handleSubmit} />
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {report && <RiskDashboard report={report} />}
    </div>
  );
};

export default WeatherRisk;
