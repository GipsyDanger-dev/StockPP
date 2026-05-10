/**
 * Common utility functions for data formatting and calculations
 */

/**
 * Format date to readable string
 */
export const formatDate = (date, format = 'MMM dd, yyyy') => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

/**
 * Format currency values
 */
export const formatCurrency = (value, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format percentage values
 */
export const formatPercent = (value, decimals = 2) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Calculate percentage change between two values
 */
export const calculateChange = (oldValue, newValue) => {
  if (!oldValue) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Round to specific decimal places
 */
export const roundTo = (value, decimals = 2) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Generate CSV content from data
 */
export const generateCSV = (data, columns) => {
  const headers = columns.map(col => `"${col.label}"`).join(',');
  const rows = data.map(row => 
    columns.map(col => {
      const value = row[col.key];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Validate ticker format
 */
export const isValidTicker = (ticker) => {
  return /^[A-Z]{1,5}$/.test(ticker);
};

/**
 * Get trend arrow
 */
export const getTrendArrow = (value) => {
  return value > 0 ? '↗️' : value < 0 ? '↘️' : '→';
};
