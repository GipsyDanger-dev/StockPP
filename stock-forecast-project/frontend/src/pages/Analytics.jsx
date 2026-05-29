import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Activity, BarChart2, TrendingUp, TrendingDown, RefreshCw, Search, Loader, PieChart, LayoutDashboard, Lightbulb, FileText, BarChart3 } from 'lucide-react';
import { useForecast, useMarketSummary } from '../hooks/useApi';
import { useProgressStream } from '../hooks/useProgressStream';
import PriceChart from '../components/PriceChart';
import ProgressOverlay from '../components/ProgressOverlay';
import { formatCurrency, formatPercent } from '../utils/formatting';
import * as apiService from '../services/apiService';

const AnalyticsOverview = () => {
  const navigate = useNavigate();
  const { data: marketData, isLoading } = useMarketSummary(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const stocks = marketData?.tickers || [];

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
          const res = await apiService.searchTickers(searchTerm);
        setSearchResults(res.results || []);
      } catch (err) {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const sortedByChange = [...stocks].sort((a, b) => (b.change_percent || 0) - (a.change_percent || 0));
  const topGainers = sortedByChange.slice(0, 3);
  const topLosers = sortedByChange.slice(-3).reverse();

  const showSearchResults = searchTerm.length >= 2;

  return (
    <div className="min-h-screen bg-white text-[#191C1E]">
      {/* HEADER */}
      <header className="bg-[#F7F9FB] px-6 lg:px-12 py-8 border-b border-[#E0E3E5]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-black">ANALYTICS OVERVIEW</h1>
            <p className="text-[#45464D] text-lg mt-1">Select a stock to view detailed analysis with technical indicators</p>
          </div>
        </div>
      </header>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* SEARCH BAR */}
        <div className="mb-10">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search any ticker to analyze (e.g. AAPL, TSLA, NVDA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-4 px-12 border-2 border-[#C6C6CD] rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="absolute left-4 top-4 text-slate-400" size={24} />
            {isSearching && <Loader className="absolute right-4 top-4 animate-spin text-indigo-600" size={24} />}
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="mt-4 bg-white border-2 border-[#C6C6CD] rounded-xl overflow-hidden shadow-sm max-w-2xl">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      onClick={() => navigate(`/analytics/${result.symbol}`)}
                      className="flex justify-between items-center p-4 hover:bg-indigo-50 cursor-pointer transition-colors"
                      role="button"
                      aria-label={`Analyze ${result.symbol}`}
                      tabIndex={0}
                    >
                      <div>
                        <span className="font-bold text-lg">{result.symbol}</span>
                        <span className="text-[#45464D] ml-3">{result.name}</span>
                      </div>
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">
                        Analyze
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-[#45464D]">
                  {isSearching ? 'Searching...' : 'No results found'}
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-indigo-600" size={40} />
            <span className="ml-4 text-[#45464D] text-lg">Loading market data...</span>
          </div>
        ) : (
          <>
            {/* TOP MOVERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Top Gainers */}
              <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
                <div className="bg-[#F0FDF4] p-6 border-b border-[#E0E3E5]">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-emerald-600" size={24} />
                    <h3 className="font-bold text-emerald-700 tracking-widest text-sm">TOP GAINERS</h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {topGainers.map((stock) => (
                    <div
                      key={stock.ticker}
                      onClick={() => navigate(`/analytics/${stock.ticker}`)}
                      className="flex justify-between items-center p-5 px-6 hover:bg-slate-50 cursor-pointer transition-colors"
                      role="button"
                      aria-label={`View ${stock.ticker} analysis`}
                      tabIndex={0}
                    >
                      <div>
                        <span className="font-bold text-xl">{stock.ticker}</span>
                        <span className="text-[#45464D] ml-3 text-sm">{stock.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${stock.price?.toFixed(2)}</p>
                        <p className="text-emerald-600 font-bold">+{stock.change_percent?.toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
                <div className="bg-rose-50 p-6 border-b border-[#E0E3E5]">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="text-rose-600" size={24} />
                    <h3 className="font-bold text-rose-700 tracking-widest text-sm">TOP LOSERS</h3>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {topLosers.map((stock) => (
                    <div
                      key={stock.ticker}
                      onClick={() => navigate(`/analytics/${stock.ticker}`)}
                      className="flex justify-between items-center p-5 px-6 hover:bg-slate-50 cursor-pointer transition-colors"
                      role="button"
                      aria-label={`View ${stock.ticker} analysis`}
                      tabIndex={0}
                    >
                      <div>
                        <span className="font-bold text-xl">{stock.ticker}</span>
                        <span className="text-[#45464D] ml-3 text-sm">{stock.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${stock.price?.toFixed(2)}</p>
                        <p className="text-rose-600 font-bold">{stock.change_percent?.toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ALL STOCKS TABLE */}
            <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#F2F4F6] p-6 border-b border-[#E0E3E5]">
                <h3 className="font-bold tracking-widest text-[#45464D]">ALL WATCHLIST STOCKS</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F7F9FB] text-[#45464D] font-bold text-sm tracking-widest uppercase border-b border-[#E0E3E5]">
                    <tr>
                      <th className="p-5">Ticker</th>
                      <th className="p-5">Company</th>
                      <th className="p-5">Sector</th>
                      <th className="p-5">Price</th>
                      <th className="p-5 text-right">Change</th>
                      <th className="p-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stocks.map((stock) => (
                      <tr
                        key={stock.ticker}
                        onClick={() => navigate(`/analytics/${stock.ticker}`)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors"
                        aria-label={`View ${stock.ticker} analysis`}
                      >
                        <td className="p-5 font-bold text-lg">{stock.ticker}</td>
                        <td className="p-5 text-[#45464D]">{stock.name}</td>
                        <td className="p-5 text-[#45464D]">{stock.sector || 'N/A'}</td>
                        <td className="p-5 font-bold">${stock.price?.toFixed(2) || 'N/A'}</td>
                        <td className={`p-5 text-right font-bold ${stock.change_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2) || '0'}%
                        </td>
                        <td className="p-5 text-right">
                          <span className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">
                            Analyze
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const AnalyticsDetail = ({ ticker }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useForecast(ticker, 7, '1y');
  const stream = useProgressStream('/forecast/stream', { ticker, days_ahead: 7, period: '1y' });
  const [liveQuote, setLiveQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchLiveQuote = async () => {
    if (!ticker) return;
    setQuoteLoading(true);
    try {
      const res = await apiService.getQuote(ticker);
      setLiveQuote(res);
    } catch {
      // quote fetch failed silently
    }
    setQuoteLoading(false);
  };

  useEffect(() => {
    fetchLiveQuote();
    const interval = setInterval(fetchLiveQuote, 30000);
    return () => clearInterval(interval);
  }, [ticker]);

  useEffect(() => {
    if (isLoading && !data) {
      stream.start();
    }
    return () => stream.stop();
  }, [ticker]);

  if (isLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white">
      {stream.steps.length > 0 ? (
        <div className="w-full max-w-lg">
          <ProgressOverlay
            steps={stream.steps}
            epochs={stream.epochs}
            status={stream.status}
            error={stream.error}
            onRetry={() => stream.start()}
            onCancel={() => stream.stop()}
          />
        </div>
      ) : (
        <div className="text-center">
          <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-lg font-bold text-[#191C1E]">ANALYZING MARKET DATA...</p>
        </div>
      )}
    </div>
  );

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <Activity size={40} className="text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-bold text-[#191C1E]">Unable to load analysis</p>
        <p className="text-sm text-[#76777D] mt-2">Please try again or search for a different ticker.</p>
      </div>
    </div>
  );

  const currentPrice = liveQuote?.price || data.current_price;
  const changePercent = liveQuote?.change_percent || data.change_percent;
  const isPositive = changePercent >= 0;
  const indicators = data.indicators || {};
  const historicalIndicators = data.historical_indicators || [];

  const getRsiSignal = (rsi) => {
    if (rsi < 30) return { label: 'Oversold', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    if (rsi > 70) return { label: 'Overbought', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
    return { label: 'Neutral', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
  };

  const getMaSignal = (ma20, ma50) => {
    if (ma20 > ma50) return { label: 'Bullish Crossover', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    return { label: 'Bearish Crossover', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  };

  const getMacdSignal = (macd) => {
    if (macd > 0) return { label: 'Bullish Momentum', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    return { label: 'Bearish Momentum', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  };

  const getEwmaSignal = (ewma20, price) => {
    if (!ewma20 || !price) return { label: 'N/A', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
    if (price > ewma20) return { label: 'Above EWMA', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    return { label: 'Below EWMA', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
  };

  const rsiSignal = getRsiSignal(indicators.rsi);
  const maSignal = getMaSignal(indicators.ma20, indicators.ma50);
  const macdSignal = getMacdSignal(indicators.macd);
  const ewmaSignal = getEwmaSignal(indicators.ewma20, currentPrice);

  return (
    <div className="min-h-screen bg-white text-[#191C1E]">
      {/* HEADER */}
      <header className="bg-[#F7F9FB] px-6 lg:px-12 py-8 flex items-center border-b border-[#E0E3E5]">
        <button onClick={() => navigate('/analytics')} className="mr-6 p-2 hover:bg-slate-200 rounded-full transition-colors" aria-label="Back to Analytics Overview">
          <ChevronLeft size={32} />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={28} />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-black">PRECISION ANALYTICS</h1>
        </div>
        <button onClick={fetchLiveQuote} className="ml-auto p-3 hover:bg-slate-200 rounded-full transition-colors" title="Refresh live price" aria-label="Refresh live price">
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
              <p className="text-sm text-emerald-600 font-medium mt-2">Live from Finnhub</p>
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

        {/* TECHNICAL INDICATORS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
          {/* RSI Card */}
          <div className={`border-2 rounded-xl p-6 shadow-sm ${rsiSignal.bg}`}>
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-3">RSI (14)</p>
            <p className="text-4xl font-bold text-black mb-2">{indicators.rsi?.toFixed(2) || 'N/A'}</p>
            <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${rsiSignal.color} ${rsiSignal.bg}`}>
              {rsiSignal.label}
            </span>
            <div className="mt-4 w-full bg-slate-200 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${indicators.rsi < 30 ? 'bg-emerald-500' : indicators.rsi > 70 ? 'bg-rose-500' : 'bg-slate-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, indicators.rsi || 0))}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#45464D] mt-1">
              <span>0</span>
              <span>30 (Oversold)</span>
              <span>70 (Overbought)</span>
              <span>100</span>
            </div>
          </div>

          {/* Moving Averages Card */}
          <div className={`border-2 rounded-xl p-6 shadow-sm ${maSignal.bg}`}>
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-3">MOVING AVERAGES</p>
            <div className="space-y-3">
              <div>
                <p className="text-[#45464D] text-sm">MA20 (Short-term)</p>
                <p className="text-2xl font-bold text-black">{formatCurrency(indicators.ma20)}</p>
              </div>
              <div>
                <p className="text-[#45464D] text-sm">MA50 (Long-term)</p>
                <p className="text-2xl font-bold text-black">{formatCurrency(indicators.ma50)}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${maSignal.color} ${maSignal.bg}`}>
                {maSignal.label}
              </span>
              <p className="text-xs text-[#45464D] mt-2">
                {indicators.ma20 > indicators.ma50
                  ? 'MA20 above MA50 suggests upward momentum'
                  : 'MA20 below MA50 suggests downward pressure'}
              </p>
            </div>
          </div>

          {/* MACD Card */}
          <div className={`border-2 rounded-xl p-6 shadow-sm ${macdSignal.bg}`}>
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-3">MACD</p>
            <p className="text-4xl font-bold text-black mb-2">{indicators.macd?.toFixed(4) || 'N/A'}</p>
            <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${macdSignal.color} ${macdSignal.bg}`}>
              {macdSignal.label}
            </span>
            <p className="text-xs text-[#45464D] mt-4">
              MACD = 12-day EMA - 26-day EMA.
              {indicators.macd > 0
                ? ' Positive values indicate bullish momentum.'
                : ' Negative values indicate bearish momentum.'}
            </p>
          </div>

          {/* EWMA20 Card */}
          <div className={`border-2 rounded-xl p-6 shadow-sm ${ewmaSignal.bg}`}>
            <p className="text-[#45464D] font-bold tracking-widest text-sm mb-3">EWMA (20)</p>
            <p className="text-4xl font-bold text-black mb-2">{formatCurrency(indicators.ewma20)}</p>
            <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${ewmaSignal.color} ${ewmaSignal.bg}`}>
              {ewmaSignal.label}
            </span>
            <p className="text-xs text-[#45464D] mt-4">
              Exponentially Weighted MA (span=20).
              {indicators.ewma20 && currentPrice > indicators.ewma20
                ? ' Price above EWMA suggests bullish trend.'
                : ' Price below EWMA suggests bearish trend.'}
            </p>
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden mb-12 shadow-sm">
          <div className="bg-[#F2F4F6] p-6 flex justify-between items-center border-b border-[#E0E3E5]">
            <div className="flex gap-8">
              <span className="font-bold text-black text-lg border-b-4 border-indigo-600 pb-1">Actual vs Forecast</span>
              <span className="text-[#45464D] text-lg">Indigo = Actual &bull; Green dashed = Forecast &bull; Orange = MA20 &bull; Cyan = MA50 &bull; Purple = EWMA20</span>
            </div>
            <BarChart2 size={24} className="text-[#45464D]" />
          </div>
          <div className="p-6 h-[500px]">
             <PriceChart
               historical={data.historical}
               forecast={data.forecast}
               indicators={historicalIndicators}
             />
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
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">RSI Signal</span>
                <span className={`text-xl font-bold ${rsiSignal.color}`}>{rsiSignal.label}</span>
              </div>
              <div className="flex justify-between items-center p-6 px-10">
                <span className="text-[#45464D] text-lg font-medium">MA Signal</span>
                <span className={`text-xl font-bold ${maSignal.color}`}>{maSignal.label}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Analytics = () => {
  const { ticker } = useParams();

  if (!ticker) {
    return <AnalyticsOverview />;
  }

  return <AnalyticsDetail ticker={ticker} />;
};

const LiveCard = ({ label, value, positive }) => (
  <div className="bg-[#F7F9FB] border-2 border-[#E0E3E5] rounded-xl p-4 text-center">
    <p className="text-[#45464D] text-sm font-medium mb-1">{label}</p>
    <p className={`text-lg font-bold ${positive === true ? 'text-emerald-600' : positive === false ? 'text-rose-600' : 'text-black'}`}>{value}</p>
  </div>
);

export default Analytics;
