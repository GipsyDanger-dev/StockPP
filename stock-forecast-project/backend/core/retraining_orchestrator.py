import logging
from typing import Optional, List, Dict
from datetime import datetime
import numpy as np

from .model_manager import ModelManager
from .model import LSTMModel
from .data_engine import DataEngine, NUM_FEATURES

logger = logging.getLogger(__name__)


class RetrainingOrchestrator:
    """Orchestrates the complete model retraining workflow with walk-forward validation"""

    def __init__(self, model_manager: Optional[ModelManager] = None):
        self.model_manager = model_manager or ModelManager()
        self.data_engine = DataEngine(window_size=20)

    def _walk_forward_validate(self, X: np.ndarray, y: np.ndarray,
                                n_splits: int = 5) -> Dict:
        """
        Walk-forward validation: more realistic than static train/test split.
        Splits data into n_splits folds, trains on expanding window,
        tests on next fold. Returns average metrics.
        """
        fold_size = len(X) // (n_splits + 1)
        rmses, maes = [], []

        for i in range(n_splits):
            train_end = fold_size * (i + 1)
            test_end = min(train_end + fold_size, len(X))

            if train_end < 20 or test_end <= train_end:
                continue

            X_train, y_train = X[:train_end], y[:train_end]
            X_test, y_test = X[train_end:test_end], y[train_end:test_end]

            fold_model = LSTMModel(window_size=20, num_features=NUM_FEATURES)
            fold_model.build_model()
            fold_model.train(X_train, y_train, epochs=10, batch_size=32, validation_split=0.1)

            metrics = fold_model.evaluate(X_test, y_test)
            rmses.append(metrics["rmse"])
            maes.append(metrics["mae"])

        if not rmses:
            return {"rmse": float('inf'), "mae": float('inf')}

        return {
            "rmse": float(np.mean(rmses)),
            "mae": float(np.mean(maes)),
            "folds_used": len(rmses)
        }

    def retrain_model(
        self,
        ticker: str,
        period: str = "1y",
        epochs: int = 10,
        batch_size: int = 32,
        force_retrain: bool = False
    ) -> Dict:
        """Retrain a model with walk-forward validation"""
        ticker_upper = ticker.upper()
        result = {
            "ticker": ticker_upper,
            "status": "failed",
            "timestamp": datetime.now().isoformat(),
            "old_metrics": None,
            "new_metrics": None,
            "model_saved": False,
            "error": None
        }

        try:
            if not force_retrain and not self.model_manager.should_retrain(ticker_upper):
                logger.info(f"Model for {ticker_upper} is recent. Skipping retrain.")
                result["status"] = "skipped"
                result["reason"] = "Model is recent"
                return result

            logger.info(f"Starting retraining for {ticker_upper}")

            logger.info(f"Fetching data for {ticker_upper}...")
            df = self.data_engine.fetch_data(ticker_upper, period=period)

            if df is None or len(df) < 70:
                result["error"] = f"Insufficient data. Got {len(df) if df is not None else 0} points"
                logger.error(result["error"])
                return result

            logger.info("Preparing data with technical indicators...")
            scaled_data, scaler = self.data_engine.prepare_data(df)

            X, y = self.data_engine.create_sequences(scaled_data)

            if len(X) < 50:
                result["error"] = f"Insufficient sequences. Got {len(X)}"
                logger.error(result["error"])
                return result

            # Walk-forward validation (more realistic than static split)
            logger.info("Running walk-forward validation...")
            wf_metrics = self._walk_forward_validate(X, y, n_splits=5)
            logger.info(f"Walk-forward validation - RMSE: {wf_metrics['rmse']:.4f}, "
                       f"MAE: {wf_metrics['mae']:.4f}, Folds: {wf_metrics.get('folds_used', 0)}")

            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]

            logger.info(f"Data split - Train: {len(X_train)}, Test: {len(X_test)}")

            logger.info("Building new model...")
            model = LSTMModel(window_size=20, num_features=NUM_FEATURES)
            model.build_model()

            logger.info(f"Training model ({epochs} epochs)...")
            model.train(X_train, y_train, epochs=epochs, batch_size=batch_size)

            logger.info("Evaluating model...")
            new_metrics = model.evaluate(X_test, y_test)
            result["new_metrics"] = new_metrics

            old_metrics = self.model_manager.get_model_metrics(ticker_upper)
            result["old_metrics"] = old_metrics

            logger.info("Validating model improvement...")
            is_better = self.model_manager.validate_model_improvement(
                old_metrics or {},
                new_metrics
            )

            if is_better:
                logger.info(f"Saving improved model for {ticker_upper}...")
                saved = self.model_manager.save_model(
                    model.model,
                    ticker_upper,
                    new_metrics,
                    scaler,
                    feature_scaler=self.data_engine.feature_scaler
                )

                result["model_saved"] = saved
                result["status"] = "success"
                logger.info(f"Model successfully retrained and saved for {ticker_upper}")

            else:
                result["status"] = "validation_failed"
                logger.warning(f"New model did not meet improvement criteria for {ticker_upper}")

            return result

        except Exception as e:
            result["error"] = str(e)
            result["status"] = "error"
            logger.error(f"Error retraining model for {ticker_upper}: {str(e)}", exc_info=True)
            return result

    def batch_retrain(
        self,
        tickers: Optional[List[str]] = None,
        period: str = "1y",
        epochs: int = 10,
        force_retrain: bool = False
    ) -> Dict:
        """Retrain multiple models in batch"""
        logger.info(f"Starting batch retraining. Tickers: {tickers}")

        results = {
            "timestamp": datetime.now().isoformat(),
            "tickers_requested": tickers,
            "results": {},
            "summary": {
                "total": 0,
                "success": 0,
                "failed": 0,
                "skipped": 0,
                "validation_failed": 0
            }
        }

        if not tickers:
            tickers = self._get_default_tickers()

        for ticker in tickers:
            try:
                result = self.retrain_model(
                    ticker,
                    period=period,
                    epochs=epochs,
                    force_retrain=force_retrain
                )

                results["results"][ticker] = result
                results["summary"]["total"] += 1

                if result["status"] == "success":
                    results["summary"]["success"] += 1
                elif result["status"] == "failed":
                    results["summary"]["failed"] += 1
                elif result["status"] == "skipped":
                    results["summary"]["skipped"] += 1
                elif result["status"] == "validation_failed":
                    results["summary"]["validation_failed"] += 1

            except Exception as e:
                logger.error(f"Error processing {ticker}: {str(e)}")
                results["results"][ticker] = {
                    "status": "error",
                    "error": str(e)
                }
                results["summary"]["failed"] += 1

        logger.info(f"Batch retraining complete. Summary: {results['summary']}")
        return results

    def _get_default_tickers(self) -> List[str]:
        """Get default list of tickers to retrain from database"""
        try:
            from .supabase_client import get_all_tickers
            tickers_data = get_all_tickers()
            return [t["symbol"] for t in tickers_data] if tickers_data else []
        except Exception as e:
            logger.warning(f"Cannot fetch tickers from DB: {e}")
            return []

    def get_retraining_status(self) -> Dict:
        """Get status of all models and retraining info"""
        model_info = self.model_manager.get_all_model_info()

        return {
            "timestamp": datetime.now().isoformat(),
            "models": model_info,
            "total_models": len(model_info),
            "models_needing_retrain": sum(
                1 for info in model_info.values()
                if info.get("age_hours", 0) > 24
            )
        }
