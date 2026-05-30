import numpy as np
import pickle
import os
import logging
from typing import Dict, Any, Optional
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error

logger = logging.getLogger(__name__)


class SVMModel:
    def __init__(self, window_size: int = 30, num_features: int = 11, model_path: str = None):
        self.window_size = window_size
        self.num_features = num_features
        self.model_path = model_path or "saved_models/svm_model.pkl"
        self.model: Optional[SVR] = None
        self.is_trained = False

    def build_model(self) -> SVR:
        self.model = SVR(kernel='rbf', C=10.0, epsilon=0.01, gamma='scale')
        logger.info(f"SVM model built: kernel=rbf, C=10.0, epsilon=0.01")
        return self.model

    def _flatten_sequences(self, X: np.ndarray) -> np.ndarray:
        return X.reshape(X.shape[0], -1)

    def train(self, X_train: np.ndarray, y_train: np.ndarray, **kwargs) -> Dict[str, Any]:
        if self.model is None:
            self.build_model()

        X_flat = self._flatten_sequences(X_train)
        logger.info(f"Training SVM on {len(X_flat)} samples, input dim={X_flat.shape[1]}")
        self.model.fit(X_flat, y_train)
        self.is_trained = True

        train_pred = self.model.predict(X_flat)
        train_rmse = float(np.sqrt(mean_squared_error(y_train, train_pred)))
        logger.info(f"SVM training complete. Train RMSE: {train_rmse:.6f}")
        return {"train_rmse": train_rmse}

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("SVM model not trained. Call train() first.")
        X_flat = self._flatten_sequences(X)
        return self.model.predict(X_flat).reshape(-1, 1)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        predictions = self.predict(X_test).flatten()
        rmse = float(np.sqrt(mean_squared_error(y_test, predictions)))
        mae = float(mean_absolute_error(y_test, predictions))
        return {"rmse": rmse, "mae": mae, "mse": rmse ** 2, "test_samples": len(X_test)}

    def evaluate_on_original_scale(self, X_test: np.ndarray, y_test: np.ndarray,
                                    close_scaler, original_prices: np.ndarray = None,
                                    test_start_idx: int = None) -> Dict[str, float]:
        predicted_returns = self.predict(X_test).flatten()
        actual_returns = y_test.flatten()

        if original_prices is not None and test_start_idx is not None:
            window = self.window_size
            pred_prices, actual_prices = [], []
            for i in range(len(predicted_returns)):
                price_idx = test_start_idx + i + window - 1
                if price_idx < len(original_prices):
                    base_price = original_prices[price_idx]
                    pred_prices.append(base_price * (1 + predicted_returns[i]))
                    actual_prices.append(base_price * (1 + actual_returns[i]))

            if pred_prices:
                pred_prices = np.array(pred_prices)
                actual_prices = np.array(actual_prices)
                rmse = float(np.sqrt(mean_squared_error(actual_prices, pred_prices)))
                mae = float(mean_absolute_error(actual_prices, pred_prices))
                mse = rmse ** 2
            else:
                rmse, mae, mse = float('inf'), float('inf'), float('inf')
        else:
            rmse = float(np.sqrt(mean_squared_error(actual_returns, predicted_returns)))
            mae = float(mean_absolute_error(actual_returns, predicted_returns))
            mse = rmse ** 2

        return {"rmse": round(rmse, 2), "mae": round(mae, 2), "mse": round(mse, 2)}

    def save_model(self, filepath: str = None) -> str:
        save_path = filepath or self.model_path
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        if self.model is None:
            raise ValueError("No SVM model to save")
        with open(save_path, 'wb') as f:
            pickle.dump(self.model, f)
        logger.info(f"SVM model saved to {save_path}")
        return save_path

    def load_model(self, filepath: str = None):
        load_path = filepath or self.model_path
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"SVM model not found at {load_path}")
        with open(load_path, 'rb') as f:
            self.model = pickle.load(f)
        self.is_trained = True
        logger.info(f"SVM model loaded from {load_path}")
