import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Activity,
} from "lucide-react";
import { useForecastTracked } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import PriceChart from "../components/PriceChart";
import { formatCurrency, formatPercent } from "../utils/formatting";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [ticker, setTicker] = useState("NVDA");
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, error } = useForecastTracked(ticker, 7, "1y", user?.id);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput) setTicker(searchInput.toUpperCase());
  };

  if (data?.status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Activity size={48} className="text-[#C6C6CD] mx-auto mb-4" />
          <p className="text-lg font-bold text-[#191C1E]">Unable to load forecast</p>
          <p className="text-sm text-[#45464D] mt-2">{data.message}</p>
          <form onSubmit={handleSearch} className="mt-6">
            <input
              type="text"
              placeholder="Try another ticker..."
              className="bg-white border border-[#C6C6CD] rounded-lg py-2 px-4 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-white font-bold text-[#45464D]">
        LOADING AI ENGINE...
      </div>
    );

  const rmseValue = data.metrics?.rmse || 0;
  const accuracyPercent = Math.max(0, Math.min(100, 100 - rmseValue * 100));

  return (
    <div className="text-[#191C1E]">
      {/* HEADER */}
      <header className="bg-[#F7F9FB] px-6 py-4 flex justify-between items-center border-b border-[#C6C6CD]">
        <form onSubmit={handleSearch} className="flex relative w-96">
          <input
            type="text"
            placeholder="Search assets..."
            className="w-full bg-white border border-[#C6C6CD] rounded-full py-2 px-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="absolute left-3 top-2.5 text-slate-400 hover:text-indigo-600 transition-colors">
            <Search size={18} />
          </button>
        </form>
      </header>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
        {/* HERO SECTION */}
        <div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-4 tracking-tight">
            Market Insights
          </h1>
          <p className="text-[#45464D] text-xl lg:text-2xl max-w-2xl">
            AI-driven predictive analytics for active portfolios.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CHART AREA */}
          <div className="lg:col-span-2 bg-white border-2 border-[#C6C6CD] rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[#45464D] font-bold text-sm tracking-widest uppercase">
                  Current Price
                </p>
                <h2 className="text-4xl font-bold mt-1">
                  {formatCurrency(data.current_price)}
                </h2>
              </div>
              <div className={`flex items-center gap-2 border-2 px-4 py-2 rounded-lg font-bold text-xl ${
                data.change_percent >= 0
                  ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}>
                {data.change_percent >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                {formatPercent(data.change_percent)}
              </div>
            </div>
            <div className="h-[400px]">
              <PriceChart
                historical={data.historical}
                forecast={data.forecast}
                indicators={data.historical_indicators}
              />
            </div>
          </div>

          {/* AI PREDICTION CARD */}
          <div className="space-y-8">
            <div className="bg-[#0D1C2F] text-white rounded-xl p-8 flex flex-col justify-between h-full shadow-xl">
              <div>
                <p className="text-[#76859B] font-bold text-sm tracking-widest mb-6">
                  TOP AI PREDICTION
                </p>
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-white text-black px-4 py-2 rounded font-bold text-2xl">
                    {data.ticker}
                  </div>
                  <div>
                    <p className="text-xl font-bold">{data.ticker}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[#76859B] text-sm mb-2">
                      RMSE (Model Accuracy)
                    </p>
                    <div className="w-full bg-[#3A485C] h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all"
                        style={{ width: `${accuracyPercent}%` }}
                      />
                    </div>
                    <p className="text-right mt-2 font-bold">{data.metrics?.rmse?.toFixed(4) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#76859B] text-sm mb-1">
                      Trend
                    </p>
                    <p className={`text-2xl font-bold ${data.trend === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>{data.trend || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/analytics/${data.ticker}`)}
                className="w-full bg-white text-black py-4 rounded-lg font-bold mt-8 hover:bg-slate-200 transition-colors"
              >
                View Analysis
              </button>
            </div>
          </div>
        </div>

        {/* 7-DAY FORECAST TABLE */}
        <div className="bg-white border-2 border-[#C6C6CD] rounded-xl overflow-hidden shadow-sm">
          <div className="bg-[#F2F4F6] p-6 border-b border-[#C6C6CD] flex justify-between items-center">
            <h3 className="font-bold tracking-widest text-[#45464D]">
              7-DAY FORECAST
            </h3>
            <Activity size={20} className="text-[#45464D]" />
          </div>
          {data.forecast && data.forecast.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#C6C6CD]">
                    <th className="text-left p-4 text-[#45464D] font-bold text-sm tracking-widest">DATE</th>
                    <th className="text-right p-4 text-[#45464D] font-bold text-sm tracking-widest">PREDICTED PRICE</th>
                    <th className="text-right p-4 text-[#45464D] font-bold text-sm tracking-widest">CHANGE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map((point, i) => {
                    const prevPrice = i === 0 ? data.current_price : data.forecast[i - 1].price;
                    const change = ((point.price - prevPrice) / prevPrice) * 100;
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="p-4 font-medium">{point.date}</td>
                        <td className="p-4 text-right font-bold">{formatCurrency(point.price)}</td>
                        <td className={`p-4 text-right font-bold ${change >= 0 ? 'text-[#16A34A]' : 'text-rose-500'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-[#45464D]">
              <Activity size={40} className="mb-4 text-slate-300" />
              <p className="text-lg font-medium">No forecast data available</p>
              <p className="text-sm text-slate-400 mt-2">Search for a ticker to generate predictions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
