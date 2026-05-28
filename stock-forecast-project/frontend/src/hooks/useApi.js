import { useQuery } from '@tanstack/react-query';
import * as apiService from '../services/apiService';

export const useForecast = (ticker, daysAhead = 1, period = '1y', enabled = true) => {
  return useQuery({
    queryKey: ['forecast', ticker, daysAhead, period],
    queryFn: () => apiService.getForecast(ticker, daysAhead, period),
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

export const useValidateTicker = (ticker) => {
  return useQuery({
    queryKey: ['validate', ticker],
    queryFn: () => apiService.validateTicker(ticker),
    enabled: !!ticker && ticker.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useHistoricalData = (ticker, days = 365, enabled = true) => {
  return useQuery({
    queryKey: ['historical', ticker, days],
    queryFn: () => apiService.getHistoricalData(ticker, days),
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useMetrics = (ticker, enabled = true) => {
  return useQuery({
    queryKey: ['metrics', ticker],
    queryFn: () => apiService.getMetrics(ticker),
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: apiService.checkHealth,
    staleTime: 0,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
};

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
    placeholderData: (previousData) => previousData,
  });
};

export const useReportsHistory = (ticker = null, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: ['reportsHistory', ticker, limit],
    queryFn: () => apiService.getReportsHistory(ticker, limit),
    enabled: enabled,
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

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

export const usePredictionHistory = (ticker = null, status = null, limit = 50, enabled = true) => {
  return useQuery({
    queryKey: ['predictionHistory', ticker, status, limit],
    queryFn: () => apiService.getPredictionHistory(ticker, status, limit),
    enabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useForecastTracked = (ticker, daysAhead = 1, period = '1y', enabled = true) => {
  return useQuery({
    queryKey: ['forecastTracked', ticker, daysAhead, period],
    queryFn: () => apiService.getForecastWithUser(ticker, daysAhead, period),
    enabled: enabled && !!ticker,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};
