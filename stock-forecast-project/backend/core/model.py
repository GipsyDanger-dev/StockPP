"""
LSTM Model - Deep Learning architecture for stock price forecasting
Uses TensorFlow/Keras for neural network implementation
"""

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
    
    def __init__(self, window_size: int = 60, model_path: str = None):
        """
        Initialize LSTM Model
        
        Args:
            window_size: Sequence length for LSTM input
            model_path: Path to save/load model weights
        """
        self.window_size = window_size
        self.model_path = model_path or "saved_models/lstm_model.keras"
        self.model = None
        self.is_trained = False
        
    def build_model(self) -> keras.Model:
        """
        Build LSTM neural network architecture
        
        Returns:
            Compiled Keras Sequential model
        """
        try:
            model = Sequential([
                # First LSTM layer with 50 units and return_sequences
                LSTM(units=50, return_sequences=True, input_shape=(self.window_size, 1)),
                Dropout(0.2),
                
                # Second LSTM layer
                LSTM(units=50, return_sequences=True),
                Dropout(0.2),
                
                # Third LSTM layer
                LSTM(units=50),
                Dropout(0.2),
                
                # Dense output layer
                Dense(units=1)
            ])
            
            # Compile with Adam optimizer and MSE loss
            model.compile(
                optimizer='adam',
                loss='mean_squared_error',
                metrics=['mae']
            )
            
            self.model = model
            logger.info("LSTM model built successfully")
            logger.info(f"Model summary:\n{model.summary()}")
            
            return model
            
        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              epochs: int = 50, batch_size: int = 32, 
              validation_split: float = 0.2) -> Dict[str, Any]:
        """
        Train the LSTM model
        
        Args:
            X_train: Training sequences
            y_train: Training targets
            epochs: Number of training epochs
            batch_size: Batch size for training
            validation_split: Fraction for validation
            
        Returns:
            Training history
        """
        try:
            if self.model is None:
                self.build_model()
            
            logger.info(f"Starting training with {len(X_train)} samples")
            
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
        """
        Make predictions on new data
        
        Args:
            X: Input sequences for prediction
            
        Returns:
            Predicted values
        """
        if self.model is None:
            raise ValueError("Model not built. Call build_model() first")
        
        try:
            predictions = self.model.predict(X, verbose=0)
            return predictions
        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            raise
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """
        Evaluate model performance on test data
        
        Args:
            X_test: Test sequences
            y_test: Test targets
            
        Returns:
            Dictionary with RMSE and MAE metrics
        """
        try:
            predictions = self.predict(X_test)
            
            # Calculate RMSE
            rmse = np.sqrt(mean_squared_error(y_test, predictions))
            
            # Calculate MAE
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
        """
        Save model weights to disk
        
        Args:
            filepath: Custom save path
            
        Returns:
            Path where model was saved
        """
        try:
            save_path = filepath or self.model_path
            
            # Create directory if not exists
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
        """
        Load pre-trained model from disk
        
        Args:
            filepath: Path to model file
        """
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
            "is_trained": self.is_trained,
            "model_type": "LSTM",
            "layers": 5,  # 3 LSTM + 2 Dropout + 1 Dense
            "model_path": self.model_path
        }
