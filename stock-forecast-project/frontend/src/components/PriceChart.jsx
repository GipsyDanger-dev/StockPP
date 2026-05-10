import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area, AreaChart
} from 'recharts';
import { Skeleton } from './Common';

/**
 * Price Chart Component - Display historical and forecasted prices
 */
export const PriceChart = ({ historicalData, forecastData, loading = false }) => {
  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  // Combine historical and forecast data
  const combinedData = [
    ...(historicalData || []),
    ...(forecastData || [])
  ];

  if (!combinedData || combinedData.length === 0) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Price Trend & Forecast</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value) => `$${value.toFixed(2)}`}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="historical_price"
            stroke="#3b82f6"
            dot={false}
            strokeWidth={2}
            name="Historical Price"
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="predicted_price"
            stroke="#8b5cf6"
            dot={true}
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Forecast"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-slate-500">
        <p>💡 Blue line: Historical prices | Purple dashed line: Forecasted prices</p>
      </div>
    </div>
  );
};

/**
 * Area Chart Component - Alternative visualization
 */
export const PriceAreaChart = ({ data, loading = false }) => {
  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Price Movement</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            formatter={(value) => `$${value.toFixed(2)}`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Mini Chart Component - For dashboard cards
 */
export const MiniChart = ({ data, color = '#3b82f6' }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          dot={false}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
