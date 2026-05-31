import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, TrendingUp, TrendingDown, CheckCircle, XCircle,
  Clock, Loader, RefreshCw, Search, ChevronRight, BarChart3,
  Target, Zap, ArrowUpRight, ArrowDownRight, Filter,
} from 'lucide-react';
import { usePredictionHistory } from '../hooks/useApi';
import * as apiService from '../services/apiService';

const PredictionHistory = () => {
  const navigate = useNavigate();
  const [tickerFilter, setTickerFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [validating, setValidating] = useState(null);

  const { data, isLoading, refetch, isFetching } = usePredictionHistory(
    tickerFilter, statusFilter, 50, true
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
    } catch {} finally {
      setValidating(null);
    }
  };

  const handleValidateAll = async () => {
    setValidating('all');
    try {
      await apiService.validateAllPredictions();
      refetch();
    } catch {} finally {
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
    if (mpe <= 2) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (mpe <= 5) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getAccuracyLabel = (mpe) => {
    if (mpe <= 2) return 'High';
    if (mpe <= 5) return 'Moderate';
    return 'Low';
  };

  const tickers = [...new Set(predictions.map(p => p.ticker))];

  return (
    <div className="bg-[var(--dark-bg)] text-white min-h-screen">
      <header className="bg-[var(--dark-surface)] px-6 lg:px-12 py-10 border-b border-[var(--dark-border)]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">Prediction Tracker</h1>
            <p className="text-[var(--gray-mid)] text-lg">
              Validate your predictions against actual market performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <button
                onClick={handleValidateAll}
                disabled={validating === 'all'}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--orange)] text-white rounded-lg hover:bg-[var(--orange-hover)] transition-colors disabled:opacity-50"
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
              className="flex items-center gap-2 px-4 py-2 bg-[var(--dark-border)] border border-[var(--dark-border)] rounded-lg hover:bg-[var(--dark-hover)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <SummaryCard label="TOTAL" value={predictions.length.toString()} icon={BarChart3} />
          <SummaryCard label="VALIDATED" value={validated.length.toString()} icon={CheckCircle} color="text-emerald-400" />
          <SummaryCard label="PENDING" value={pending.length.toString()} icon={Clock} color="text-yellow-400" />
          <SummaryCard label="DIRECTION" value={`${directionAccuracy}%`} icon={Target} color="text-[var(--orange)]" />
          <SummaryCard label="AVG ERROR" value={`${avgMPE}%`} icon={Zap} color={parseFloat(avgMPE) <= 2 ? 'text-emerald-400' : parseFloat(avgMPE) <= 5 ? 'text-yellow-400' : 'text-red-400'} />
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setTickerFilter(null); setStatusFilter(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !tickerFilter && !statusFilter
                ? 'bg-[var(--orange)] text-white'
                : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[var(--dark-border)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'validated' ? null : 'validated')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'validated'
                ? 'bg-[var(--orange)] text-white'
                : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[var(--dark-border)]'
            }`}
          >
            Validated
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? null : 'pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-[var(--orange)] text-white'
                : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[var(--dark-border)]'
            }`}
          >
            Pending
          </button>
          {tickers.length > 1 && (
            <>
              <div className="w-px bg-[var(--dark-border)] mx-1" />
              {tickers.map(t => (
                <button
                  key={t}
                  onClick={() => setTickerFilter(tickerFilter === t ? null : t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tickerFilter === t
                      ? 'bg-[var(--orange)] text-white'
                      : 'bg-[var(--dark-surface)] text-[var(--gray-mid)] border border-[var(--dark-border)] hover:bg-[var(--dark-border)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="bg-[var(--dark-surface)] border border-[var(--dark-border)] rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Loader className="animate-spin text-[var(--orange)]" size={40} />
              <p className="text-[var(--gray-mid)]">Loading prediction history...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <Activity className="text-[var(--gray-dark)]" size={48} />
              <p className="text-[var(--gray-mid)] font-bold text-lg">No predictions yet</p>
              <p className="text-[var(--gray-mid)] text-sm">Make a prediction on the Dashboard to start tracking accuracy.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 px-6 py-2 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-[var(--orange-hover)] transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="bg-[var(--dark-surface)] grid grid-cols-6 p-4 border-b border-[var(--dark-border)] text-[var(--gray-mid)] text-xs uppercase tracking-wider font-bold">
                <div className="col-span-1">Ticker</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1">Predicted</div>
                <div className="col-span-1">Actual</div>
                <div className="col-span-1">Accuracy</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              <div className="divide-y divide-[var(--dark-border)]">
                {predictions.map((pred) => {
                  const lastPredicted = pred.predicted_prices?.[pred.predicted_prices.length - 1];
                  const lastActual = pred.actual_prices?.[pred.actual_prices.length - 1];
                  const isPending = pred.status === 'pending';

                  return (
                    <div key={pred.id} className="grid grid-cols-6 p-4 items-center hover:bg-[var(--dark-surface)] transition-colors">
                      <div className="col-span-1 flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/analytics/${pred.ticker}`)}
                          className="font-bold text-sm text-white hover:text-[var(--orange)] transition-colors"
                        >
                          {pred.ticker}
                        </button>
                        {pred.trend === 'Bullish' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                      </div>

                      <div className="col-span-1 text-sm text-[var(--gray-mid)]">
                        {formatDate(pred.created_at)}
                      </div>

                      <div className="col-span-1">
                        <p className="text-sm font-bold">${lastPredicted?.price?.toFixed(2) || '-'}</p>
                        <p className="text-xs text-[var(--gray-dark)]">
                          {pred.predicted_change_percent > 0 ? '+' : ''}{pred.predicted_change_percent?.toFixed(2)}%
                        </p>
                      </div>

                      <div className="col-span-1">
                        {isPending ? (
                          <span className="text-xs text-[var(--gray-dark)]">Waiting...</span>
                        ) : (
                          <>
                            <p className="text-sm font-bold">${lastActual?.price?.toFixed(2) || '-'}</p>
                            <p className={`text-xs ${pred.actual_change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {pred.actual_change_percent > 0 ? '+' : ''}{pred.actual_change_percent?.toFixed(2)}%
                            </p>
                          </>
                        )}
                      </div>

                      <div className="col-span-1">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[11px] rounded-full border border-yellow-500/20">
                            <Clock size={10} />
                            Pending
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border ${getAccuracyColor(pred.mean_percent_error || 0)}`}>
                              {getAccuracyLabel(pred.mean_percent_error || 0)} ({pred.mean_percent_error?.toFixed(1)}%)
                            </span>
                            {pred.direction_correct ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                                <CheckCircle size={10} /> Direction OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
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
                            className="p-1.5 hover:bg-[var(--dark-border)] rounded transition-colors"
                            aria-label={`View ${pred.ticker} analytics`}
                          >
                            <ChevronRight className="w-4 h-4 text-[var(--gray-mid)]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-[var(--dark-border)] bg-[var(--dark-surface)]">
                <p className="text-[var(--gray-mid)] text-xs">
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

const SummaryCard = ({ label, value, icon: Icon, color = 'text-white' }) => (
  <div className="bg-[var(--dark-surface)] border border-[var(--dark-border)] p-4 rounded-xl">
    <div className="flex items-center gap-2 mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-[var(--gray-dark)] text-[10px] font-bold tracking-wider">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default PredictionHistory;
