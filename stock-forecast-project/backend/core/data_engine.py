import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Tuple, Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

NUM_FEATURES = 18


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
        self.feature_columns = ['Close', 'Volume', 'MA20', 'MA50', 'RSI', 'MACD', 'EWMA20', 'BB_Width', 'ATR', 'OBV_norm', 'ROC', 'SP500', 'VIX', 'TNX', 'RET_1D', 'RET_5D', 'VOL_RATIO', 'MA_RATIO']

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

            # Fetch market context: S&P 500, VIX, 10Y Treasury yield
            # Strip timezone from stock index to avoid EDT/EST mismatch
            df.index = df.index.tz_localize(None)
            market_tickers = {'^GSPC': 'SP500', '^VIX': 'VIX', '^TNX': 'TNX'}
            for mkt_ticker, col_name in market_tickers.items():
                try:
                    mkt = yf.Ticker(mkt_ticker)
                    mkt_df = mkt.history(period=period)[['Close']].rename(columns={'Close': col_name})
                    mkt_df.index = pd.to_datetime(mkt_df.index).tz_localize(None)
                    df = df.join(mkt_df, how='left')
                    df[col_name] = df[col_name].ffill().bfill()
                    logger.info(f"Fetched {col_name} ({mkt_ticker}): {len(mkt_df)} points")
                except Exception as mkt_err:
                    logger.warning(f"Failed to fetch {col_name}: {mkt_err}")
                    df[col_name] = 0.0

            logger.info(f"Successfully fetched {len(df)} days of data for {ticker}")
            return df
        except Exception as e:
            logger.error(f"Error fetching data: {str(e)}")
            raise ValueError("Market API is currently down or undergoing maintenance.")

    def _add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add technical indicators: MA20, MA50, RSI (14-day), MACD (12/26 EMA).
        """
        df = df.copy()

        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['MA50'] = df['Close'].rolling(window=50).mean()

        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        ema12 = df['Close'].ewm(span=12, adjust=False).mean()
        ema26 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = ema12 - ema26

        df['EWMA20'] = df['Close'].ewm(span=20, adjust=False).mean()

        bb_mid = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        bb_upper = bb_mid + 2 * bb_std
        bb_lower = bb_mid - 2 * bb_std
        df['BB_Width'] = (bb_upper - bb_lower) / bb_mid  # Normalized width

        high_low = df['High'] - df['Low']
        high_close = (df['High'] - df['Close'].shift()).abs()
        low_close = (df['Low'] - df['Close'].shift()).abs()
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['ATR'] = true_range.rolling(window=14).mean()

        # Forward-fill zero-volume days (holidays/stale data on IDX) before OBV
        df['Volume'] = df['Volume'].replace(0, np.nan).ffill().fillna(1)

        obv = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
        df['OBV_norm'] = (obv - obv.rolling(20).mean()) / obv.rolling(20).std()

        df['ROC'] = ((df['Close'] - df['Close'].shift(12)) / df['Close'].shift(12)) * 100

        df['RET_1D'] = df['Close'].pct_change(1)
        df['RET_5D'] = df['Close'].pct_change(5)
        daily_ret = df['Close'].pct_change()
        vol_20 = daily_ret.rolling(20).std()
        vol_60 = daily_ret.rolling(60).std()
        df['VOL_RATIO'] = vol_20 / vol_60.replace(0, np.nan)
        df['MA_RATIO'] = df['Close'] / df['MA20']

        df = df.dropna()

        return df

    def prepare_data(self, df: pd.DataFrame, split_index: int = None) -> Tuple[np.ndarray, List[StandardScaler]]:
        """Preprocess data: add technical indicators, normalize per-feature, return data + scalers.

        Args:
            df: Raw OHLCV DataFrame
            split_index: If provided, fit scalers only on data[:split_index] to prevent
                         data leakage. All data is transformed, but scaler parameters
                         come from training data only.
        """
        try:
            df = self._add_technical_indicators(df)

            self.original_close_prices = df['Close'].values.copy()

            feature_data = df[self.feature_columns].values

            scaled_columns = []
            for i in range(NUM_FEATURES):
                col = feature_data[:, i].reshape(-1, 1)
                if split_index is not None and split_index < len(col):
                    # Fit on training data only, transform all data
                    self.feature_scalers[i].fit(col[:split_index])
                    col_scaled = self.feature_scalers[i].transform(col)
                else:
                    col_scaled = self.feature_scalers[i].fit_transform(col)
                scaled_columns.append(col_scaled.flatten())

            self.scaled_data = np.column_stack(scaled_columns)
            self.close_scaler = self.feature_scalers[0]

            logger.info(f"Data normalized with {NUM_FEATURES} per-feature scalers. Shape: {self.scaled_data.shape}"
                        + (f" (scalers fitted on first {split_index} rows)" if split_index else ""))

            return self.scaled_data, self.feature_scalers

        except Exception as e:
            logger.error(f"Error preparing data: {str(e)}")
            raise

    def create_sequences(self, data: np.ndarray, original_close: np.ndarray = None) -> Tuple[np.ndarray, np.ndarray]:
        """Create sequences for LSTM training. Input: [samples, time_steps, features].
        Target: next-day return computed from ORIGINAL (unscaled) Close prices.
        original_close: the raw Close prices aligned with data rows. If None, falls back
        to self.original_close_prices set during prepare_data().
        """
        X, y = [], []

        if len(data) <= self.window_size:
            raise ValueError(f"Data too short ({len(data)}) for window_size ({self.window_size})")

        prices = original_close if original_close is not None else self.original_close_prices
        if prices is None or len(prices) != len(data):
            raise ValueError("original_close prices required for return computation")

        for i in range(len(data) - self.window_size):
            X.append(data[i:i + self.window_size])
            close_current = prices[i + self.window_size - 1]
            close_next = prices[i + self.window_size]
            if close_current != 0:
                ret = (close_next - close_current) / close_current
            else:
                ret = 0.0
            y.append(ret)

        X = np.array(X)
        y = np.array(y)

        logger.info(f"Created sequences. X shape: {X.shape}, y shape: {y.shape} (target=returns)")
        return X, y

    def inverse_transform_price(self, scaled_prices: np.ndarray) -> np.ndarray:
        if self.close_scaler is None:
            raise ValueError("Close scaler not fitted. Call prepare_data() first.")
        return self.close_scaler.inverse_transform(scaled_prices.reshape(-1, 1)).flatten()

    def get_last_sequence(self, data: np.ndarray) -> np.ndarray:
        if len(data) < self.window_size:
            raise ValueError("Data provided is shorter than window size")

        return data[-self.window_size:].reshape(1, self.window_size, NUM_FEATURES)

    def get_summary(self) -> Dict[str, Any]:
        return {
            "window_size": self.window_size,
            "num_features": NUM_FEATURES,
            "features": self.feature_columns,
            "scaler_range": (0, 1),
            "data_points": len(self.scaled_data) if self.scaled_data is not None else 0
        }
