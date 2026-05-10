import React, { useState } from 'react';
import { Search, Settings, Menu, X, Activity } from 'lucide-react';

/**
 * Header Component - Top navigation bar
 */
export const Header = ({ onTickerSearch, apiStatus }) => {
  const [ticker, setTicker] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (ticker.trim()) {
      onTickerSearch(ticker.toUpperCase());
      setTicker('');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">StockForecast</h1>
              <p className="text-xs text-slate-500">LSTM-Based Price Prediction</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticker (e.g., AAPL, GOOGL)..."
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </form>

          {/* Status & Menu */}
          <div className="flex items-center gap-4">
            {/* API Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${apiStatus === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-xs text-slate-600">{apiStatus === 'online' ? 'Online' : 'Offline'}</span>
            </div>

            {/* Settings Button */}
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>

            {/* Mobile Menu */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="hidden md:block p-2 hover:bg-slate-100 rounded-lg"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Sidebar Component - Control panel
 */
export const Sidebar = ({ onPeriodChange, onDaysChange, selectedPeriod, selectedDays }) => {
  return (
    <aside className="bg-white border-r border-slate-200 p-6 h-screen overflow-y-auto max-w-xs">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Analysis Panel</h2>

      {/* Time Period Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-3">Historical Period</label>
        <div className="space-y-2">
          {['1m', '3m', '6m', '1y', '2y', '5y'].map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Last {period === '1m' ? '1 Month' : period === '3m' ? '3 Months' : period === '6m' ? '6 Months' : period === '1y' ? '1 Year' : period === '2y' ? '2 Years' : '5 Years'}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Days Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-3">Forecast Days Ahead</label>
        <div className="space-y-2">
          {[1, 5, 10, 15, 20, 30].map((days) => (
            <button
              key={days}
              onClick={() => onDaysChange(days)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                selectedDays === days
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {days} day{days > 1 ? 's' : ''} ahead
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 border-t border-slate-200">
        <button className="w-full btn-primary mb-2">Export Forecast</button>
        <button className="w-full btn-secondary">Refresh Data</button>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 <strong>Tip:</strong> Use the historical period selector to train the model with different time ranges, affecting forecast accuracy.
        </p>
      </div>
    </aside>
  );
};
