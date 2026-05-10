import React from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

/**
 * KPI Card Component - Display key performance indicators
 */
export const KPICard = ({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`card ${colorClasses[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-semibold">
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Metric Badge Component
 */
export const MetricBadge = ({ label, value, unit = '' }) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm">
      <span className="text-slate-600">{label}:</span>
      <span className="font-semibold text-slate-900">{value}{unit}</span>
    </div>
  );
};

/**
 * Status Badge Component
 */
export const StatusBadge = ({ status, message }) => {
  const statusClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status]}`}>
      {message}
    </div>
  );
};

/**
 * Loading Skeleton Component
 */
export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`bg-slate-200 rounded-lg animate-pulse ${className}`}></div>
  );
};

/**
 * Error Alert Component
 */
export const ErrorAlert = ({ message, onDismiss }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex justify-between items-center">
      <p className="text-red-800">{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Success Alert Component
 */
export const SuccessAlert = ({ message, onDismiss }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex justify-between items-center">
      <p className="text-green-800">{message}</p>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 font-medium text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
};
