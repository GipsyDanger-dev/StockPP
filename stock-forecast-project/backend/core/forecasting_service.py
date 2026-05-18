"""
Forecasting Service - Main prediction orchestrator
Uses multi-feature LSTM with 20-day window
Features: Close, Volume, MA20, MA50, RSI, MACD
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)

try:
    from .data_engine import DataEngine, NUM_FEATURES
    from .model import LSTMModel
    from .model_manager import ModelManager
    HAS_ML_DEPENDENCIES = True
except Exception as e:
    logger.warning(f"ML dependencies not available: {str(e)}")
    HAS_ML_DEPENDENCIES = False


class ForecastingService:
    def __init__(self, model_manager: Optional[ModelManager] = None):
        try:
            if HAS_ML_DEPENDENCIES:
                self.data_engine = DataEngine(window_size=20)
                self.model_manager = model_manager or ModelManager()
            else:
                self.data_engine = None
                self.model_manager = None
            self.cache = {}
        except Exception as e:
            logger.warning(f"Error initializing ML components: {str(e)}")
            self.data_engine = None
            self.model_manager = None

    def predict(self, ticker: str, days_ahead: int = 5, period: str = "1y") -> Dict:
        try:
            ticker_upper = ticker.upper()

            # 1. Check Cache
            cache_key = f"{ticker_upper}_{period}_{days_ahead}"
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                cache_age = (datetime.now() - cached_data['timestamp']).total_seconds() / 3600
                if cache_age < 1:
                    logger.info(f"Using cached forecast for {ticker_upper}")
                    return cached_data['data']

            # 2. Load Model AND Scaler
            model, saved_scaler = None, None
            if self.model_manager:
                model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)

            # 3. AUTO-TRAINING: Train if no model exists
            if model is None or saved_scaler is None:
                logger.info(f"Model for {ticker_upper} not found. Auto-training 70 epochs...")
                try:
                    from .retraining_orchestrator import RetrainingOrchestrator
                    orchestrator = RetrainingOrchestrator(self.model_manager)
                    result = orchestrator.retrain_model(
                        ticker=ticker_upper,
                        period="5y",
                        epochs=70,
                        force_retrain=True
                    )
                    if result["status"] == "success":
                        logger.info(f"Auto-training success for {ticker_upper}! RMSE: {result['new_metrics']['rmse']:.4f}")
                        model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                    else:
                        logger.warning(f"Auto-training failed: {result.get('error', 'unknown')}. Using mock data.")
                        return self._generate_mock_forecast(ticker_upper, days_ahead)
                except Exception as train_error:
                    logger.error(f"Error during auto-training {ticker_upper}: {str(train_error)}")
                    return self._generate_mock_forecast(ticker_upper, days_ahead)

            if model is None or saved_scaler is None:
                logger.warning(f"Model/scaler still None after auto-training for {ticker_upper}")
                return self._generate_mock_forecast(ticker_upper, days_ahead)

            logger.info(f"Model ready for {ticker_upper}. Starting prediction...")

            # 4. Fetch fresh data from Finnhub
            df = self.data_engine.fetch_data(ticker_upper, period=period)
            if df is None or len(df) < 70:
                return self._generate_mock_forecast(ticker_upper, days_ahead)

            # 5. Add technical indicators and prepare multi-feature data
            df_with_indicators = self.data_engine._add_technical_indicators(df)

            if len(df_with_indicators) < 25:
                return self._generate_mock_forecast(ticker_upper, days_ahead)

            # Extract features and scale
            feature_data = df_with_indicators[self.data_engine.feature_columns].values
            scaled_features = self.data_engine.feature_scaler.fit_transform(feature_data)

            current_price = float(df_with_indicators['Close'].iloc[-1])
            last_date = df_with_indicators.index[-1]

            # Historical data for chart (last 20 days)
            historical_dates = [d.strftime("%Y-%m-%d") for d in df_with_indicators.index[-20:]]
            historical_prices = df_with_indicators['Close'].iloc[-20:].tolist()

            # 6. Multi-step prediction (sliding window with multi-features)
            last_sequence = scaled_features[-20:].reshape(1, 20, NUM_FEATURES)
            future_predictions = []
            current_sequence = last_sequence.copy()

            for _ in range(days_ahead):
                next_pred = model.predict(current_sequence, verbose=0)
                pred_price_scaled = next_pred[0, 0]
                future_predictions.append(pred_price_scaled)

                # Create new feature row (use last known values for non-price features)
                new_row = current_sequence[0, -1, :].copy()
                new_row[0] = pred_price_scaled  # Update Close price

                # Shift sequence
                new_val = new_row.reshape(1, 1, NUM_FEATURES)
                current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)

            # 7. Inverse transform predictions
            future_prices = saved_scaler.inverse_transform(
                np.array(future_predictions).reshape(-1, 1)
            ).flatten()

            # 8. Generate Response
            forecast_dates = [(last_date + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(days_ahead)]
            metrics = self.model_manager.get_model_metrics(ticker_upper) or {"rmse": 0, "mae": 0}

            first_forecast = future_prices[0]
            trend = "Bullish" if first_forecast > current_price else "Bearish"
            change_percent = ((first_forecast - current_price) / current_price * 100)

            response = {
                "ticker": ticker_upper,
                "current_price": round(float(current_price), 2),
                "historical": [{"date": d, "price": round(float(p), 2)} for d, p in zip(historical_dates, historical_prices)],
                "forecast": [{"date": d, "price": round(float(p), 2)} for d, p in zip(forecast_dates, future_prices)],
                "metrics": {
                    "rmse": round(float(metrics.get("rmse", 0)), 4),
                    "mae": round(float(metrics.get("mae", 0)), 4)
                },
                "trend": trend,
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat(),
                "model_source": "persisted"
            }

            # Cache result
            self.cache[cache_key] = {'data': response, 'timestamp': datetime.now()}
            return response

        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            return self._generate_mock_forecast(ticker, days_ahead)

    def _generate_mock_forecast(self, ticker: str, days_ahead: int = 5) -> Dict:
        """Generate mock forecast when real model is not available"""
        current_price = 150.0 + (hash(ticker) % 100)

        historical_dates = []
        historical_prices = []
        base_date = datetime.now()

        for i in range(20, 0, -1):
            date = base_date - timedelta(days=i)
            historical_dates.append(date.strftime("%Y-%m-%d"))
            price = current_price * (0.95 + (i % 10) * 0.01)
            historical_prices.append(float(price))

        forecast_dates = []
        forecast_prices = []
        trend_direction = 1 if (hash(ticker) % 2) else -1

        for i in range(1, days_ahead + 1):
            date = base_date + timedelta(days=i)
            forecast_dates.append(date.strftime("%Y-%m-%d"))
            forecast_price = current_price * (1 + trend_direction * 0.02 * i + (i % 3) * 0.01)
            forecast_prices.append(float(forecast_price))

        rmse = 2.5
        mae = 1.8
        first_forecast = forecast_prices[0]
        trend = "Bullish" if first_forecast > current_price else "Bearish"
        change_percent = ((first_forecast - current_price) / current_price * 100)

        response = {
            "ticker": ticker,
            "current_price": float(current_price),
            "historical": [{"date": date, "price": float(price)} for date, price in zip(historical_dates, historical_prices)],
            "forecast": [{"date": date, "price": float(price)} for date, price in zip(forecast_dates, forecast_prices)],
            "metrics": {"rmse": float(rmse), "mae": float(mae), "accuracy": float(100 - mae)},
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
