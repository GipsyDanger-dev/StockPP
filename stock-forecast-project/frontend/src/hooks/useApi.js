import { useQuery, useMutation } from '@tanstack/react-query';
import * as apiService from '../services/apiService';

/**
 * Custom hook for fetching stock forecast
 */
export const useForecast = (ticker, daysAhead = 1, period = '1y', enabled = true) => {
  return useQuery({
    queryKey: ['forecast', ticker, daysAhead, period],
    queryFn: () => apiService.getForecast(ticker, daysAhead, period),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

/**
 * Custom hook for validating ticker
 */
export const useValidateTicker = (ticker) => {
  return useQuery({
    queryKey: ['validate', ticker],
    queryFn: () => apiService.validateTicker(ticker),
    enabled: !!ticker && ticker.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Custom hook for fetching historical data
 */
export const useHistoricalData = (ticker, days = 365, enabled = true) => {
  return useQuery({
    queryKey: ['historical', ticker, days],
    queryFn: () => apiService.getHistoricalData(ticker, days),
    enabled: enabled && !!ticker,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Custom hook for fetching model metrics
 */
export const useMetrics = (ticker, enabled = true) => {
  return useQuery({
    queryKey: ['metrics', ticker],
    queryFn: () => apiService.getMetrics(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for checking API health
 */
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiService.checkHealth,
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * Custom hook for fetching market summary (NEW - Supabase)
 * Returns all active tickers with current prices from database
 */
export const useMarketSummary = (enabled = true) => {
  return useQuery({
    queryKey: ['marketSummary'],
    queryFn: apiService.getMarketSummary,
    enabled: enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
    keepPreviousData: true,
  });
};

/**
 * Custom hook for fetching training reports history (NEW - Supabase)
 * Returns training logs from database
 */
export const useReportsHistory = (ticker = null, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: ['reportsHistory', ticker, limit],
    queryFn: () => apiService.getReportsHistory(ticker, limit),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Custom hook for checking database health (NEW - Supabase)
 */
export const useDatabaseHealth = (enabled = true) => {
  return useQuery({
    queryKey: ['databaseHealth'],
    queryFn: apiService.checkDatabaseHealth,
    enabled: enabled,
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
};
