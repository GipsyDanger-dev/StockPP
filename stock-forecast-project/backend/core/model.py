import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, LearningRateScheduler
from tensorflow.keras.optimizers import Adam
import math
from sklearn.metrics import mean_squared_error, mean_absolute_error
import logging
import os
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)




class LSTMModel:
    """
    LSTM Deep Learning Model for time series forecasting
    Architecture optimized for stock price prediction
    """

    def __init__(self, window_size: int = 30, num_features: int = 6, model_path: str = None):
        self.window_size = window_size
        self.num_features = num_features
        self.model_path = model_path or "saved_models/lstm_model.keras"
        self.model = None
        self.is_trained = False

    def build_model(self) -> keras.Model:
        """Build LSTM neural network architecture with direction-aware loss."""
        try:
            from tensorflow.keras.layers import BatchNormalization

            model = Sequential([
                LSTM(units=128, return_sequences=True,
                     input_shape=(self.window_size, self.num_features)),
                BatchNormalization(),
                Dropout(0.2),

                LSTM(units=64, return_sequences=True),
                BatchNormalization(),
                Dropout(0.2),

                LSTM(units=32),
                Dropout(0.3),

                Dense(units=64, activation='relu'),
                Dropout(0.15),
                Dense(units=32, activation='relu'),
                Dropout(0.1),
                Dense(units=16, activation='relu'),
                Dense(units=1)
            ])

            model.compile(
                optimizer=Adam(learning_rate=0.0008),
                loss='huber',
                metrics=['mae']
            )

            self.model = model
            logger.info(f"LSTM model built: window={self.window_size}, features={self.num_features}")
            return model

        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise

    def build_model_custom(self, lstm_units: tuple = (128, 64, 32),
                           dropout_rates: tuple = (0.2, 0.2, 0.3),
                           learning_rate: float = 0.0008) -> keras.Model:
        try:
            from tensorflow.keras.layers import BatchNormalization

            model = Sequential()
            for i, units in enumerate(lstm_units):
                if i == 0:
                    model.add(LSTM(units=units, return_sequences=(i < len(lstm_units) - 1),
                                   input_shape=(self.window_size, self.num_features)))
                else:
                    model.add(LSTM(units=units, return_sequences=(i < len(lstm_units) - 1)))
                if i < len(lstm_units) - 1:
                    model.add(BatchNormalization())
                model.add(Dropout(dropout_rates[i] if i < len(dropout_rates) else 0.2))

            model.add(Dense(units=32, activation='relu'))
            model.add(Dropout(0.1))
            model.add(Dense(units=16, activation='relu'))
            model.add(Dense(units=1))

            model.compile(optimizer=Adam(learning_rate=learning_rate), loss='huber', metrics=['mae'])
            self.model = model
            return model
        except Exception as e:
            logger.error(f"Error building custom model: {str(e)}")
            raise

    def train(self, X_train: np.ndarray, y_train: np.ndarray,
              epochs: int = 100, batch_size: int = 32,
              validation_split: float = 0.2,
              progress_callback=None) -> Dict[str, Any]:
        """Train the LSTM model with early stopping and LR scheduling.

        Args:
            progress_callback: Optional sync callable(epoch, total_epochs, loss, val_loss)
                              Called from Keras on_epoch_end. Safe for thread pool usage.
        """
        try:
            if self.model is None:
                self.build_model()

            logger.info(f"Starting training with {len(X_train)} samples, "
                       f"shape: {X_train.shape}")

            def cosine_annealing(epoch, lr):
                min_lr = 1e-6
                return min_lr + 0.5 * (0.0008 - min_lr) * (1 + math.cos(math.pi * epoch / epochs))

            callbacks = [
                EarlyStopping(
                    monitor='val_loss',
                    patience=20,
                    restore_best_weights=True,
                    min_delta=1e-5
                ),
                LearningRateScheduler(cosine_annealing, verbose=0)
            ]

            if progress_callback:
                class _ProgressCallback(keras.callbacks.Callback):
                    def __init__(self, total_epochs, fn):
                        super().__init__()
                        self.total_epochs = total_epochs
                        self.fn = fn

                    def on_epoch_end(self, epoch, logs=None):
                        logs = logs or {}
                        self.fn(
                            epoch=epoch + 1,
                            total_epochs=self.total_epochs,
                            loss=float(logs.get('loss', 0)),
                            val_loss=float(logs.get('val_loss', 0))
                        )

                callbacks.append(_ProgressCallback(epochs, progress_callback))

            history = self.model.fit(
                X_train, y_train,
                epochs=epochs,
                batch_size=batch_size,
                validation_split=validation_split,
                callbacks=callbacks,
                verbose=1
            )

            self.is_trained = True
            actual_epochs = len(history.history['loss'])
            logger.info(f"Training completed after {actual_epochs} epochs (early stopping)")

            return history.history

        except Exception as e:
            logger.error(f"Error during training: {str(e)}")
            raise

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first")

        try:
            predictions = self.model.predict(X, verbose=0)
            return predictions
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        try:
            predictions = self.predict(X_test)

            rmse = np.sqrt(mean_squared_error(y_test, predictions))
            mae = mean_absolute_error(y_test, predictions)

            direction_correct = np.sum(np.sign(predictions.flatten()) == np.sign(y_test.flatten()))
            directional_accuracy = float(direction_correct / len(y_test) * 100)

            metrics = {
                "rmse": float(rmse),
                "mae": float(mae),
                "mse": float(rmse ** 2),
                "directional_accuracy": round(directional_accuracy, 2),
                "test_samples": len(X_test)
            }

            logger.info(f"Model evaluation (scaled) - RMSE: {rmse:.4f}, MAE: {mae:.4f}, Dir.Acc: {directional_accuracy:.2f}%")

            return metrics

        except Exception as e:
            logger.error(f"Error during evaluation: {str(e)}")
            raise

    def evaluate_on_original_scale(self, X_test: np.ndarray, y_test: np.ndarray,
                                    close_scaler, original_prices: np.ndarray = None,
                                    test_start_idx: int = None) -> Dict[str, float]:
        """Evaluate model on original dollar scale for meaningful metrics.

        Since the model predicts returns, we convert returns back to prices
        using the actual price at each time step for accurate dollar metrics.
        """
        try:
            predicted_returns = self.predict(X_test).flatten()
            actual_returns = y_test.flatten()

            if original_prices is not None and test_start_idx is not None:
                # Convert returns to prices: price[t+1] = price[t] * (1 + return)
                # original_prices contains the Close prices for the full dataset
                # test_start_idx is the index in original_prices where test sequences start
                window = self.window_size
                pred_prices = []
                actual_prices = []

                for i in range(len(predicted_returns)):
                    # The price at the end of the input window for this sequence
                    price_idx = test_start_idx + i + window - 1
                    if price_idx < len(original_prices):
                        base_price = original_prices[price_idx]
                        pred_prices.append(base_price * (1 + predicted_returns[i]))
                        actual_prices.append(base_price * (1 + actual_returns[i]))

                if pred_prices:
                    pred_prices = np.array(pred_prices)
                    actual_prices = np.array(actual_prices)
                    rmse = np.sqrt(mean_squared_error(actual_prices, pred_prices))
                    mae = mean_absolute_error(actual_prices, pred_prices)
                    mape = np.mean(np.abs((actual_prices - pred_prices) / actual_prices)) * 100
                else:
                    rmse, mae, mape = float('inf'), float('inf'), float('inf')
            else:
                # Fallback: evaluate returns directly (not in dollar terms)
                rmse = np.sqrt(mean_squared_error(actual_returns, predicted_returns))
                mae = mean_absolute_error(actual_returns, predicted_returns)
                mape = 0

            direction_correct = np.sum(np.sign(predicted_returns) == np.sign(actual_returns))
            directional_accuracy = round(float(direction_correct / len(actual_returns) * 100), 2)

            metrics = {
                "rmse": round(float(rmse), 2),
                "mae": round(float(mae), 2),
                "mse": round(float(rmse ** 2), 2),
                "mape": round(float(mape), 2),
                "directional_accuracy": directional_accuracy,
                "test_samples": len(X_test)
            }

            logger.info(f"Model evaluation (original scale) - RMSE: ${rmse:.2f}, MAE: ${mae:.2f}, MAPE: {mape:.2f}%, Dir.Acc: {directional_accuracy}%")

            return metrics

        except Exception as e:
            logger.error(f"Error during original-scale evaluation: {str(e)}")
            raise

    def save_model(self, filepath: str = None) -> str:
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
        return {
            "window_size": self.window_size,
            "num_features": self.num_features,
            "is_trained": self.is_trained,
            "model_type": "LSTM",
            "layers": 5,
            "model_path": self.model_path
        }
