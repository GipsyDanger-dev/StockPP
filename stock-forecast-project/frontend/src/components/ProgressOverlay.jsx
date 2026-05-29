import React from 'react';
import { Loader, CheckCircle, AlertCircle, Activity, Database, BarChart3, Cpu, TrendingUp } from 'lucide-react';

const stepIcons = {
  cache_check: Database,
  loading_model: Cpu,
  auto_train: Activity,
  fetching_data: Database,
  indicators: BarChart3,
  scaling: Activity,
  predicting: TrendingUp,
  walk_forward: BarChart3,
  building: Cpu,
  training: Activity,
  evaluating: BarChart3,
  saving: Database,
  complete: CheckCircle,
};

function StepIcon({ status }) {
  if (status === 'done') {
    return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
  }
  if (status === 'error') {
    return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
  }
  return <Loader className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />;
}

function EpochBar({ epoch, totalEpochs, loss }) {
  const pct = Math.round((epoch / totalEpochs) * 100);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Training epoch</span>
        <span className="text-indigo-300 font-mono">{epoch}/{totalEpochs}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {loss > 0 && (
        <div className="text-[10px] text-gray-500 font-mono">loss: {loss.toFixed(5)}</div>
      )}
    </div>
  );
}

export default function ProgressOverlay({ steps, epochs, status, error, onRetry, onCancel }) {
  const latestEpoch = epochs.length > 0 ? epochs[epochs.length - 1] : null;
  const isTraining = steps.some(s => s.step === 'training' && s.status === 'running');

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl p-6 space-y-1">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative">
            <Activity className="w-5 h-5 text-indigo-400" />
            {status === 'streaming' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-200 tracking-tight">
            {status === 'error' ? 'Analysis Failed' : 'Analyzing Market Data'}
          </span>
        </div>

        <div className="space-y-0.5">
          {steps.map((step, i) => {
            const Icon = stepIcons[step.step] || Activity;
            return (
              <div
                key={step.step}
                className="flex items-start gap-3 py-2 px-2 rounded-lg transition-colors"
              >
                <div className="mt-0.5">
                  <StepIcon status={step.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${
                    step.status === 'done' ? 'text-gray-500' :
                    step.status === 'running' ? 'text-gray-200' :
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {step.progress && (
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      fold {step.progress.current}/{step.progress.total}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isTraining && latestEpoch && (
          <EpochBar
            epoch={latestEpoch.epoch}
            totalEpochs={latestEpoch.total_epochs}
            loss={latestEpoch.loss}
          />
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-300">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {status === 'streaming' && onCancel && (
          <div className="mt-3 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
