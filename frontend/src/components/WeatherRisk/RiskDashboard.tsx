import React from 'react';
import { AlertTriangle, CheckCircle, Shield, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import CardComponent from '../ui/CardComponent';

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

const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-500';
    case 'HIGH':
      return 'bg-orange-500';
    case 'MEDIUM':
      return 'bg-yellow-500';
    case 'LOW':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'CRITICAL':
      return <XCircle className="w-8 h-8" />;
    case 'HIGH':
      return <AlertTriangle className="w-8 h-8" />;
    case 'MEDIUM':
      return <AlertCircle className="w-8 h-8" />;
    case 'LOW':
      return <CheckCircle className="w-8 h-8" />;
    default:
      return <Shield className="w-8 h-8" />;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return 'border-red-500 bg-red-500/10';
    case 'HIGH':
      return 'border-orange-500 bg-orange-500/10';
    case 'MEDIUM':
      return 'border-yellow-500 bg-yellow-500/10';
    default:
      return 'border-blue-500 bg-blue-500/10';
  }
};

export const RiskDashboard: React.FC<{ report: WeatherRiskReport }> = ({ report }) => (
  <div className="space-y-6">
    {/* Risk Level Card */}
    <CardComponent>
      <div className={`${getRiskColor(report.risk_level)} rounded-none p-6 text-white`}>
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            {getRiskIcon(report.risk_level)}
          </div>
          <div>
            <p className="text-sm font-medium opacity-90">Overall Risk Level</p>
            <h2 className="text-3xl font-bold">{report.risk_level}</h2>
          </div>
        </div>
      </div>
    </CardComponent>

    {/* Insurance Recommendation */}
    {report.insurance && (
      <CardComponent title="Insurance Recommendation" icon={<Shield className="w-5 h-5" />}>
        <p className="text-soft">{report.insurance}</p>
      </CardComponent>
    )}

    {/* Alerts */}
    {report.alerts && report.alerts.length > 0 && (
      <CardComponent title="Weather Alerts" icon={<AlertTriangle className="w-5 h-5" />}>
        <div className="space-y-3">
          {report.alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`border-l-4 glass-card p-4 ${getSeverityStyles(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-main">{alert.alert_type}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      alert.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-soft">{alert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardComponent>
    )}

    {/* Protective Measures */}
    {report.protective_measures && report.protective_measures.length > 0 && (
      <CardComponent title="Recommended Protective Measures" icon={<TrendingUp className="w-5 h-5" />}>
        <div className="space-y-3">
          {report.protective_measures.map((measure, idx) => (
            <div 
              key={idx} 
              className="glass-card p-4 hover:bg-[rgb(var(--emerald-main))]/5 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-main">{measure.measure}</p>
                  {measure.effectiveness && (
                    <p className="text-sm text-[rgb(var(--emerald-main))] mt-1">
                      Effectiveness: {measure.effectiveness}
                    </p>
                  )}
                </div>
                {measure.cost && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[rgb(var(--emerald-main))]">
                      ₹{measure.cost.toLocaleString()}
                    </p>
                    <p className="text-xs text-soft">Estimated Cost</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardComponent>
    )}

    {/* No Alerts Message */}
    {(!report.alerts || report.alerts.length === 0) && (
      <CardComponent>
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-[rgb(var(--emerald-main))] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-main mb-1">
            No Weather Alerts
          </h3>
          <p className="text-soft">
            Weather conditions are favorable for your crop.
          </p>
        </div>
      </CardComponent>
    )}
  </div>
);
