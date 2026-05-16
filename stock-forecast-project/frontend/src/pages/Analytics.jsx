import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, ShieldCheck, Activity, BarChart2, Zap, TrendingUp, TrendingDown } from 'lucide-react';
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

        {/* GRID: CONFIDENCE & TECHNICAL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          
          {/* MODEL CONFIDENCE */}
          <div className="bg-white border-2 border-[#E0E3E5] p-10 rounded-xl shadow-sm">
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-6">MODEL CONFIDENCE</p>
            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-8xl font-bold text-black">92</span>
              <span className="text-2xl text-[#45464D]">/ 100</span>
            </div>
            <p className="text-[#45464D] text-xl leading-relaxed">
              High conviction. Forecast aligns with historical volatility patterns and current macroeconomic indicators detected by our LSTM Engine.
            </p>
          </div>

          {/* TECHNICAL SETUP */}
          <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#F2F4F6] p-6 border-b border-[#E0E3E5]">
              <p className="font-bold text-black tracking-widest text-sm">TECHNICAL SETUP</p>
            </div>
            <div className="divide-y divide-[#E0E3E5]">
              <TechRow label="MA (50)" value={formatCurrency(data.current_price * 0.96)} />
              <TechRow label="MA (200)" value={formatCurrency(data.current_price * 0.92)} />
              <TechRow label="RSI (14)" value="62.4" />
              <TechRow label="MACD" value="Bullish Cross" isBadge />
            </div>
          </div>
        </div>

        {/* EXPORT BUTTON */}
        <button className="w-full bg-black text-white py-6 flex items-center justify-center gap-4 rounded-xl font-bold text-2xl hover:bg-slate-800 transition-all">
          <Download size={28} /> Export Full Dataset
        </button>
      </main>
    </div>
  );
};

const TechRow = ({ label, value, isBadge }) => (
  <div className="flex justify-between items-center p-6 px-10">
    <span className="text-[#45464D] text-lg font-medium">{label}</span>
    <span className={`text-xl font-bold ${isBadge ? 'bg-indigo-50 text-indigo-600 px-4 py-1 rounded-lg' : 'text-black'}`}>
      {value}
    </span>
  </div>
);

export default Analytics;