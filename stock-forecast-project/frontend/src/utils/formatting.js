export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercent = (value) => {
  const num = parseFloat(value);
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};