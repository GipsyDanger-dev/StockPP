import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, BarChart2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useForecast } from '../hooks/useApi';
import PriceChart from '../components/PriceChart';
import { formatCurrency, formatPercent } from '../utils/formatting';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Analytics = () => {
  const { ticker } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useForecast(ticker || 'AAPL', 7, '1y');
  const [liveQuote, setLiveQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Fetch live quote from Finnhub
  const fetchLiveQuote = async () => {
    if (!ticker) return;
    setQuoteLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/quote/${ticker.toUpperCase()}`);
      setLiveQuote(res.data);
    } catch (err) {
      console.warn('Failed to fetch live quote');
    }
    setQuoteLoading(false);
  };

  useEffect(() => {
    fetchLiveQuote();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveQuote, 30000);
    return () => clearInterval(interval);
  }, [ticker]);

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-indigo-600">ANALYZING MARKET DATA...</div>;

  // Use live price if available, otherwise fallback to forecast data
  const currentPrice = liveQuote?.price || data.current_price;
  const changePercent = liveQuote?.change_percent || data.change_percent;
  const isPositive = changePercent >= 0;

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
        <button onClick={fetchLiveQuote} className="ml-auto p-3 hover:bg-slate-200 rounded-full transition-colors" title="Refresh live price">
          <RefreshCw size={24} className={quoteLoading ? 'animate-spin' : ''} />
        </button>
      </header>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* TICKER INFO */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6">
          <div>
            <h2 className="text-6xl lg:text-8xl font-bold text-black mb-2">{data.ticker}</h2>
            <p className="text-[#45464D] text-xl lg:text-2xl">Asset Class: Equity &bull; Currency: USD</p>
            {liveQuote && (
              <p className="text-sm text-emerald-600 font-medium mt-2">
                Live from Finnhub
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-5xl lg:text-7xl font-bold text-black">{formatCurrency(currentPrice)}</p>
            <div className={`flex items-center justify-end gap-2 text-2xl mt-2 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
               {isPositive ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
               <span className="font-bold">{formatPercent(changePercent)}</span>
            </div>
          </div>
        </div>

        {/* LIVE MARKET DATA */}
        {liveQuote && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            <LiveCard label="Open" value={formatCurrency(liveQuote.open)} />
            <LiveCard label="High" value={formatCurrency(liveQuote.high)} />
            <LiveCard label="Low" value={formatCurrency(liveQuote.low)} />
            <LiveCard label="Prev Close" value={formatCurrency(liveQuote.prev_close)} />
            <LiveCard label="Change" value={`${liveQuote.change >= 0 ? '+' : ''}${liveQuote.change?.toFixed(2)}`} positive={liveQuote.change >= 0} />
          </div>
        )}

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
                <span className="text-xl font-bold text-black">{formatCurrency(currentPrice)}</span>
              </div>
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">Trend</span>
                <span className={`text-xl font-bold ${data.trend === 'Bullish' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {data.trend}
                </span>
              </div>
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">Change %</span>
                <span className={`text-xl font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatPercent(changePercent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const LiveCard = ({ label, value, positive }) => (
  <div className="bg-[#F7F9FB] border-2 border-[#E0E3E5] rounded-xl p-4 text-center">
    <p className="text-[#45464D] text-sm font-medium mb-1">{label}</p>
    <p className={`text-lg font-bold ${positive === true ? 'text-emerald-600' : positive === false ? 'text-rose-600' : 'text-black'}`}>{value}</p>
  </div>
);

export default Analytics;
