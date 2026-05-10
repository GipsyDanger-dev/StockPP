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
