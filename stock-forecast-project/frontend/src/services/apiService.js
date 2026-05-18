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

/**
 * Get market summary - all active tickers with current prices
 * (NEW: Supabase integration)
 */
export const getMarketSummary = async () => {
  try {
    const response = await apiClient.get('/market/summary');
    return response.data;
  } catch (error) {
    console.warn('Market summary not available, using fallback data');
    throw error.response?.data || { error: 'Failed to fetch market summary' };
  }
};

/**
 * Search for stock tickers via Finnhub
 */
export const searchTickers = async (query) => {
  try {
    const response = await apiClient.get(`/search/${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to search tickers' };
  }
};

/**
 * Get live price quote for any ticker
 */
export const getQuote = async (ticker) => {
  try {
    const response = await apiClient.get(`/quote/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch quote' };
  }
};

/**
 * Get training reports history from database
 * (NEW: Supabase integration)
 */
export const getReportsHistory = async (ticker = null, limit = 50, status = null) => {
  try {
    const params = { limit };
    if (ticker) params.ticker = ticker.toUpperCase();
    if (status) params.status = status;
    
    const response = await apiClient.get('/reports/history', { params });
    return response.data;
  } catch (error) {
    console.warn('Reports history not available');
    throw error.response?.data || { error: 'Failed to fetch reports' };
  }
};

/**
 * Check database health
 * (NEW: Supabase integration)
 */
export const checkDatabaseHealth = async () => {
  try {
    const response = await apiClient.get('/health/database');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Database health check failed' };
  }
};

/**
 * Get AI-driven market insights (NEW)
 * Returns featured article, insight cards, and summary
 */
export const getInsights = async () => {
  try {
    const response = await apiClient.get('/insights');
    return response.data;
  } catch (error) {
    console.warn('Insights not available, using fallback data');
    throw error.response?.data || { error: 'Failed to fetch insights' };
  }
};

export default apiClient;
