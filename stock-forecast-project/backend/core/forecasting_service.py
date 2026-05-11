"""
Forecasting Service - Orchestrates predictions using DataEngine and LSTM Model
With model persistence and automatic retraining
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)

try:
    from .data_engine import DataEngine
    from .model import LSTMModel
    from .model_manager import ModelManager
    HAS_ML_DEPENDENCIES = True
except Exception as e:
    logger.warning(f"ML dependencies not available: {str(e)}")
    HAS_ML_DEPENDENCIES = False


class ForecastingService:
    """Service to handle stock price forecasting with persistence"""
    
    def __init__(self, model_manager: Optional[ModelManager] = None):
        """Initialize forecasting service with model manager"""
        try:
            if HAS_ML_DEPENDENCIES:
                self.data_engine = DataEngine()
                self.model_manager = model_manager or ModelManager()
            else:
                self.data_engine = None
                self.model_manager = None
            self.cache = {}  # Simple cache for performance
        except Exception as e:
            logger.warning(f"Error initializing ML components: {str(e)}")
            self.data_engine = None
            self.model_manager = None
        
    def predict(self, ticker: str, days_ahead: int = 5, period: str = "1y") -> Dict:
        """
        Generate price forecast for a stock ticker
        Uses cached models when available to reduce latency
        
        Args:
            ticker: Stock ticker symbol
            days_ahead: Number of days to forecast
            period: Historical period to fetch ("1m", "3m", "6m", "1y", "2y", "5y")
            
        Returns:
            Dictionary with forecast data and metrics
        """
        try:
            ticker_upper = ticker.upper()
            
            # Check cache first
            cache_key = f"{ticker_upper}_{period}_{days_ahead}"
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                # Use cache if less than 1 hour old
                cache_age = (datetime.now() - cached_data['timestamp']).total_seconds() / 3600
                if cache_age < 1:
                    logger.info(f"Using cached forecast for {ticker_upper}")
                    return cached_data['data']
            
            # Try to load pre-trained model
            model = None
            if self.model_manager and self.model_manager.model_exists(ticker_upper):
                logger.info(f"Loading persisted model for {ticker_upper}")
                model = self.model_manager.load_model(ticker_upper)
            
            if model is None:
                logger.info(f"No persisted model for {ticker_upper}, using mock data")
                return self._generate_mock_forecast(ticker_upper, days_ahead)
            
            # Generate real forecast with loaded model
            logger.info(f"Generating forecast for {ticker_upper} with loaded model")
            
            # Fetch data
            df = self.data_engine.fetch_data(ticker_upper, period=period)
            if df is None or len(df) < 70:
                logger.warning(f"Insufficient data for {ticker_upper}, using mock")
                return self._generate_mock_forecast(ticker_upper, days_ahead)
            
            # Prepare data and generate forecast
            scaled_data, scaler = self.data_engine.prepare_data(df)
            X, y = self.data_engine.create_sequences(scaled_data)
            
            current_price = float(df['Close'].iloc[-1])
            last_date = df.index[-1]
            
            # Generate historical data
            historical_dates = [d.strftime("%Y-%m-%d") for d in df.index[-20:]]
            historical_prices = df['Close'].iloc[-20:].tolist()
            
            # Get last sequence for predictions
            last_sequence = self.data_engine.get_last_sequence(scaled_data)
            
            # Generate future predictions
            future_predictions = []
            current_sequence = last_sequence.copy()
            
            for _ in range(days_ahead):
                next_pred = model.predict(np.array([current_sequence]), verbose=0)[0, 0]
                future_predictions.append(next_pred)
                current_sequence = np.append(current_sequence[1:], next_pred)
            
            # Inverse transform
            future_prices = self.data_engine.inverse_transform(
                np.array(future_predictions).reshape(-1, 1), scaler
            ).flatten()
            
            # Generate forecast dates
            forecast_dates = [
                (last_date + timedelta(days=i+1)).strftime("%Y-%m-%d")
                for i in range(days_ahead)
            ]
            
            # Get model metrics if available
            metrics = self.model_manager.get_model_metrics(ticker_upper)
            if not metrics:
                metrics = {"rmse": 0, "mae": 0, "accuracy": 0}
            
            # Calculate trend
            first_forecast = future_prices[0]
            trend = "Bullish" if first_forecast > current_price else "Bearish"
            change_percent = ((first_forecast - current_price) / current_price * 100)
            
            # Build response
            response = {
                "ticker": ticker_upper,
                "current_price": float(current_price),
                "historical": [
                    {"date": date, "price": float(price)}
                    for date, price in zip(historical_dates, historical_prices)
                ],
                "forecast": [
                    {"date": date, "price": float(price)}
                    for date, price in zip(forecast_dates, future_prices)
                ],
                "metrics": {
                    "rmse": float(metrics.get("rmse", 0)),
                    "mae": float(metrics.get("mae", 0)),
                    "accuracy": float(metrics.get("accuracy", 0))
                },
                "trend": trend,
                "change_percent": float(change_percent),
                "timestamp": datetime.now().isoformat(),
                "model_source": "persisted"
            }
            
            # Cache result
            self.cache[cache_key] = {'data': response, 'timestamp': datetime.now()}
            
            return response
            
        except Exception as e:
            logger.warning(f"Error generating real forecast for {ticker}: {str(e)}, using mock")
            return self._generate_mock_forecast(ticker, days_ahead)
    
    def get_metrics(self, ticker: str) -> Dict:
        """Get model metrics for a ticker"""
        try:
            ticker = ticker.upper()
            if self.model_manager:
                metrics = self.model_manager.get_model_metrics(ticker)
                if metrics:
                    return metrics
            
            # Return default metrics if no persisted model
            return {
                "rmse": 0,
                "mae": 0,
                "accuracy": 0,
                "last_updated": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error getting metrics: {str(e)}")
            raise
    
    def _generate_mock_forecast(self, ticker: str, days_ahead: int = 5) -> Dict:
        """Generate mock forecast when real model is not available"""
        # Generate mock data for demonstration
        current_price = 150.0 + (hash(ticker) % 100)  # Pseudo-random based on ticker
        
        # Generate historical prices (last 20 days)
        historical_dates = []
        historical_prices = []
        base_date = datetime.now()
        
        for i in range(20, 0, -1):
            date = base_date - timedelta(days=i)
            historical_dates.append(date.strftime("%Y-%m-%d"))
            # Add some variation
            price = current_price * (0.95 + (i % 10) * 0.01)
            historical_prices.append(float(price))
        
        # Generate forecast prices
        forecast_dates = []
        forecast_prices = []
        
        trend_direction = 1 if (hash(ticker) % 2) else -1
        
        for i in range(1, days_ahead + 1):
            date = base_date + timedelta(days=i)
            forecast_dates.append(date.strftime("%Y-%m-%d"))
            # Simple trend with noise
            forecast_price = current_price * (1 + trend_direction * 0.02 * i + (i % 3) * 0.01)
            forecast_prices.append(float(forecast_price))
        
        # Calculate metrics
        rmse = 2.5  # Mock RMSE
        mae = 1.8   # Mock MAE
        
        # Calculate trend
        first_forecast = forecast_prices[0]
        trend = "Bullish" if first_forecast > current_price else "Bearish"
        change_percent = ((first_forecast - current_price) / current_price * 100)
        
        # Build response
        response = {
            "ticker": ticker,
            "current_price": float(current_price),
            "historical": [
                {"date": date, "price": float(price)}
                for date, price in zip(historical_dates, historical_prices)
            ],
            "forecast": [
                {"date": date, "price": float(price)}
                for date, price in zip(forecast_dates, forecast_prices)
            ],
            "metrics": {
                "rmse": float(rmse),
                "mae": float(mae),
                "accuracy": float(100 - mae)
            },
            "trend": trend,
            "change_percent": float(change_percent),
            "timestamp": datetime.now().isoformat(),
            "model_source": "mock"
        }
        
        logger.info(f"Generated mock forecast for {ticker}: trend={trend}, change={change_percent:.2f}%")
        return response
    
    def validate_ticker(self, ticker: str) -> Dict:
        """Validate if ticker exists and has data"""
        try:
            df = self.data_engine.fetch_data(ticker, period="1mo")
            valid = df is not None and len(df) > 0
            return {
                "ticker": ticker,
                "valid": valid,
                "message": "Ticker is valid" if valid else "Ticker not found or no data available"
            }
        except Exception as e:
            logger.error(f"Error validating ticker: {str(e)}")
            return {
                "ticker": ticker,
                "valid": False,
                "message": f"Error: {str(e)}"
            }
