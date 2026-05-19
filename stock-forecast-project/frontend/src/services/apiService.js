import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

export const validateTicker = async (ticker) => {
  try {
    const response = await apiClient.get(`/validate/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to validate ticker' };
  }
};

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

export const getMetrics = async (ticker) => {
  try {
    const response = await apiClient.get(`/metrics/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch metrics' };
  }
};

export const checkHealth = async () => {
  try {
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    const response = await axios.get(`${baseUrl}/health`);
    return response.data;
  } catch (error) {
    throw { error: 'API is not available' };
  }
};

export const getMarketSummary = async () => {
  try {
    const response = await apiClient.get('/market/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch market summary' };
  }
};

export const searchTickers = async (query) => {
  try {
    const response = await apiClient.get(`/search/${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to search tickers' };
  }
};

export const getQuote = async (ticker) => {
  try {
    const response = await apiClient.get(`/quote/${ticker.toUpperCase()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch quote' };
  }
};

export const getReportsHistory = async (ticker = null, limit = 50, status = null) => {
  try {
    const params = { limit };
    if (ticker) params.ticker = ticker.toUpperCase();
    if (status) params.status = status;

    const response = await apiClient.get('/reports/history', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch reports' };
  }
};

export const checkDatabaseHealth = async () => {
  try {
    const response = await apiClient.get('/health/database');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Database health check failed' };
  }
};

export const getModelsStatus = async () => {
  try {
    const response = await apiClient.get('/models/status');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch models status' };
  }
};

export const getArticles = async (status = null, limit = 50) => {
  try {
    const params = { limit };
    if (status) params.status = status;
    const response = await apiClient.get('/articles', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch articles' };
  }
};

export const getArticle = async (articleId) => {
  try {
    const response = await apiClient.get(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch article' };
  }
};

export const createArticle = async (articleData) => {
  try {
    const response = await apiClient.post('/articles', articleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to create article' };
  }
};

export const updateArticle = async (articleId, updates) => {
  try {
    const response = await apiClient.put(`/articles/${articleId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to update article' };
  }
};

export const deleteArticle = async (articleId) => {
  try {
    const response = await apiClient.delete(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete article' };
  }
};

export const getArticleStats = async () => {
  try {
    const response = await apiClient.get('/articles/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch article stats' };
  }
};

export const uploadArticleImage = async (file, articleId = null, imageType = 'general') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (articleId) params.append('article_id', articleId);
    params.append('image_type', imageType);

    const response = await apiClient.post(`/articles/upload-image?${params.toString()}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to upload image' };
  }
};

export const getPredictionHistory = async (userId, ticker = null, status = null, limit = 50) => {
  try {
    const params = { user_id: userId, limit };
    if (ticker) params.ticker = ticker.toUpperCase();
    if (status) params.status = status;
    const response = await apiClient.get('/predictions/history', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch prediction history' };
  }
};

export const validatePrediction = async (predictionId) => {
  try {
    const response = await apiClient.post(`/predictions/validate/${predictionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to validate prediction' };
  }
};

export const validateAllPredictions = async () => {
  try {
    const response = await apiClient.post('/predictions/validate-all');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to validate predictions' };
  }
};

export const getForecastWithUser = async (ticker, daysAhead = 1, period = '1y', userId = null) => {
  try {
    const body = {
      ticker: ticker.toUpperCase(),
      days_ahead: daysAhead,
      period: period,
    };
    if (userId) body.user_id = userId;
    const response = await apiClient.post('/forecast', body);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch forecast' };
  }
};

export const getInsights = async () => {
  try {
    const response = await apiClient.get('/insights');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch insights' };
  }
};

export default apiClient;
