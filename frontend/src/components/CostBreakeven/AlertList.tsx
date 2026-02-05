import React from 'react';

export const AlertList: React.FC<{ alerts: string[] }> = ({ alerts }) => (
  <div>
    <h4>Alerts</h4>
    <ul>
      {alerts.map((alert, idx) => (
        <li key={idx} style={{ color: alert.includes('Critical') ? 'red' : 'orange' }}>{alert}</li>
      ))}
    </ul>
  </div>
);
