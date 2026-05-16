import logging
from typing import Dict, List, Optional, Any
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
    def __init__(self, model_manager: Optional[ModelManager] = None):
        try:
            if HAS_ML_DEPENDENCIES:
                self.data_engine = DataEngine()
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
            
            # 1. Cek Cache
            cache_key = f"{ticker_upper}_{period}_{days_ahead}"
            if cache_key in self.cache:
                cached_data = self.cache[cache_key]
                cache_age = (datetime.now() - cached_data['timestamp']).total_seconds() / 3600
                if cache_age < 1:
                    logger.info(f"Using cached forecast for {ticker_upper}")
                    return cached_data['data']
            
            # 2. Load Model DAN Scaler (Penting agar sinkron)
            model, saved_scaler = None, None
            if self.model_manager:
                model, saved_scaler = self.model_manager.load_model_and_scaler(ticker_upper)
            
            if model is None or saved_scaler is None:
                logger.info(f"No persisted model/scaler for {ticker_upper}, using mock data")
                return self._generate_mock_forecast(ticker_upper, days_ahead)
            
            # 3. Ambil Data Real dari Yahoo Finance
            df = self.data_engine.fetch_data(ticker_upper, period=period)
            if df is None or len(df) < 70:
                return self._generate_mock_forecast(ticker_upper, days_ahead)
            
            # 4. Preprocessing menggunakan Scaler yang sudah di-load
            # Kita hanya ambil Close harganya saja
            close_prices = df['Close'].values.reshape(-1, 1)
            scaled_data = saved_scaler.transform(close_prices) # Gunakan transform, BUKAN fit_transform
            
            current_price = float(df['Close'].iloc[-1])
            last_date = df.index[-1]
            
            # Ambil data 20 hari terakhir untuk grafik historis
            historical_dates = [d.strftime("%Y-%m-%d") for d in df.index[-20:]]
            historical_prices = df['Close'].iloc[-20:].tolist()
            
            # 5. Prediksi Masa Depan (Sliding Window)
            last_sequence = scaled_data[-60:].reshape(1, 60, 1)
            future_predictions = []
            current_sequence = last_sequence.copy()
            
            for _ in range(days_ahead):
                # Prediksi satu titik
                next_pred = model.predict(current_sequence, verbose=0)
                future_predictions.append(next_pred[0, 0])
                
                # Update sequence: Hapus yang terlama, masukkan yang terbaru (reshape ke 3D)
                new_val = next_pred.reshape(1, 1, 1)
                current_sequence = np.append(current_sequence[:, 1:, :], new_val, axis=1)
            
            # 6. Inverse Transform ke Harga Asli
            future_prices = saved_scaler.inverse_transform(
                np.array(future_predictions).reshape(-1, 1)
            ).flatten()
            
            # 7. Generate Response
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
            
            # Simpan ke cache
            self.cache[cache_key] = {'data': response, 'timestamp': datetime.now()}
            return response
            
        except Exception as e:
            logger.error(f"Error generating forecast: {str(e)}")
            return self._generate_mock_forecast(ticker, days_ahead)
    
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
