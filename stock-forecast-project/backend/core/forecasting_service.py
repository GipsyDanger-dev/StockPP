import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)

try:
    from .data_engine import DataEngine, NUM_FEATURES
    from .model_manager import ModelManager
    HAS_ML_DEPENDENCIES = True
except Exception as e:
    logger.warning(f"ML dependencies not available: {str(e)}")
    HAS_ML_DEPENDENCIES = False


def _error_response(ticker: str, message: str) -> Dict:
    return {
        "ticker": ticker,
        "status": "error",
        "message": message,
        "current_price": None,
        "historical": [],
        "forecast": [],
        "indicators": {"rsi": None, "ma20": None, "ma50": None, "macd": None},
        "historical_indicators": [],
        "metrics": {"rmse": None, "mae": None},
        "trend": None,
        "change_percent": None,
        "timestamp": datetime.now().isoformat(),
        "model_source": "none"
    }


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
            self._cache_max_size = 128
        except Exception as e:
            logger.warning(f"Error initializing ML components: {str(e)}")
            self.data_engine = None
            self.model_manager = None

    def _evict_expired_cache(self):
        now = datetime.now()
        expired = [k for k, v in self.cache.items() if (now - v['timestamp']).total_seconds() / 3600 >= 1]
        for k in expired:
            del self.cache[k]

    def predict(self, ticker: str, days_ahead: int = 5, period: str = "1y", user_id: str = None) -> Dict:
        try:
            ticker_upper = ticker.upper()

            # Check cache (1 hour TTL)
            cache_key = f"{ticker_upper}_{period}_{days_ahead}"
            self._evict_expired_cache()
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                cache_age = (datetime.now() - cached_data['timestamp']).total_seconds() / 3600
                if cache_age < 1:
                    logger.info(f"Using cached forecast for {ticker_upper}")
                    return cached_data['data']

            model, saved_scaler = None, None
            feature_scaler = None
            if self.model_manager:
                model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                feature_scaler = self.model_manager.load_feature_scaler(ticker_upper)

            needs_retrain = model is None or saved_scaler is None or feature_scaler is None
            if needs_retrain:
                reason = "feature scaler missing" if (model and saved_scaler) else "model not found"
                logger.info(f"Model for {ticker_upper} needs retrain ({reason}). Auto-training 70 epochs...")
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
                        feature_scaler = self.model_manager.load_feature_scaler(ticker_upper)
                    else:
                        msg = result.get('error', 'Auto-training failed')
                        logger.warning(f"Auto-training failed for {ticker_upper}: {msg}")
                        return _error_response(ticker_upper, msg)
                except Exception as train_error:
                    logger.error(f"Error during auto-training {ticker_upper}: {str(train_error)}")
                    return _error_response(ticker_upper, f"Training error: {str(train_error)}")

            if model is None or saved_scaler is None:
                return _error_response(ticker_upper, "Model not available after training")

            if feature_scaler is None:
                return _error_response(ticker_upper, "Feature scaler not available. Retrain the model.")

            logger.info(f"Model ready for {ticker_upper}. Starting prediction...")

            df = self.data_engine.fetch_data(ticker_upper, period=period)
            if df is None or len(df) < 70:
                return _error_response(ticker_upper, f"Insufficient data for {ticker_upper}")

            df_with_indicators = self.data_engine._add_technical_indicators(df)

            if len(df_with_indicators) < 25:
                return _error_response(ticker_upper, f"Insufficient data after computing indicators for {ticker_upper}")

            # Extract features and scale using the SAVED feature scaler from training
            feature_data = df_with_indicators[self.data_engine.feature_columns].values
            scaled_features = feature_scaler.transform(feature_data)

            current_price = float(df_with_indicators['Close'].iloc[-1])
            last_date = df_with_indicators.index[-1]

            historical_dates = [d.strftime("%Y-%m-%d") for d in df_with_indicators.index[-20:]]
            historical_prices = df_with_indicators['Close'].iloc[-20:].tolist()

            historical_rsi = df_with_indicators['RSI'].iloc[-20:].tolist()
            historical_ma20 = df_with_indicators['MA20'].iloc[-20:].tolist()
            historical_ma50 = df_with_indicators['MA50'].iloc[-20:].tolist()
            historical_macd = df_with_indicators['MACD'].iloc[-20:].tolist()

            current_rsi = float(df_with_indicators['RSI'].iloc[-1])
            current_ma20 = float(df_with_indicators['MA20'].iloc[-1])
            current_ma50 = float(df_with_indicators['MA50'].iloc[-1])
            current_macd = float(df_with_indicators['MACD'].iloc[-1])

            # Multi-step prediction (sliding window with multi-features)
            last_sequence = scaled_features[-20:].reshape(1, 20, NUM_FEATURES)
            future_predictions = []
            current_sequence = last_sequence.copy()

            for _ in range(days_ahead):
                next_pred = model.predict(current_sequence, verbose=0)
                pred_price_scaled = next_pred[0, 0]
                future_predictions.append(pred_price_scaled)

                new_row = current_sequence[0, -1, :].copy()
                new_row[0] = pred_price_scaled

                new_val = new_row.reshape(1, 1, NUM_FEATURES)
                current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)

            # Inverse transform: model outputs are in feature_scaler space (6 features),
            # not price_scaler space. Reconstruct 6-feature array, inverse transform, extract Close (column 0).
            pred_array = np.array(future_predictions)
            last_known_features = scaled_features[-1].copy()  # shape: (6,)
            dummy_features = np.tile(last_known_features, (len(pred_array), 1))
            dummy_features[:, 0] = pred_array  # Replace Close column with predictions
            original_features = feature_scaler.inverse_transform(dummy_features)
            future_prices = original_features[:, 0]  # Extract Close price column

            forecast_dates = [(last_date + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(days_ahead)]
            metrics = self.model_manager.get_model_metrics(ticker_upper) or {"rmse": 0, "mae": 0}

            first_forecast = future_prices[0]
            trend = "Bullish" if first_forecast > current_price else "Bearish"
            change_percent = ((first_forecast - current_price) / current_price * 100)

            response = {
                "ticker": ticker_upper,
                "status": "success",
                "current_price": round(float(current_price), 2),
                "historical": [{"date": d, "price": round(float(p), 2)} for d, p in zip(historical_dates, historical_prices)],
                "forecast": [{"date": d, "price": round(float(p), 2)} for d, p in zip(forecast_dates, future_prices)],
                "indicators": {
                    "rsi": round(current_rsi, 2),
                    "ma20": round(current_ma20, 2),
                    "ma50": round(current_ma50, 2),
                    "macd": round(current_macd, 4)
                },
                "historical_indicators": [
                    {
                        "date": d,
                        "rsi": round(float(r), 2),
                        "ma20": round(float(m20), 2),
                        "ma50": round(float(m50), 2),
                        "macd": round(float(mc), 4)
                    }
                    for d, r, m20, m50, mc in zip(
                        historical_dates, historical_rsi, historical_ma20, historical_ma50, historical_macd
                    )
                ],
                "metrics": {
                    "rmse": round(float(metrics.get("rmse", 0)), 4),
                    "mae": round(float(metrics.get("mae", 0)), 4)
                },
                "trend": trend,
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat(),
                "model_source": "persisted"
            }

            try:
                from core.supabase_client import insert_training_log
                insert_training_log(
                    ticker=ticker_upper,
                    report_name=f"Forecast for {ticker_upper}",
                    rmse=round(float(metrics.get("rmse", 0)), 4),
                    mae=round(float(metrics.get("mae", 0)), 4),
                    status="Completed"
                )
            except Exception as log_err:
                logger.warning(f"Could not save prediction log: {str(log_err)}")

            # Save to prediction history if user_id provided
            if user_id:
                try:
                    from core.supabase_client import insert_prediction
                    insert_prediction(
                        user_id=user_id,
                        ticker=ticker_upper,
                        current_price=round(float(current_price), 2),
                        predicted_prices=[{"date": d, "price": round(float(p), 2)} for d, p in zip(forecast_dates, future_prices)],
                        trend=trend,
                        predicted_change_percent=round(float(change_percent), 2),
                        days_ahead=days_ahead
                    )
                except Exception as pred_err:
                    logger.warning(f"Could not save prediction history: {str(pred_err)}")

            if len(self.cache) >= self._cache_max_size:
                oldest_key = min(self.cache, key=lambda k: self.cache[k]['timestamp'])
                del self.cache[oldest_key]
            self.cache[cache_key] = {'data': response, 'timestamp': datetime.now()}
            return response

        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            return _error_response(ticker, f"Prediction error: {str(e)}")

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
