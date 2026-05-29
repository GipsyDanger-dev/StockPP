import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

NUM_FEATURES = 6  # Close, Volume, MA20, MA50, RSI, MACD


class DataEngine:
    """
    Handles stock data fetching, cleaning, normalization and sequence creation
    with technical indicators for improved LSTM prediction.
    Uses per-feature StandardScaler for better signal preservation.
    """

    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self.feature_scalers: List[StandardScaler] = [StandardScaler() for _ in range(NUM_FEATURES)]
        self.close_scaler: Optional[StandardScaler] = None
        self.original_close_prices = None
        self.scaled_data = None
        self.feature_columns = ['Close', 'Volume', 'MA20', 'MA50', 'RSI', 'MACD']

    def fetch_data(self, ticker: str, period: str = "5y") -> pd.DataFrame:
        """Fetch historical stock data using yfinance. Finnhub free tier doesn't support historical candles."""
        try:
            import yfinance as yf

            logger.info(f"Fetching historical data for {ticker} with period {period}")
            stock = yf.Ticker(ticker)
            df = stock.history(period=period)

            if df is None or df.empty:
                raise ValueError(f"No data found for ticker {ticker}")

            required_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
            for col in required_cols:
                if col not in df.columns:
                    raise ValueError(f"Missing column: {col}")

            df = df[required_cols].copy()
            df.index = pd.to_datetime(df.index)
            df = df.sort_index()

            logger.info(f"Successfully fetched {len(df)} days of data for {ticker}")
            return df
        except Exception as e:
            logger.error(f"Error fetching data: {str(e)}")
            raise

    def _add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators: MA20, MA50, RSI (14-day), MACD (12/26 EMA).
        """
        df = df.copy()

        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['MA50'] = df['Close'].rolling(window=50).mean()

        # RSI (14-day)
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        # MACD (12-day EMA - 26-day EMA)
        ema12 = df['Close'].ewm(span=12, adjust=False).mean()
        ema26 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = ema12 - ema26

        df['Volume'] = df['Volume'].replace(0, 1)  # Avoid division by zero

        df = df.dropna()

        return df

    def prepare_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[StandardScaler]]:
        """Preprocess data: add technical indicators, normalize per-feature, return data + scalers"""
        try:
            df = self._add_technical_indicators(df)

            self.original_close_prices = df['Close'].values.copy()

            feature_data = df[self.feature_columns].values

            scaled_columns = []
            for i in range(NUM_FEATURES):
                col_scaled = self.feature_scalers[i].fit_transform(
                    feature_data[:, i].reshape(-1, 1)
                )
                scaled_columns.append(col_scaled.flatten())

            self.scaled_data = np.column_stack(scaled_columns)
            self.close_scaler = self.feature_scalers[0]

            logger.info(f"Data normalized with {NUM_FEATURES} per-feature scalers. Shape: {self.scaled_data.shape}")

            return self.scaled_data, self.feature_scalers

        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            raise

    def create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM training. Input: [samples, time_steps, features]. Target: Close price (index 0)."""
        X, y = [], []

        if len(data) <= self.window_size:
            raise ValueError(f"Data too short ({len(data)}) for window_size ({self.window_size})")

        for i in range(len(data) - self.window_size):
            X.append(data[i:i + self.window_size])
            y.append(data[i + self.window_size, 0])

        X = np.array(X)
        y = np.array(y)

        logger.info(f"Created sequences. X shape: {X.shape}, y shape: {y.shape}")
        return X, y

    def inverse_transform_price(self, scaled_prices: np.ndarray) -> np.ndarray:
        """Convert scaled price predictions back to original scale"""
        if self.close_scaler is None:
            raise ValueError("Close scaler not fitted. Call prepare_data() first.")
        return self.close_scaler.inverse_transform(scaled_prices.reshape(-1, 1)).flatten()

    def get_last_sequence(self, data: np.ndarray) -> np.ndarray:
        """Get the last 'window_size' days for making next prediction"""
        if len(data) < self.window_size:
            raise ValueError("Data provided is shorter than window size")

        return data[-self.window_size:].reshape(1, self.window_size, NUM_FEATURES)

    def get_summary(self) -> Dict[str, Any]:
        """Get data engine summary information"""
        return {
            "window_size": self.window_size,
            "num_features": NUM_FEATURES,
            "features": self.feature_columns,
            "scaler_range": (0, 1),
            "data_points": len(self.scaled_data) if self.scaled_data is not None else 0
        }
