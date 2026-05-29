import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

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
        "indicators": {"rsi": None, "ma20": None, "ma50": None, "macd": None, "ewma20": None},
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
                self.data_engine = DataEngine(window_size=30)
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

    def predict(self, ticker: str, days_ahead: int = 5, period: str = "1y", user_id: str = None, progress=None) -> Dict:
        try:
            ticker_upper = ticker.upper()

            # Check cache (1 hour TTL)
            cache_key = f"{ticker_upper}_{period}_{days_ahead}"
            self._evict_expired_cache()
            if progress:
                progress.emit_sync("step", {"step": "cache_check", "label": "Checking prediction cache...", "status": "running"})
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                cache_age = (datetime.now() - cached_data['timestamp']).total_seconds() / 3600
                if cache_age < 1:
                    logger.info(f"Using cached forecast for {ticker_upper}")
                    if progress:
                        progress.emit_sync("step", {"step": "cache_check", "label": "Cache hit", "status": "done"})
                        progress.emit_sync("complete", cached_data['data'])
                    return cached_data['data']

            model, saved_scaler = None, None
            feature_scalers = None
            if self.model_manager:
                if progress:
                    progress.emit_sync("step", {"step": "loading_model", "label": "Loading prediction model...", "status": "running"})
                model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                feature_scalers = self.model_manager.load_feature_scalers(ticker_upper)

            needs_retrain = model is None or saved_scaler is None or feature_scalers is None
            if needs_retrain:
                reason = "feature scalers missing" if (model and saved_scaler) else "model not found"
                logger.info(f"Model for {ticker_upper} needs retrain ({reason}). Auto-training 70 epochs...")
                if progress:
                    progress.emit_sync("step", {"step": "auto_train", "label": f"No model found for {ticker_upper} - starting training...", "status": "running"})
                try:
                    from .retraining_orchestrator import RetrainingOrchestrator
                    orchestrator = RetrainingOrchestrator(self.model_manager)
                    result = orchestrator.retrain_model(
                        ticker=ticker_upper,
                        period="2y",
                        epochs=100,
                        force_retrain=True,
                        progress=progress
                    )
                    if result["status"] == "success":
                        logger.info(f"Auto-training success for {ticker_upper}! RMSE: ${result['new_metrics']['rmse']:.2f}")
                        model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                        feature_scalers = self.model_manager.load_feature_scalers(ticker_upper)
                    else:
                        msg = result.get('error', 'Auto-training failed')
                        logger.warning(f"Auto-training failed for {ticker_upper}: {msg}")
                        if progress:
                            progress.emit_sync("error_event", {"message": msg})
                        return _error_response(ticker_upper, msg)
                except Exception as train_error:
                    logger.error(f"Error during auto-training {ticker_upper}: {str(train_error)}")
                    if progress:
                        progress.emit_sync("error_event", {"message": f"Training error: {str(train_error)}"})
                    return _error_response(ticker_upper, f"Training error: {str(train_error)}")

            if model is None or saved_scaler is None:
                return _error_response(ticker_upper, "Model not available after training")

            if feature_scalers is None:
                return _error_response(ticker_upper, "Feature scalers not available. Retrain the model.")

            logger.info(f"Model ready for {ticker_upper}. Starting prediction...")

            if progress:
                progress.emit_sync("step", {"step": "fetching_data", "label": f"Fetching market data for {ticker_upper}...", "status": "running"})

            df = self.data_engine.fetch_data(ticker_upper, period=period)
            if df is None or len(df) < 70:
                return _error_response(ticker_upper, f"Insufficient data for {ticker_upper}")

            if progress:
                progress.emit_sync("step", {"step": "indicators", "label": "Computing technical indicators (MA20, MA50, RSI, MACD, EWMA20)...", "status": "running"})

            df_with_indicators = self.data_engine._add_technical_indicators(df)

            if len(df_with_indicators) < 35:
                return _error_response(ticker_upper, f"Insufficient data after computing indicators for {ticker_upper}")

            if progress:
                progress.emit_sync("step", {"step": "scaling", "label": "Normalizing features...", "status": "running"})

            # Scale features using per-feature scalers from training
            feature_data = df_with_indicators[self.data_engine.feature_columns].values
            scaled_columns = []
            for i in range(NUM_FEATURES):
                col_scaled = feature_scalers[i].transform(
                    feature_data[:, i].reshape(-1, 1)
                )
                scaled_columns.append(col_scaled.flatten())
            scaled_features = np.column_stack(scaled_columns)

            current_price = float(df_with_indicators['Close'].iloc[-1])
            last_date = df_with_indicators.index[-1]

            historical_dates = [d.strftime("%Y-%m-%d") for d in df_with_indicators.index[-30:]]
            historical_prices = df_with_indicators['Close'].iloc[-30:].tolist()

            historical_rsi = df_with_indicators['RSI'].iloc[-30:].tolist()
            historical_ma20 = df_with_indicators['MA20'].iloc[-30:].tolist()
            historical_ma50 = df_with_indicators['MA50'].iloc[-30:].tolist()
            historical_macd = df_with_indicators['MACD'].iloc[-30:].tolist()
            historical_ewma20 = df_with_indicators['EWMA20'].iloc[-30:].tolist()

            current_rsi = float(df_with_indicators['RSI'].iloc[-1])
            current_ma20 = float(df_with_indicators['MA20'].iloc[-1])
            current_ma50 = float(df_with_indicators['MA50'].iloc[-1])
            current_macd = float(df_with_indicators['MACD'].iloc[-1])
            current_ewma20 = float(df_with_indicators['EWMA20'].iloc[-1])

            if progress:
                progress.emit_sync("step", {"step": "predicting", "label": f"Generating {days_ahead}-day forecast...", "status": "running"})

            # Multi-step prediction with fresh indicator recalculation
            # Model predicts returns (percentage change), not raw prices
            window = self.data_engine.window_size
            last_sequence = scaled_features[-window:].reshape(1, window, NUM_FEATURES)
            current_sequence = last_sequence.copy()

            close_scaler = feature_scalers[0]

            # Volatility-based bounds: allow 3x recent daily volatility per step
            recent_returns = df_with_indicators['Close'].pct_change().dropna().iloc[-30:]
            daily_vol = float(recent_returns.std()) if len(recent_returns) > 1 else 0.02
            max_daily_move = daily_vol * 3  # 3 sigma
            total_max_move = max_daily_move * days_ahead
            price_min = current_price * (1 - total_max_move)
            price_max = current_price * (1 + total_max_move)
            # Hard safety bounds: never more than ±60%
            price_min = max(price_min, current_price * 0.40)
            price_max = min(price_max, current_price * 1.60)

            # Rolling buffer of recent original-scale prices for indicator recalculation
            recent_prices = df_with_indicators['Close'].iloc[-50:].tolist()
            future_predictions = []
            last_price = current_price

            for step in range(days_ahead):
                next_pred = model.predict(current_sequence, verbose=0)
                pred_return = float(next_pred[0, 0])

                # Convert return to price: price[t+1] = price[t] * (1 + return)
                pred_price = last_price * (1 + pred_return)

                # Clamp to reasonable range
                pred_price = np.clip(pred_price, price_min, price_max)
                future_predictions.append(pred_price)
                last_price = pred_price

                # Update rolling price buffer
                recent_prices.append(pred_price)
                if len(recent_prices) > 100:
                    recent_prices = recent_prices[-100:]

                # Recalculate technical indicators from the updated price buffer
                prices_arr = np.array(recent_prices)

                # MA20
                if len(prices_arr) >= 20:
                    new_ma20 = float(np.mean(prices_arr[-20:]))
                else:
                    new_ma20 = float(np.mean(prices_arr))

                # MA50
                if len(prices_arr) >= 50:
                    new_ma50 = float(np.mean(prices_arr[-50:]))
                else:
                    new_ma50 = float(np.mean(prices_arr))

                # RSI (14-period)
                if len(prices_arr) >= 15:
                    deltas = np.diff(prices_arr[-15:])
                    gains = np.where(deltas > 0, deltas, 0)
                    losses = np.where(deltas < 0, -deltas, 0)
                    avg_gain = np.mean(gains)
                    avg_loss = np.mean(losses)
                    if avg_loss == 0:
                        new_rsi = 100.0
                    else:
                        rs = avg_gain / avg_loss
                        new_rsi = float(100 - (100 / (1 + rs)))
                else:
                    new_rsi = 50.0

                # MACD (EMA12 - EMA26)
                if len(prices_arr) >= 26:
                    ema12 = float(pd.Series(prices_arr).ewm(span=12, adjust=False).mean().iloc[-1])
                    ema26 = float(pd.Series(prices_arr).ewm(span=26, adjust=False).mean().iloc[-1])
                    new_macd = ema12 - ema26
                else:
                    new_macd = 0.0

                # EWMA20
                new_ewma20 = float(pd.Series(prices_arr).ewm(span=20, adjust=False).mean().iloc[-1])

                # Scale the new indicators using training scalers
                new_close_scaled = close_scaler.transform([[pred_price]])[0, 0]
                new_vol_scaled = feature_scalers[1].transform(
                    [[recent_prices[-2] if len(recent_prices) > 1 else pred_price]]
                )[0, 0]  # Volume: use last known (approximation)
                new_ma20_scaled = feature_scalers[2].transform([[new_ma20]])[0, 0]
                new_ma50_scaled = feature_scalers[3].transform([[new_ma50]])[0, 0]
                new_rsi_scaled = feature_scalers[4].transform([[new_rsi]])[0, 0]
                new_macd_scaled = feature_scalers[5].transform([[new_macd]])[0, 0]
                new_ewma20_scaled = feature_scalers[6].transform([[new_ewma20]])[0, 0]

                # Build new row with all fresh features
                new_row = np.array([new_close_scaled, new_vol_scaled, new_ma20_scaled,
                                    new_ma50_scaled, new_rsi_scaled, new_macd_scaled,
                                    new_ewma20_scaled])

                new_val = new_row.reshape(1, 1, NUM_FEATURES)
                current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)

            future_prices = np.array(future_predictions)

            # Damping for longer horizons: pull toward recent mean in original price space
            if days_ahead > 3:
                for step in range(3, days_ahead):
                    recent_mean = np.mean(future_predictions[max(0, step-3):step])
                    future_prices[step] = 0.7 * future_prices[step] + 0.3 * recent_mean

            # Clamp again after damping
            future_prices = np.clip(future_prices, price_min, price_max)

            # Generate trading days only (skip weekends)
            forecast_dates = pd.bdate_range(
                start=last_date + timedelta(days=1),
                periods=days_ahead
            ).strftime("%Y-%m-%d").tolist()
            metrics = self.model_manager.get_model_metrics(ticker_upper) or {"rmse": 0, "mae": 0}

            # Trend based on last forecast point (not first)
            last_forecast = future_prices[-1]
            trend = "Bullish" if last_forecast > current_price else "Bearish"
            change_percent = ((last_forecast - current_price) / current_price * 100)

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
                    "macd": round(current_macd, 4),
                    "ewma20": round(current_ewma20, 2)
                },
                "historical_indicators": [
                    {
                        "date": d,
                        "rsi": round(float(r), 2),
                        "ma20": round(float(m20), 2),
                        "ma50": round(float(m50), 2),
                        "macd": round(float(mc), 4),
                        "ewma20": round(float(e), 2)
                    }
                    for d, r, m20, m50, mc, e in zip(
                        historical_dates, historical_rsi, historical_ma20, historical_ma50, historical_macd, historical_ewma20
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

            if progress:
                progress.emit_sync("step", {"step": "complete", "label": "Forecast ready", "status": "done"})
                progress.emit_sync("complete", response)

            return response

        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            if progress:
                progress.emit_sync("error_event", {"message": str(e)})
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
