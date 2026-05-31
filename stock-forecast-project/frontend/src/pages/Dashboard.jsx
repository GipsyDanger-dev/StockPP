import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp, TrendingDown, Search, Activity, Zap, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useForecastTracked } from "../hooks/useApi";
import { useProgressStream } from "../hooks/useProgressStream";
import PriceChart from "../components/PriceChart";
import ProgressOverlay from "../components/ProgressOverlay";
import { formatCurrency, formatPercent } from "../utils/formatting";
import { useNavigate } from "react-router-dom";

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{prefix}{typeof value === 'number' && value % 1 !== 0 ? display.toFixed(2) : Math.round(display)}{suffix}</>;
}

function PulseDot({ color = "bg-emerald-400" }) {
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--dark-bg)] border border-[var(--dark-border)] rounded-2xl p-8 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-6" />
      <div className="h-10 bg-slate-100 rounded w-1/2 mb-4" />
      <div className="h-[300px] bg-[var(--dark-surface)] rounded-xl" />
    </div>
  );
}

const Dashboard = () => {
  const [ticker, setTicker] = useState("NVDA");
  const [searchInput, setSearchInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, error } = useForecastTracked(ticker, 7, "1y");
  const stream = useProgressStream('/forecast/stream', { ticker, days_ahead: 7, period: '1y' });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isLoading && !data) {
      stream.start();
    }
    return () => stream.stop();
  }, [ticker]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput) setTicker(searchInput.toUpperCase());
  };

  if (error || data?.status === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[var(--dark-bg)]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-[var(--dark-surface)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--dark-border)]">
            <Activity size={28} className="text-[var(--gray-dark)]" />
          </div>
          <p className="text-lg font-bold text-white mb-2">Market API is currently down or undergoing maintenance.</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Try another ticker..."
              className="flex-1 bg-[var(--dark-border)] border border-[var(--dark-border)] rounded-xl py-2.5 px-4 text-sm text-white placeholder-[var(--gray-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:border-transparent"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" className="bg-[var(--orange)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--orange-hover)] transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <PulseDot />
          <span className="text-sm font-medium text-[var(--gray-mid)]">AI Engine initializing...</span>
        </div>
        {stream.steps.length > 0 ? (
          <ProgressOverlay
            steps={stream.steps}
            epochs={stream.epochs}
            status={stream.status}
            error={stream.error}
            onRetry={() => stream.start()}
            onCancel={() => stream.stop()}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><SkeletonCard /></div>
            <div><SkeletonCard /></div>
          </div>
        )}
      </div>
    );
  }

  const rmseValue = data.metrics?.rmse || 0;
  const currentPrice = data.current_price || 1;
  const accuracyPercent = Math.max(0, Math.min(100, 100 - (rmseValue / currentPrice) * 100));

  const forecastChange = data.forecast?.length > 0
    ? ((data.forecast[data.forecast.length - 1].price - data.current_price) / data.current_price) * 100
    : 0;

  return (
    <div className="text-white">
      <header className="bg-[var(--dark-surface)]/80 backdrop-blur-md sticky top-0 z-10 px-6 py-3 flex justify-between items-center border-b border-[var(--dark-border)]">
        <form onSubmit={handleSearch} className="flex relative w-80">
          <input
            type="text"
            placeholder="Search ticker..."
            className="w-full bg-[var(--dark-border)] border border-[var(--dark-border)] rounded-xl py-2.5 px-10 text-sm text-white placeholder-[var(--gray-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:border-transparent transition-all"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--gray-dark)]" />
        </form>
        <div className="flex items-center gap-2 text-sm text-[var(--gray-mid)]">
          <PulseDot color="bg-emerald-400" />
          <span className="font-medium">Live</span>
        </div>
      </header>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-[var(--orange)]/10 rounded-lg flex items-center justify-center border border-[var(--orange)]/20">
              <Zap size={16} className="text-[var(--orange)]" />
            </div>
            <span className="text-xs font-bold text-[var(--orange)] tracking-wider uppercase">AI Forecast Engine</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2 text-white">
            {ticker} Forecast
          </h1>
          <p className="text-[var(--gray-mid)] text-lg">
            7-day prediction powered by LSTM neural networks
          </p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="lg:col-span-2 bg-[var(--dark-bg)] border border-[var(--dark-border)] rounded-2xl p-6 lg:p-8 hover:border-[var(--dark-hover)] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[var(--gray-mid)] font-semibold text-xs tracking-wider uppercase mb-1">
                  Current Price
                </p>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {formatCurrency(data.current_price)}
                </h2>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                data.change_percent >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {data.change_percent >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {formatPercent(data.change_percent)}
              </div>
            </div>
            <div className="h-[350px]">
              <PriceChart
                historical={data.historical}
                forecast={data.forecast}
                indicators={data.historical_indicators}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[var(--dark-card)] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <PulseDot color="bg-indigo-400" />
                  <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase">AI Prediction</span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[var(--dark-bg)]/10 backdrop-blur px-3 py-1.5 rounded-lg font-bold text-lg border border-white/10">
                    {data.ticker}
                  </div>
                  <div className={`text-sm font-bold px-2 py-1 rounded ${forecastChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {forecastChange >= 0 ? '+' : ''}{forecastChange.toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-[var(--gray-blue)] font-medium">Model Accuracy</span>
                      <span className="text-white font-bold">{accuracyPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[var(--orange)] to-[var(--orange-hover)] h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${accuracyPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--gray-blue)] mt-1.5">RMSE: {data.metrics?.rmse?.toFixed(4) || 'N/A'}</p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[11px] text-[var(--gray-blue)] mb-0.5">Trend</p>
                      <p className={`text-lg font-bold ${data.trend === 'Bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.trend || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[var(--gray-blue)] mb-0.5">Target</p>
                      <p className="text-lg font-bold text-white">
                        {data.forecast?.length > 0 ? formatCurrency(data.forecast[data.forecast.length - 1].price) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/analytics/${data.ticker}`)}
                className="w-full bg-[var(--orange)] text-white py-3 rounded-xl font-bold text-sm mt-6 hover:bg-[var(--orange-hover)] transition-colors active:scale-[0.98]"
              >
                View Full Analysis
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'MAE', value: data.metrics?.mae?.toFixed(4) || 'N/A', sub: 'Error' },
                { label: 'MSE', value: data.metrics?.mse?.toFixed(4) || 'N/A', sub: 'Squared Error' },
                { label: 'R-Squared', value: data.metrics?.r_square?.toFixed(3) || 'N/A', sub: 'Fit' },
              ].map((stat, i) => (
                <div key={i} className="bg-[var(--dark-bg)] border border-[var(--dark-border)] rounded-xl p-4 hover:border-slate-300 transition-colors">
                  <p className="text-[11px] text-[var(--gray-mid)] font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] text-[var(--gray-mid)]">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`bg-[var(--dark-bg)] border border-[var(--dark-border)] rounded-2xl overflow-hidden transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="px-6 py-4 border-b border-[var(--dark-border)] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[var(--gray-dark)]" />
              <h3 className="font-bold text-sm tracking-wider text-[var(--gray-mid)] uppercase">7-Day Forecast</h3>
            </div>
            <span className="text-[11px] text-[var(--gray-mid)] font-medium">{ticker}</span>
          </div>
          {data.forecast && data.forecast.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--dark-border)]">
                    <th className="text-left px-6 py-3 text-[var(--gray-mid)] font-semibold text-xs tracking-wider">DATE</th>
                    <th className="text-right px-6 py-3 text-[var(--gray-mid)] font-semibold text-xs tracking-wider">PREDICTED</th>
                    <th className="text-right px-6 py-3 text-[var(--gray-mid)] font-semibold text-xs tracking-wider">CHANGE</th>
                    <th className="text-right px-6 py-3 text-[var(--gray-mid)] font-semibold text-xs tracking-wider">TREND</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map((point, i) => {
                    const prevPrice = i === 0 ? data.current_price : data.forecast[i - 1].price;
                    const change = ((point.price - prevPrice) / prevPrice) * 100;
                    const isUp = change >= 0;
                    return (
                      <tr key={i} className="border-b border-[var(--dark-border)] last:border-0 hover:bg-[var(--dark-surface)]/50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-white">{point.date}</td>
                        <td className="px-6 py-3.5 text-right text-sm font-bold text-white">{formatCurrency(point.price)}</td>
                        <td className={`px-6 py-3.5 text-right text-sm font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isUp ? '+' : ''}{change.toFixed(2)}%
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {isUp ? (
                            <ArrowUpRight size={16} className="text-emerald-500 inline" />
                          ) : (
                            <ArrowDownRight size={16} className="text-rose-500 inline" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-[var(--gray-mid)]">
              <div className="w-12 h-12 bg-[var(--dark-surface)] rounded-xl flex items-center justify-center mb-4 border border-[var(--dark-border)]">
                <Activity size={24} className="text-[var(--gray-dark)]" />
              </div>
              <p className="font-medium">No forecast data available</p>
              <p className="text-sm text-[var(--gray-dark)] mt-1">Search for a ticker to generate predictions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
