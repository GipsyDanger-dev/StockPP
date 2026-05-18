import { useQuery } from '@tanstack/react-query';
import * as apiService from '../services/apiService';

/**
 * Custom hook for fetching stock forecast
 */
export const useForecast = (ticker, daysAhead = 1, period = '1y', enabled = true) => {
  return useQuery({
    queryKey: ['forecast', ticker, daysAhead, period],
    queryFn: () => apiService.getForecast(ticker, daysAhead, period),
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook for checking API health - POLLING every 10s
 */
export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiService.checkHealth,
    staleTime: 0,
    refetchInterval: 10 * 1000, // Poll every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook for fetching market summary - POLLING every 30s
 */
export const useMarketSummary = (enabled = true) => {
  return useQuery({
    queryKey: ['marketSummary'],
    queryFn: apiService.getMarketSummary,
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
    keepPreviousData: true,
  });
};

/**
 * Custom hook for fetching training reports history - POLLING every 30s
 */
export const useReportsHistory = (ticker = null, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: ['reportsHistory', ticker, limit],
    queryFn: () => apiService.getReportsHistory(ticker, limit),
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

/**
 * Custom hook for checking database health - POLLING every 15s
 */
export const useDatabaseHealth = (enabled = true) => {
  return useQuery({
    queryKey: ['databaseHealth'],
    queryFn: apiService.checkDatabaseHealth,
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for fetching AI-driven market insights - POLLING every 30s
 */
export const useInsights = (enabled = true) => {
  return useQuery({
    queryKey: ['insights'],
    queryFn: apiService.getInsights,
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for searching stock tickers via Finnhub
 */
export const useTickerSearch = (query, enabled = true) => {
  return useQuery({
    queryKey: ['tickerSearch', query],
    queryFn: () => apiService.searchTickers(query),
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for getting live price quote - POLLING every 15s
 */
export const useQuote = (ticker, enabled = true) => {
  return useQuery({
    queryKey: ['quote', ticker],
    queryFn: () => apiService.getQuote(ticker),
    enabled: enabled && !!ticker,
    staleTime: 0,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for getting all models status - POLLING every 30s
 */
export const useModelsStatus = (enabled = true) => {
  return useQuery({
    queryKey: ['modelsStatus'],
    queryFn: apiService.getModelsStatus,
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for fetching articles - POLLING every 30s
 */
export const useArticles = (status = null, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: ['articles', status, limit],
    queryFn: () => apiService.getArticles(status, limit),
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for fetching a single article
 */
export const useArticle = (articleId, enabled = true) => {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: () => apiService.getArticle(articleId),
    enabled: enabled && !!articleId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Custom hook for fetching article statistics - POLLING every 30s
 */
export const useArticleStats = (enabled = true) => {
  return useQuery({
    queryKey: ['articleStats'],
    queryFn: apiService.getArticleStats,
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};
