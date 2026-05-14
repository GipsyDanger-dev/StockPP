"""
Data Engine - Handles stock data ingestion and preprocessing
Uses yfinance to fetch historical data and MinMaxScaler for normalization
"""

import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.preprocessing import MinMaxScaler
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DataEngine:
    """
    Handles stock data fetching, cleaning, normalization and sequence creation
    """
    
    def __init__(self, window_size: int = 60):
        """
        Initialize DataEngine
        
        Args:
            window_size: Number of days to use for LSTM sequence (default: 60)
        """
        self.window_size = window_size
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.original_close_prices = None
        self.scaled_data = None
        
    def fetch_data(self, ticker: str, period: str = "5y") -> pd.DataFrame:
        """
        Fetch historical stock data from yfinance
        
        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')
            period: Time period ('5y' for 5 years, etc.)
            
        Returns:
            DataFrame with OHLCV data
        """
        try:
            logger.info(f"Fetching data for {ticker} with period {period}")
            data = yf.download(ticker, period=period, progress=False)
            
            if data.empty:
                raise ValueError(f"No data found for ticker {ticker}")
            
            logger.info(f"Successfully fetched {len(data)} days of data for {ticker}")
            return data
        except Exception as e:
            logger.error(f"Error fetching data: {str(e)}")
            raise
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess data: extract Close prices, normalize, and create sequences
        
        Args:
            df: DataFrame with stock OHLCV data
            
        Returns:
            Tuple of (sequences, scaled_data)
        """
        try:
            # Extract closing prices
            close_prices = df['Close'].values.reshape(-1, 1)
            self.original_close_prices = close_prices.copy()
            
            # Normalize using MinMaxScaler (0 to 1)
            self.scaled_data = self.scaler.fit_transform(close_prices)
            
            logger.info(f"Data normalized. Shape: {self.scaled_data.shape}")
            return self.scaled_data
            
        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            raise
        
        return self.scaled_data, self.scaler
    
    def create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for LSTM training
        Uses sliding window of size 'window_size'
        
        Args:
            data: Normalized price data
            
        Returns:
            Tuple of (X sequences, y targets)
        """
        X, y = [], []
        
        for i in range(len(data) - self.window_size):
            X.append(data[i:i + self.window_size])
            y.append(data[i + self.window_size])
        
        X, y = np.array(X), np.array(y)
        logger.info(f"Created sequences. X shape: {X.shape}, y shape: {y.shape}")
        
        return X, y
    
    def inverse_transform(self, scaled_prices: np.ndarray) -> np.ndarray:
        """
        Convert scaled predictions back to original price range
        
        Args:
            scaled_prices: Normalized predictions
            
        Returns:
            Original price scale values
        """
        return self.scaler.inverse_transform(scaled_prices)
    
    def get_last_sequence(self, data: np.ndarray) -> np.ndarray:
        """
        Get the last 'window_size' days for making next prediction
        
        Args:
            data: Normalized historical data
            
        Returns:
            Last sequence ready for prediction
        """
        return data[-self.window_size:].reshape(1, self.window_size, 1)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get data engine summary information"""
        return {
            "window_size": self.window_size,
            "scaler_range": (0, 1),
            "data_points": len(self.scaled_data) if self.scaled_data is not None else 0
        }
