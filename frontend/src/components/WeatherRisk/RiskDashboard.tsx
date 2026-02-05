import React from 'react';

export type WeatherAlert = {
  alert_type: string;
  severity: string;
  description: string;
};

export type ProtectiveMeasure = {
  measure: string;
  cost?: number;
  effectiveness?: string;
};

export type WeatherRiskReport = {
  risk_level: string;
  alerts: WeatherAlert[];
  insurance?: string;
  protective_measures?: ProtectiveMeasure[];
};

export const RiskDashboard: React.FC<{ report: WeatherRiskReport }> = ({ report }) => (
  <div>
    <h3>Risk Level: {report.risk_level}</h3>
    {report.insurance && <p><b>Insurance:</b> {report.insurance}</p>}
    <h4>Alerts</h4>
    <ul>
      {report.alerts.map((a, idx) => (
        <li key={idx} style={{ color: a.severity === 'CRITICAL' ? 'red' : a.severity === 'HIGH' ? 'orange' : 'black' }}>
          <b>{a.alert_type}</b>: {a.description} ({a.severity})
        </li>
      ))}
    </ul>
    {report.protective_measures && (
      <>
        <h4>Protective Measures</h4>
        <ul>
          {report.protective_measures.map((m, idx) => (
            <li key={idx}>{m.measure} {m.cost && `(₹${m.cost})`} {m.effectiveness && `- Effectiveness: ${m.effectiveness}`}</li>
          ))}
        </ul>
      </>
    )}
  </div>
);
