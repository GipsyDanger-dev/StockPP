import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, TrendingUp, TrendingDown, CheckCircle, XCircle,
  Clock, Loader, RefreshCw, Search, ChevronRight, BarChart3,
  Target, Zap, ArrowUpRight, ArrowDownRight, Filter,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePredictionHistory } from '../hooks/useApi';
import * as apiService from '../services/apiService';

const PredictionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickerFilter, setTickerFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [validating, setValidating] = useState(null);

  const { data, isLoading, refetch, isFetching } = usePredictionHistory(
    user?.id, tickerFilter, statusFilter, 50, true
  );

  const predictions = data?.predictions || [];

  const validated = predictions.filter(p => p.status === 'validated');
  const pending = predictions.filter(p => p.status === 'pending');
  const directionCorrect = validated.filter(p => p.direction_correct).length;
  const avgMAE = validated.length > 0
    ? (validated.reduce((sum, p) => sum + (p.mean_absolute_error || 0), 0) / validated.length).toFixed(2)
    : '0.00';
  const avgMPE = validated.length > 0
    ? (validated.reduce((sum, p) => sum + (p.mean_percent_error || 0), 0) / validated.length).toFixed(2)
    : '0.00';
  const directionAccuracy = validated.length > 0
    ? ((directionCorrect / validated.length) * 100).toFixed(1)
    : '0.0';

  const handleValidate = async (predId) => {
    setValidating(predId);
    try {
      await apiService.validatePrediction(predId);
      refetch();
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setValidating(null);
    }
  };

  const handleValidateAll = async () => {
    setValidating('all');
    try {
      await apiService.validateAllPredictions();
      refetch();
    } catch (err) {
      console.error('Batch validation error:', err);
    } finally {
      setValidating(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getAccuracyColor = (mpe) => {
    if (mpe <= 2) return 'text-green-600 bg-green-50 border-green-200';
    if (mpe <= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getAccuracyLabel = (mpe) => {
    if (mpe <= 2) return 'High';
    if (mpe <= 5) return 'Moderate';
    return 'Low';
  };

  const tickers = [...new Set(predictions.map(p => p.ticker))];

  return (
    <div className="bg-white text-[#191C1E] min-h-screen">
      <header className="bg-[#F7F9FB] px-6 lg:px-12 py-10 border-b border-[#E0E3E5]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-3 tracking-tight">Prediction Tracker</h1>
            <p className="text-[#45464D] text-lg">
              Validate your predictions against actual market performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <button
                onClick={handleValidateAll}
                disabled={validating === 'all'}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {validating === 'all' ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">Validate All ({pending.length})</span>
              </button>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#C6C6CD] rounded-lg hover:bg-[#F7F9FB] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard label="TOTAL" value={predictions.length.toString()} icon={BarChart3} />
          <SummaryCard label="VALIDATED" value={validated.length.toString()} icon={CheckCircle} color="text-green-600" />
          <SummaryCard label="PENDING" value={pending.length.toString()} icon={Clock} color="text-yellow-600" />
          <SummaryCard label="DIRECTION" value={`${directionAccuracy}%`} icon={Target} color="text-indigo-600" />
          <SummaryCard label="AVG ERROR" value={`${avgMPE}%`} icon={Zap} color={parseFloat(avgMPE) <= 2 ? 'text-green-600' : parseFloat(avgMPE) <= 5 ? 'text-yellow-600' : 'text-red-600'} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setTickerFilter(null); setStatusFilter(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !tickerFilter && !statusFilter
                ? 'bg-[#131B2E] text-white'
                : 'bg-[#F7F9FB] text-[#45464D] border border-[#C6C6CD] hover:bg-[#E8EAED]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'validated' ? null : 'validated')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'validated'
                ? 'bg-[#131B2E] text-white'
                : 'bg-[#F7F9FB] text-[#45464D] border border-[#C6C6CD] hover:bg-[#E8EAED]'
            }`}
          >
            Validated
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[#131B2E] text-white'
                : 'bg-[#F7F9FB] text-[#45464D] border border-[#C6C6CD] hover:bg-[#E8EAED]'
            }`}
          >
            Pending
          </button>
          {tickers.length > 1 && (
            <>
              <div className="w-px bg-[#C6C6CD] mx-1" />
              {tickers.map(t => (
                <button
                  key={t}
                  onClick={() => setTickerFilter(tickerFilter === t ? null : t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tickerFilter === t
                      ? 'bg-[#131B2E] text-white'
                      : 'bg-[#F7F9FB] text-[#45464D] border border-[#C6C6CD] hover:bg-[#E8EAED]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Predictions Table */}
        <div className="bg-white border-2 border-[#E0E3E5] rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <p className="text-[#45464D]">Loading prediction history...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Activity className="text-[#C6C6CD]" size={48} />
              <p className="text-[#45464D] font-bold text-lg">No predictions yet</p>
              <p className="text-[#45464D] text-sm">Make a prediction on the Dashboard to start tracking accuracy.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="bg-[#F2F4F6] grid grid-cols-6 p-4 border-b border-[#E0E3E5] text-[#45464D] text-xs uppercase tracking-wider font-bold">
                <div className="col-span-1">Ticker</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1">Predicted</div>
                <div className="col-span-1">Actual</div>
                <div className="col-span-1">Accuracy</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              <div className="divide-y divide-[#E0E3E5]">
                {predictions.map((pred) => {
                  const lastPredicted = pred.predicted_prices?.[pred.predicted_prices.length - 1];
                  const lastActual = pred.actual_prices?.[pred.actual_prices.length - 1];
                  const isPending = pred.status === 'pending';

                  return (
                    <div key={pred.id} className="grid grid-cols-6 p-4 items-center hover:bg-[#F7F9FB] transition-colors">
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/analytics/${pred.ticker}`)}
                          className="font-bold text-sm text-black hover:text-indigo-600 transition-colors"
                        >
                          {pred.ticker}
                        </button>
                        {pred.trend === 'Bullish' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>

                      <div className="col-span-1 text-sm text-[#45464D]">
                        {formatDate(pred.created_at)}
                      </div>

                      <div className="col-span-1">
                        <p className="text-sm font-bold">${lastPredicted?.price?.toFixed(2) || '-'}</p>
                        <p className="text-xs text-[#76777D]">
                          {pred.predicted_change_percent > 0 ? '+' : ''}{pred.predicted_change_percent?.toFixed(2)}%
                        </p>
                      </div>

                      <div className="col-span-1">
                        {isPending ? (
                          <span className="text-xs text-[#76777D]">Waiting...</span>
                        ) : (
                          <>
                            <p className="text-sm font-bold">${lastActual?.price?.toFixed(2) || '-'}</p>
                            <p className={`text-xs ${pred.actual_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pred.actual_change_percent > 0 ? '+' : ''}{pred.actual_change_percent?.toFixed(2)}%
                            </p>
                          </>
                        )}
                      </div>

                      <div className="col-span-1">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[11px] rounded-full border border-yellow-200">
                            <Clock size={10} />
                            Pending
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border ${getAccuracyColor(pred.mean_percent_error || 0)}`}>
                              {getAccuracyLabel(pred.mean_percent_error || 0)} ({pred.mean_percent_error?.toFixed(1)}%)
                            </span>
                            {pred.direction_correct ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-green-600">
                                <CheckCircle size={10} /> Direction OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-600">
                                <XCircle size={10} /> Wrong dir.
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 flex items-center justify-end gap-2">
                        {isPending ? (
                          <button
                            onClick={() => handleValidate(pred.id)}
                            disabled={validating === pred.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                          >
                            {validating === pred.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap size={12} />
                            )}
                            Validate
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/analytics/${pred.ticker}`)}
                            className="p-1.5 hover:bg-[#E6E8EA] rounded transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-[#45464D]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-[#E0E3E5] bg-[#F7F9FB]">
                <p className="text-[#45464D] text-xs">
                  Showing {predictions.length} prediction{predictions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon: Icon, color = 'text-[#191C1E]' }) => (
  <div className="bg-white border-2 border-[#E0E3E5] p-4 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[#76777D] text-[10px] font-bold tracking-wider">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default PredictionHistory;
