import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.metrics import mean_squared_error, mean_absolute_error
import logging
import os
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)


class LSTMModel:
    """
    LSTM Deep Learning Model for time series forecasting
    Architecture optimized for stock price prediction
    """

    def __init__(self, window_size: int = 20, num_features: int = 6, model_path: str = None):
        self.window_size = window_size
        self.num_features = num_features
        self.model_path = model_path or "saved_models/lstm_model.keras"
        self.model = None
        self.is_trained = False

    def build_model(self) -> keras.Model:
        """Build LSTM neural network architecture"""
        try:
            model = Sequential([
                LSTM(units=50, return_sequences=True,
                     input_shape=(self.window_size, self.num_features)),
                Dropout(0.2),

                LSTM(units=50, return_sequences=True),
                Dropout(0.2),

                LSTM(units=50),
                Dropout(0.2),

                Dense(units=1)
            ])

            model.compile(
                optimizer='adam',
                loss='mean_squared_error',
                metrics=['mae']
            )

            self.model = model
            logger.info(f"LSTM model built: window={self.window_size}, features={self.num_features}")
            return model

        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              epochs: int = 50, batch_size: int = 32,
              validation_split: float = 0.2) -> Dict[str, Any]:
        """Train the LSTM model"""
        try:
            if self.model is None:
                self.build_model()

            logger.info(f"Starting training with {len(X_train)} samples, "
                       f"shape: {X_train.shape}")

            history = self.model.fit(
                X_train, y_train,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=validation_split,
                verbose=1
            )

            self.is_trained = True
            logger.info("Training completed successfully")

            return history.history

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions on new data"""
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first")

        try:
            predictions = self.model.predict(X, verbose=0)
            return predictions
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """Evaluate model performance on test data. Returns dict with RMSE and MAE."""
        try:
            predictions = self.predict(X_test)

            rmse = np.sqrt(mean_squared_error(y_test, predictions))
            mae = mean_absolute_error(y_test, predictions)

            metrics = {
                "rmse": float(rmse),
                "mae": float(mae),
                "test_samples": len(X_test)
            }

            logger.info(f"Model evaluation - RMSE: {rmse:.4f}, MAE: {mae:.4f}")

            return metrics

        except Exception as e:
            logger.error(f"Error during evaluation: {str(e)}")
            raise

    def save_model(self, filepath: str = None) -> str:
        """Save model to disk"""
        try:
            save_path = filepath or self.model_path
            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            if self.model is None:
                raise ValueError("No model to save")

            self.model.save(save_path)
            logger.info(f"Model saved to {save_path}")
            return save_path

        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise

    def load_model(self, filepath: str = None):
        """Load pre-trained model from disk"""
        try:
            load_path = filepath or self.model_path

            if not os.path.exists(load_path):
                raise FileNotFoundError(f"Model not found at {load_path}")

            self.model = keras.models.load_model(load_path)
            self.is_trained = True
            logger.info(f"Model loaded from {load_path}")

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise

    def get_summary(self) -> Dict[str, Any]:
        """Get model summary information"""
        return {
            "window_size": self.window_size,
            "num_features": self.num_features,
            "is_trained": self.is_trained,
            "model_type": "LSTM",
            "layers": 5,
            "model_path": self.model_path
        }
