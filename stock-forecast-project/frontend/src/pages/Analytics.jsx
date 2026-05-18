import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, BarChart2, TrendingUp } from 'lucide-react';
import { useForecast } from '../hooks/useApi';
import PriceChart from '../components/PriceChart';
import { formatCurrency, formatPercent } from '../utils/formatting';


const Analytics = () => {
  const { ticker } = useParams(); // Mengambil ticker dari URL (misal: /analytics/AAPL)
  const navigate = useNavigate();
  const { data, isLoading } = useForecast(ticker || 'AAPL', 7, '1y');

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600">ANALYZING MARKET DATA...</div>;

  return (
    <div className="min-h-screen bg-white text-[#191C1E]">
      {/* HEADER */}
      <header className="bg-[#F7F9FB] px-6 lg:px-12 py-8 flex items-center border-b border-[#E0E3E5]">
        <button onClick={() => navigate(-1)} className="mr-6 p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ChevronLeft size={32} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={28} />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-black">PRECISION ANALYTICS</h1>
        </div>
      </header>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* TICKER INFO */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
          <div>
            <h2 className="text-6xl lg:text-8xl font-bold text-black mb-2">{data.ticker}</h2>
            <p className="text-[#45464D] text-xl lg:text-2xl">Asset Class: Equity • Currency: USD</p>
          </div>
          <div className="text-right">
            <p className="text-5xl lg:text-7xl font-bold text-black">{formatCurrency(data.current_price)}</p>
            <div className="flex items-center justify-end gap-2 text-[#45464D] text-2xl mt-2">
               <TrendingUp className="text-emerald-500" size={28} />
               <span>{formatPercent(data.change_percent)}</span>
            </div>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden mb-12 shadow-sm">
          <div className="bg-[#F2F4F6] p-6 flex justify-between items-center border-b border-[#E0E3E5]">
            <div className="flex gap-8">
              <span className="font-bold text-black text-lg border-b-4 border-indigo-600 pb-1">Actual vs Forecast</span>
              <span className="text-[#45464D] text-lg">Historical Patterns</span>
            </div>
            <BarChart2 size={24} className="text-[#45464D]" />
          </div>
          <div className="p-6 h-[500px]">
             <PriceChart historical={data.historical} forecast={data.forecast} />
          </div>
        </div>

        {/* MODEL METRICS & INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          
          {/* MODEL METRICS */}
          <div className="bg-white border-2 border-[#E0E3E5] p-10 rounded-xl shadow-sm">
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-6">MODEL METRICS</p>
            <div className="space-y-6">
              <div>
                <p className="text-[#45464D] text-sm font-medium mb-1">RMSE (Root Mean Square Error)</p>
                <p className="text-4xl font-bold text-black">{data.metrics?.rmse?.toFixed(4) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[#45464D] text-sm font-medium mb-1">MAE (Mean Absolute Error)</p>
                <p className="text-4xl font-bold text-black">{data.metrics?.mae?.toFixed(4) || 'N/A'}</p>
              </div>
              <div className="pt-4 border-t border-[#E0E3E5]">
                <p className="text-[#45464D] text-sm font-medium mb-1">Model Source</p>
                <span className={`inline-block px-4 py-1 rounded-lg font-bold text-sm ${
                  data.model_source === 'persisted' 
                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200'
                    : 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200'
                }`}>
                  {data.model_source === 'persisted' ? 'Trained Model' : 'Mock Data'}
                </span>
              </div>
            </div>
          </div>

          {/* FORECAST SUMMARY */}
          <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F2F4F6] p-6 border-b border-[#E0E3E5]">
              <p className="font-bold text-black tracking-widest text-sm">FORECAST SUMMARY</p>
            </div>
            <div className="divide-y divide-[#E0E3E5]">
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">Current Price</span>
                <span className="text-xl font-bold text-black">{formatCurrency(data.current_price)}</span>
              </div>
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">Trend</span>
                <span className={`text-xl font-bold ${data.trend === 'Bullish' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.trend}
                </span>
              </div>
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">Change %</span>
                <span className={`text-xl font-bold ${data.change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPercent(data.change_percent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;
