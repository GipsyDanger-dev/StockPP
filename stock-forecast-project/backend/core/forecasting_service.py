import logging
from typing import Dict, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

try:
    from .data_engine import DataEngine, NUM_FEATURES
    from .model_manager import ModelManager
    from .sentiment_service import SentimentService
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
        "indicators": {"rsi": None, "ma20": None, "ma50": None, "macd": None, "ewma20": None, "roc": None},
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
                self.sentiment_service = SentimentService()
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
            svm_model = None
            ensemble_weights = None
            if self.model_manager:
                if progress:
                    progress.emit_sync("step", {"step": "loading_model", "label": "Loading prediction model...", "status": "running"})
                model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                feature_scalers = self.model_manager.load_feature_scalers(ticker_upper)
                svm_model = self.model_manager.load_svm_model(ticker_upper)
                ensemble_weights = self.model_manager.get_ensemble_weights(ticker_upper)
                if svm_model:
                    logger.info(f"SVM ensemble model loaded for {ticker_upper}")

            needs_retrain = model is None or saved_scaler is None or feature_scalers is None
            if needs_retrain:
                reason = "feature scalers missing" if (model and saved_scaler) else "model not found"
                logger.info(f"Model for {ticker_upper} needs retrain ({reason}). Auto-training 100 epochs...")
                if progress:
                    progress.emit_sync("step", {"step": "auto_train", "label": f"No model found for {ticker_upper} - starting training...", "status": "running"})
                try:
                    from .retraining_orchestrator import RetrainingOrchestrator
                    orchestrator = RetrainingOrchestrator(self.model_manager)
                    result = orchestrator.retrain_model(
                        ticker=ticker_upper,
                        period="5y",
                        epochs=100,
                        force_retrain=True,
                        progress=progress
                    )
                    if result["status"] == "success":
                        logger.info(f"Auto-training success for {ticker_upper}! RMSE: ${result['new_metrics']['rmse']:.2f}")
                        model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
                        feature_scalers = self.model_manager.load_feature_scalers(ticker_upper)
                        ensemble_weights = self.model_manager.get_ensemble_weights(ticker_upper)
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
                return _error_response(ticker_upper, "Market API is currently down or undergoing maintenance.")

            if progress:
                progress.emit_sync("step", {"step": "indicators", "label": "Computing technical indicators + market context...", "status": "running"})

            df_with_indicators = self.data_engine._add_technical_indicators(df)

            if len(df_with_indicators) < 35:
                return _error_response(ticker_upper, f"Insufficient data after computing indicators for {ticker_upper}")

            if progress:
                progress.emit_sync("step", {"step": "scaling", "label": "Normalizing features...", "status": "running"})

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
            historical_roc = df_with_indicators['ROC'].iloc[-30:].tolist()

            current_rsi = float(df_with_indicators['RSI'].iloc[-1])
            current_ma20 = float(df_with_indicators['MA20'].iloc[-1])
            current_ma50 = float(df_with_indicators['MA50'].iloc[-1])
            current_macd = float(df_with_indicators['MACD'].iloc[-1])
            current_ewma20 = float(df_with_indicators['EWMA20'].iloc[-1])
            current_roc = float(df_with_indicators['ROC'].iloc[-1])
            current_sp500 = float(df_with_indicators['SP500'].iloc[-1]) if 'SP500' in df_with_indicators else 0.0
            current_vix = float(df_with_indicators['VIX'].iloc[-1]) if 'VIX' in df_with_indicators else 0.0
            current_tnx = float(df_with_indicators['TNX'].iloc[-1]) if 'TNX' in df_with_indicators else 0.0

            if progress:
                progress.emit_sync("step", {"step": "predicting", "label": f"Generating {days_ahead}-day forecast...", "status": "running"})

            window = self.data_engine.window_size
            last_sequence = scaled_features[-window:].reshape(1, window, NUM_FEATURES)
            current_sequence = last_sequence.copy()

            close_scaler = feature_scalers[0]

            recent_returns = df_with_indicators['Close'].pct_change().dropna().iloc[-30:]
            daily_vol = float(recent_returns.std()) if len(recent_returns) > 1 else 0.02
            max_daily_move = daily_vol * 3
            total_max_move = max_daily_move * days_ahead
            price_min = current_price * (1 - total_max_move)
            price_max = current_price * (1 + total_max_move)
            price_min = max(price_min, current_price * 0.40)
            price_max = min(price_max, current_price * 1.60)

            recent_prices = df_with_indicators['Close'].iloc[-50:].tolist()
            future_predictions = []
            last_price = current_price

            # Carry forward last known values for features we can't recompute
            last_known_volume = float(df_with_indicators['Volume'].iloc[-1]) if 'Volume' in df_with_indicators else 1.0
            last_known_high = float(df_with_indicators['High'].iloc[-1]) if 'High' in df_with_indicators else current_price
            last_known_low = float(df_with_indicators['Low'].iloc[-1]) if 'Low' in df_with_indicators else current_price
            last_hl_spread = last_known_high - last_known_low

            # RSI gain/loss rolling state (match training: rolling mean of gains/losses)
            rsi_gains = []
            rsi_losses = []
            if len(df_with_indicators) >= 14:
                deltas_init = df_with_indicators['Close'].diff().iloc[-14:].dropna().values
                for d in deltas_init:
                    rsi_gains.append(max(d, 0))
                    rsi_losses.append(max(-d, 0))

            use_ensemble = svm_model is not None and svm_model.is_trained and ensemble_weights and ensemble_weights.get("svm_weight", 0) > 0
            if use_ensemble:
                lstm_w = ensemble_weights.get("lstm_weight", 0.7)
                svm_w = ensemble_weights.get("svm_weight", 0.3)
                logger.info(f"Using LSTM+SVM ensemble ({lstm_w:.2f}/{svm_w:.2f}) for {ticker_upper}")

            # Market context: carry forward last known values (can't predict market indices)
            last_sp500 = float(df_with_indicators['SP500'].iloc[-1]) if 'SP500' in df_with_indicators else 0.0
            last_vix = float(df_with_indicators['VIX'].iloc[-1]) if 'VIX' in df_with_indicators else 0.0
            last_tnx = float(df_with_indicators['TNX'].iloc[-1]) if 'TNX' in df_with_indicators else 0.0

            for step in range(days_ahead):
                lstm_pred = model.predict(current_sequence, verbose=0)
                lstm_return = float(lstm_pred[0, 0])

                if use_ensemble:
                    svm_return = float(svm_model.predict(current_sequence)[0, 0])
                    pred_return = lstm_w * lstm_return + svm_w * svm_return
                else:
                    pred_return = lstm_return

                pred_price = last_price * (1 + pred_return)

                pred_price = np.clip(pred_price, price_min, price_max)
                future_predictions.append(pred_price)
                last_price = pred_price

                recent_prices.append(pred_price)
                if len(recent_prices) > 100:
                    recent_prices = recent_prices[-100:]

                prices_arr = np.array(recent_prices)

                # MA20 / MA50 — same as training: simple rolling mean
                new_ma20 = float(np.mean(prices_arr[-20:])) if len(prices_arr) >= 20 else float(np.mean(prices_arr))
                new_ma50 = float(np.mean(prices_arr[-50:])) if len(prices_arr) >= 50 else float(np.mean(prices_arr))

                # RSI — match training: rolling mean of gains/losses over 14 periods
                price_delta = pred_price - prices_arr[-2] if len(prices_arr) > 1 else 0
                rsi_gains.append(max(price_delta, 0))
                rsi_losses.append(max(-price_delta, 0))
                if len(rsi_gains) > 14:
                    rsi_gains = rsi_gains[-14:]
                    rsi_losses = rsi_losses[-14:]
                avg_gain = np.mean(rsi_gains) if rsi_gains else 0
                avg_loss = np.mean(rsi_losses) if rsi_losses else 0
                new_rsi = float(100 - (100 / (1 + avg_gain / avg_loss))) if avg_loss > 0 else 100.0

                # MACD — same as training: EMA12 - EMA26
                ema12 = float(pd.Series(prices_arr).ewm(span=12, adjust=False).mean().iloc[-1])
                ema26 = float(pd.Series(prices_arr).ewm(span=26, adjust=False).mean().iloc[-1])
                new_macd = ema12 - ema26

                # EWMA20 — same as training
                new_ewma20 = float(pd.Series(prices_arr).ewm(span=20, adjust=False).mean().iloc[-1])

                # BB Width — same as training: (upper - lower) / mid
                if len(prices_arr) >= 20:
                    bb_mid = np.mean(prices_arr[-20:])
                    bb_std = np.std(prices_arr[-20:], ddof=0)
                    bb_upper = bb_mid + 2 * bb_std
                    bb_lower = bb_mid - 2 * bb_std
                    new_bb_width = (bb_upper - bb_lower) / bb_mid if bb_mid > 0 else 0.0
                else:
                    new_bb_width = 0.0

                # ATR — approximate true range: carry forward last known spread as proxy for H-L
                # Training uses: max(H-L, |H-prevC|, |L-prevC|) rolling(14).mean()
                if len(prices_arr) >= 2:
                    simulated_tr = max(last_hl_spread, abs(last_known_high - prices_arr[-2]), abs(last_known_low - prices_arr[-2]))
                    new_atr = float(simulated_tr)
                else:
                    new_atr = float(last_hl_spread)

                # OBV — use carried-forward volume with sign of price changes
                # Training: (sign(diff(Close)) * Volume).cumsum(), then normalize
                if len(prices_arr) >= 21:
                    obv_signs = np.sign(np.diff(prices_arr[-21:]))
                    obv_raw = np.sum(obv_signs * last_known_volume)
                    obv_mean = np.mean(np.abs(obv_signs)) * last_known_volume * 10  # rough normalization
                    new_obv_norm = obv_raw / (obv_mean if obv_mean > 0 else 1.0)
                else:
                    new_obv_norm = 0.0

                # ROC — same as training: (Close - Close.shift(12)) / Close.shift(12) * 100
                if len(prices_arr) >= 13:
                    prev_price_12 = prices_arr[-13]
                    new_roc = ((pred_price - prev_price_12) / prev_price_12 * 100) if prev_price_12 != 0 else 0.0
                else:
                    new_roc = 0.0

                # Volume — carry forward with exponential decay (better than using price)
                last_known_volume *= 0.95  # 5% decay per step

                new_close_scaled = close_scaler.transform([[pred_price]])[0, 0]
                new_vol_scaled = feature_scalers[1].transform([[last_known_volume]])[0, 0]
                new_ma20_scaled = feature_scalers[2].transform([[new_ma20]])[0, 0]
                new_ma50_scaled = feature_scalers[3].transform([[new_ma50]])[0, 0]
                new_rsi_scaled = feature_scalers[4].transform([[new_rsi]])[0, 0]
                new_macd_scaled = feature_scalers[5].transform([[new_macd]])[0, 0]
                new_ewma20_scaled = feature_scalers[6].transform([[new_ewma20]])[0, 0]
                new_bb_width_scaled = feature_scalers[7].transform([[new_bb_width]])[0, 0]
                new_atr_scaled = feature_scalers[8].transform([[new_atr]])[0, 0]
                new_obv_norm_scaled = feature_scalers[9].transform([[new_obv_norm]])[0, 0]
                new_roc_scaled = feature_scalers[10].transform([[new_roc]])[0, 0]
                new_sp500_scaled = feature_scalers[11].transform([[last_sp500]])[0, 0]
                new_vix_scaled = feature_scalers[12].transform([[last_vix]])[0, 0]
                new_tnx_scaled = feature_scalers[13].transform([[last_tnx]])[0, 0]

                new_row = np.array([new_close_scaled, new_vol_scaled, new_ma20_scaled,
                                    new_ma50_scaled, new_rsi_scaled, new_macd_scaled,
                                    new_ewma20_scaled, new_bb_width_scaled, new_atr_scaled,
                                    new_obv_norm_scaled, new_roc_scaled,
                                    new_sp500_scaled, new_vix_scaled, new_tnx_scaled])

                new_val = new_row.reshape(1, 1, NUM_FEATURES)
                current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)

            future_prices = np.array(future_predictions)

            if days_ahead > 3:
                for step in range(3, days_ahead):
                    recent_mean = np.mean(future_predictions[max(0, step-3):step])
                    future_prices[step] = 0.7 * future_prices[step] + 0.3 * recent_mean

            future_prices = np.clip(future_prices, price_min, price_max)

            sentiment_data = self.sentiment_service.get_sentiment(ticker_upper)
            sentiment_adj = self.sentiment_service.get_price_adjustment(ticker_upper)
            if sentiment_adj != 1.0:
                future_prices *= sentiment_adj
                future_prices = np.clip(future_prices, price_min, price_max)
                logger.info(f"Sentiment adjustment applied: {sentiment_adj:.4f} (score={sentiment_data['combined_score']:.4f})")

            forecast_dates = pd.bdate_range(
                start=last_date + timedelta(days=1),
                periods=days_ahead
            ).strftime("%Y-%m-%d").tolist()
            metrics = self.model_manager.get_model_metrics(ticker_upper) or {"rmse": 0, "mae": 0}

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
                    "ewma20": round(current_ewma20, 2),
                    "roc": round(current_roc, 2),
                    "sp500": round(current_sp500, 2),
                    "vix": round(current_vix, 2),
                    "tnx": round(current_tnx, 4)
                },
                "historical_indicators": [
                    {
                        "date": d,
                        "rsi": round(float(r), 2),
                        "ma20": round(float(m20), 2),
                        "ma50": round(float(m50), 2),
                        "macd": round(float(mc), 4),
                        "ewma20": round(float(e), 2),
                        "roc": round(float(rc), 2)
                    }
                    for d, r, m20, m50, mc, e, rc in zip(
                        historical_dates, historical_rsi, historical_ma20, historical_ma50, historical_macd, historical_ewma20, historical_roc
                    )
                ],
                "metrics": {
                    "rmse": round(float(metrics.get("rmse", 0)), 4),
                    "mae": round(float(metrics.get("mae", 0)), 4),
                    "mse": round(float(metrics.get("mse", metrics.get("rmse", 0) ** 2)), 4),
                    "directional_accuracy": round(float(metrics.get("directional_accuracy", 0)), 2)
                },
                "trend": trend,
                "change_percent": round(float(change_percent), 2),
                "timestamp": datetime.now().isoformat(),
                "model_source": "persisted",
                "model_type": "LSTM+SVM Ensemble" if use_ensemble else "LSTM",
                "sentiment": {
                    "news_score": sentiment_data.get("news_score", 0),
                    "social_score": sentiment_data.get("social_score", 0),
                    "combined_score": sentiment_data.get("combined_score", 0),
                    "news_available": sentiment_data.get("news_available", False),
                    "social_available": sentiment_data.get("social_available", False)
                }
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
                progress.emit_sync("error_event", {"message": "Market API is currently down or undergoing maintenance."})
            return _error_response(ticker, "Market API is currently down or undergoing maintenance.")

    def validate_ticker(self, ticker: str) -> Dict:
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
