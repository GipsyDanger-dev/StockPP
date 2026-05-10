import axios from 'axios';

/**
 * API Service - Handles all HTTP requests to Backend API
 * Base URL: http://localhost:8000/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

/**
 * Get stock price forecast
 */
export const getForecast = async (ticker, daysAhead = 1, period = '1y') => {
  try {
    const response = await apiClient.post('/forecast', {
      ticker: ticker.toUpperCase(),
      days_ahead: daysAhead,
      period: period
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch forecast' };
  }
};

/**
 * Get forecast by ticker (simplified endpoint)
 */
export const getForecastByTicker = async (ticker, days = 1) => {
  try {
    const response = await apiClient.get(`/forecast/${ticker.toUpperCase()}`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch forecast' };
  }
};

/**
 * Validate ticker
 */
export const validateTicker = async (ticker) => {
  try {
    const response = await apiClient.get(`/validate/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to validate ticker' };
  }
};

/**
 * Get historical price data
 */
export const getHistoricalData = async (ticker, days = 365) => {
  try {
    const response = await apiClient.get(`/historical/${ticker.toUpperCase()}`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch historical data' };
  }
};

/**
 * Get model metrics
 */
export const getMetrics = async (ticker) => {
  try {
    const response = await apiClient.get(`/metrics/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch metrics' };
  }
};

/**
 * Check API health
 */
export const checkHealth = async () => {
  try {
    const response = await axios.get('http://localhost:8000/health');
    return response.data;
  } catch (error) {
    throw { error: 'API is not available' };
  }
};

export default apiClient;
