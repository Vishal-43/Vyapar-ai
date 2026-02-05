import React from 'react';
import { AlertTriangle, CheckCircle, Shield, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

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
      return 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
    case 'HIGH':
      return 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800';
    case 'MEDIUM':
      return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
    default:
      return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
  }
};

export const RiskDashboard: React.FC<{ report: WeatherRiskReport }> = ({ report }) => (
  <div className="space-y-6">
    {/* Risk Level Card */}
    <div className={`${getRiskColor(report.risk_level)} rounded-xl p-6 text-white shadow-lg`}>
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

    {/* Insurance Recommendation */}
    {report.insurance && (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Insurance Recommendation</h3>
            <p className="text-gray-700 dark:text-gray-300">{report.insurance}</p>
          </div>
        </div>
      </div>
    )}

    {/* Alerts */}
    {report.alerts && report.alerts.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Weather Alerts
        </h3>
        <div className="space-y-3">
          {report.alerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`border rounded-lg p-4 ${getSeverityStyles(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{alert.alert_type}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      alert.severity === 'HIGH' ? 'bg-orange-600 text-white' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{alert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Protective Measures */}
    {report.protective_measures && report.protective_measures.length > 0 && (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Recommended Protective Measures
        </h3>
        <div className="space-y-3">
          {report.protective_measures.map((measure, idx) => (
            <div 
              key={idx} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{measure.measure}</p>
                  {measure.effectiveness && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Effectiveness: {measure.effectiveness}
                    </p>
                  )}
                </div>
                {measure.cost && (
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      ₹{measure.cost.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* No Alerts Message */}
    {(!report.alerts || report.alerts.length === 0) && (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
          No Weather Alerts
        </h3>
        <p className="text-green-700 dark:text-green-300">
          Weather conditions are favorable for your crop.
        </p>
      </div>
    )}
  </div>
);
