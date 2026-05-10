import React, { useState } from 'react';
import { useForecast, useMetrics } from '../hooks/useApi';
import { PriceChart } from '../components/PriceChart';
import { KPICard, ErrorAlert, Skeleton } from '../components/Common';
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Dashboard Page - Main analysis view
 */
export const Dashboard = ({ ticker, period, daysAhead, apiStatus }) => {
  const [dismissError, setDismissError] = useState(false);

  // Fetch forecast data
  const { 
    data: forecastData, 
    isLoading: forecastLoading, 
    error: forecastError 
  } = useForecast(ticker, daysAhead, period);

  // Fetch metrics
  const { 
    data: metricsData, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = useMetrics(ticker);

  // Prepare chart data from forecast
  const chartHistoricalData = forecastData?.historical?.map(item => ({
    date: item.date,
    historical_price: parseFloat(item.price),
  })) || [];

  const chartForecastData = forecastData?.forecast?.map(item => ({
    date: item.date,
    predicted_price: parseFloat(item.price),
  })) || [];

  const combinedChartData = [
    ...chartHistoricalData,
    ...chartForecastData,
  ];

  // Extract metrics
  const metrics = metricsData?.metrics || {};
  
  // Calculate trend
  const lastHistorical = chartHistoricalData[chartHistoricalData.length - 1]?.historical_price;
  const firstForecast = chartForecastData[0]?.predicted_price;
  const trendDirection = lastHistorical && firstForecast && firstForecast > lastHistorical ? 'up' : 'down';
  const trendPercentage = lastHistorical && firstForecast 
    ? Math.abs(((firstForecast - lastHistorical) / lastHistorical) * 100).toFixed(2)
    : '0.00';

  // Error handling
  const hasError = forecastError || metricsError;
  
  if (apiStatus === 'offline') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorAlert 
          message="API is offline. Unable to fetch data. Please check if the backend server is running." 
          onDismiss={() => setDismissError(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Ticker Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">{ticker}</h2>
        <p className="text-slate-600">Period: {period} | Forecast Days: {daysAhead}</p>
      </div>

      {/* Error Alert */}
      {hasError && !dismissError && (
        <ErrorAlert 
          message={forecastError?.message || metricsError?.message || "Error fetching data"}
          onDismiss={() => setDismissError(true)}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Latest Price */}
        <div>
          {forecastLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <KPICard
              title="Latest Price"
              value={lastHistorical ? `$${lastHistorical.toFixed(2)}` : 'N/A'}
              icon={DollarSign}
              color="blue"
              trend={{
                direction: trendDirection,
                value: `${trendPercentage}%`
              }}
            />
          )}
        </div>

        {/* RMSE */}
        <div>
          {metricsLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <KPICard
              title="RMSE Score"
              value={metrics.rmse ? metrics.rmse.toFixed(4) : 'N/A'}
              icon={BarChart3}
              color="green"
            />
          )}
        </div>

        {/* MAE */}
        <div>
          {metricsLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <KPICard
              title="MAE Score"
              value={metrics.mae ? metrics.mae.toFixed(4) : 'N/A'}
              icon={BarChart3}
              color="purple"
            />
          )}
        </div>

        {/* Forecast */}
        <div>
          {forecastLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <KPICard
              title="Next Forecast"
              value={firstForecast ? `$${firstForecast.toFixed(2)}` : 'N/A'}
              icon={TrendingUp}
              color={trendDirection === 'up' ? 'green' : 'red'}
            />
          )}
        </div>
      </div>

      {/* Main Chart */}
      <div className="mb-8">
        {forecastLoading ? (
          <Skeleton className="w-full h-96" />
        ) : (
          <PriceChart
            historicalData={chartHistoricalData}
            forecastData={chartForecastData}
            loading={forecastLoading}
          />
        )}
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Trend Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Trend Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-600">Direction</span>
              <div className="flex items-center gap-2">
                {trendDirection === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-semibold ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trendDirection === 'up' ? 'Bullish' : 'Bearish'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-slate-600">Change %</span>
              <span className={`font-semibold ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendPercentage}%
              </span>
            </div>
            <div className="text-sm text-slate-500">
              <p>Based on latest price vs. first forecast</p>
            </div>
          </div>
        </div>

        {/* Model Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Model Performance</h3>
          {metricsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-600">RMSE</span>
                <span className="font-semibold">{metrics.rmse?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-slate-600">MAE</span>
                <span className="font-semibold">{metrics.mae?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="text-xs text-slate-500">
                <p>Lower values indicate better prediction accuracy</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary">
              📥 Export as CSV
            </button>
            <button className="w-full btn-secondary">
              📊 Export as PDF
            </button>
            <button className="w-full btn-secondary">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Forecast Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Historical Price</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Forecast Price</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Change %</th>
              </tr>
            </thead>
            <tbody>
              {combinedChartData.slice(-10).map((row, idx) => {
                const change = row.predicted_price && row.historical_price 
                  ? ((row.predicted_price - row.historical_price) / row.historical_price * 100).toFixed(2)
                  : null;
                
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">{row.date}</td>
                    <td className="text-right py-3 px-4">
                      {row.historical_price ? `$${row.historical_price.toFixed(2)}` : '-'}
                    </td>
                    <td className="text-right py-3 px-4">
                      {row.predicted_price ? `$${row.predicted_price.toFixed(2)}` : '-'}
                    </td>
                    <td className={`text-right py-3 px-4 font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {change ? `${change > 0 ? '+' : ''}${change}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
