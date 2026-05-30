import logging
from typing import Optional, List, Dict
from datetime import datetime
import numpy as np
from sklearn.preprocessing import StandardScaler

from .model_manager import ModelManager
from .model import LSTMModel
from .svm_model import SVMModel
from .data_engine import DataEngine, NUM_FEATURES

logger = logging.getLogger(__name__)


class RetrainingOrchestrator:
    """Orchestrates the complete model retraining workflow with walk-forward validation"""

    def __init__(self, model_manager: Optional[ModelManager] = None):
        self.model_manager = model_manager or ModelManager()
        self.data_engine = DataEngine(window_size=30)

    def _walk_forward_validate(self, df, n_splits: int = 5, progress=None) -> Dict:
        """
        Walk-forward validation: more realistic than static train/test split.
        Each fold fits its own scalers on training data only (no data leakage).
        """
        df_with_indicators = self.data_engine._add_technical_indicators(df)
        total_len = len(df_with_indicators)
        fold_size = total_len // (n_splits + 1)
        rmses, maes, mses, mapes = [], [], [], []
        original_prices = df_with_indicators['Close'].values

        for i in range(n_splits):
            if progress:
                progress.emit_sync("train_step", {
                    "step": "walk_forward",
                    "label": f"Running validation (fold {i + 1}/{n_splits})...",
                    "status": "running",
                    "progress": {"current": i + 1, "total": n_splits}
                })

            train_end = fold_size * (i + 1)
            test_end = min(train_end + fold_size, total_len)

            if train_end < 60 or test_end <= train_end:
                continue

            fold_scalers = [StandardScaler() for _ in range(NUM_FEATURES)]
            feature_data = df_with_indicators[self.data_engine.feature_columns].values
            train_features = feature_data[:train_end]

            scaled_columns = []
            for j in range(NUM_FEATURES):
                fold_scalers[j].fit(train_features[:, j].reshape(-1, 1))
                col_scaled = fold_scalers[j].transform(feature_data[:, j].reshape(-1, 1))
                scaled_columns.append(col_scaled.flatten())

            scaled_data = np.column_stack(scaled_columns)
            close_scaler = fold_scalers[0]

            X, y = self.data_engine.create_sequences(scaled_data, original_close=original_prices)

            seq_train_end = train_end - self.data_engine.window_size
            seq_test_end = test_end - self.data_engine.window_size

            if seq_train_end <= 0 or seq_test_end <= seq_train_end:
                continue

            X_train, y_train = X[:seq_train_end], y[:seq_train_end]
            X_test, y_test = X[seq_train_end:seq_test_end], y[seq_train_end:seq_test_end]

            if len(X_train) < 30 or len(X_test) < 1:
                continue

            fold_model = LSTMModel(window_size=30, num_features=NUM_FEATURES)
            fold_model.build_model()
            fold_model.train(X_train, y_train, epochs=40, batch_size=32, validation_split=0.1)

            metrics = fold_model.evaluate_on_original_scale(
                X_test, y_test, close_scaler,
                original_prices=original_prices,
                test_start_idx=train_end
            )
            rmses.append(metrics["rmse"])
            maes.append(metrics["mae"])
            mses.append(metrics.get("mse", metrics["rmse"] ** 2))
            mapes.append(metrics.get("mape", 0))

        if not rmses:
            return {"rmse": float('inf'), "mae": float('inf'), "mse": float('inf'), "mape": float('inf')}

        result = {
            "rmse": float(np.mean(rmses)),
            "mae": float(np.mean(maes)),
            "mse": float(np.mean(mses)),
            "folds_used": len(rmses)
        }
        if mapes:
            result["mape"] = float(np.mean(mapes))
        return result

    def retrain_model(
        self,
        ticker: str,
        period: str = "5y",
        epochs: int = 150,
        batch_size: int = 32,
        force_retrain: bool = False,
        progress=None
    ) -> Dict:
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

            if progress:
                progress.emit_sync("train_step", {"step": "fetching_data", "label": f"Fetching {period} historical data for {ticker_upper}...", "status": "running"})

            logger.info(f"Fetching data for {ticker_upper}...")
            df = self.data_engine.fetch_data(ticker_upper, period=period)

            if df is None or len(df) < 70:
                result["error"] = f"Insufficient data. Got {len(df) if df is not None else 0} points"
                logger.error(result["error"])
                return result

            if progress:
                progress.emit_sync("train_step", {"step": "indicators", "label": "Computing 11 technical indicators...", "status": "running"})

            logger.info("Preparing data with technical indicators...")
            df_with_indicators = self.data_engine._add_technical_indicators(df)

            old_metrics = self.model_manager.get_model_metrics(ticker_upper)

            if old_metrics:
                logger.info("Running walk-forward validation...")
                wf_metrics = self._walk_forward_validate(df, n_splits=5, progress=progress)
                logger.info(f"Walk-forward validation - RMSE: ${wf_metrics['rmse']:.2f}, "
                           f"MAE: ${wf_metrics['mae']:.2f}, Folds: {wf_metrics.get('folds_used', 0)}")
            else:
                logger.info("First model for this ticker — skipping walk-forward validation")

            total_rows = len(df_with_indicators)
            split_row = int(total_rows * 0.8)
            seq_split = split_row - self.data_engine.window_size

            if progress:
                progress.emit_sync("train_step", {"step": "scaling", "label": "Normalizing features (train-only fit)...", "status": "running"})

            scaled_data, feature_scalers = self.data_engine.prepare_data(df, split_index=split_row)
            close_scaler = self.data_engine.close_scaler

            X, y = self.data_engine.create_sequences(scaled_data, original_close=self.data_engine.original_close_prices)

            if len(X) < 50:
                result["error"] = f"Insufficient sequences. Got {len(X)}"
                logger.error(result["error"])
                return result

            X_train, X_test = X[:seq_split], X[seq_split:]
            y_train, y_test = y[:seq_split], y[seq_split:]

            logger.info(f"Data split - Train: {len(X_train)}, Test: {len(X_test)}")

            if progress:
                progress.emit_sync("train_step", {"step": "building", "label": "Building prediction model...", "status": "running"})

            tuned_params = None

            logger.info("Building new model...")
            model = LSTMModel(window_size=30, num_features=NUM_FEATURES)
            model.build_model()

            if progress:
                progress.emit_sync("train_step", {"step": "training", "label": f"Training model ({epochs} epochs)...", "status": "running"})

            logger.info(f"Training model ({epochs} epochs, early stopping enabled)...")
            epoch_callback = (lambda ep, total, loss, vloss: progress.emit_epoch_sync(ep, total, loss, vloss)) if progress else None
            model.train(X_train, y_train, epochs=epochs, batch_size=batch_size, progress_callback=epoch_callback)

            if progress:
                progress.emit_sync("train_step", {"step": "evaluating", "label": "Evaluating model accuracy...", "status": "running"})

            logger.info("Evaluating model on original dollar scale...")
            original_prices = self.data_engine.original_close_prices
            new_metrics = model.evaluate_on_original_scale(
                X_test, y_test, close_scaler,
                original_prices=original_prices,
                test_start_idx=split_row
            )
            result["new_metrics"] = new_metrics

            if progress:
                progress.emit_sync("train_step", {"step": "svm_training", "label": "Training SVM ensemble model...", "status": "running"})

            svm_model = SVMModel(window_size=30, num_features=NUM_FEATURES)
            svm_model.train(X_train, y_train)
            svm_metrics = svm_model.evaluate_on_original_scale(
                X_test, y_test, close_scaler,
                original_prices=original_prices,
                test_start_idx=split_row
            )
            logger.info(f"SVM metrics - RMSE: ${svm_metrics['rmse']:.2f}, MAE: ${svm_metrics['mae']:.2f}")

            # Dynamic ensemble weighting based on RMSE
            lstm_rmse = new_metrics["rmse"]
            svm_rmse = svm_metrics["rmse"]
            if svm_rmse < lstm_rmse:
                total = lstm_rmse + svm_rmse
                ensemble_weights = {
                    "lstm_weight": round(svm_rmse / total, 4),
                    "svm_weight": round(lstm_rmse / total, 4)
                }
                logger.info(f"Ensemble weights - LSTM: {ensemble_weights['lstm_weight']:.4f}, SVM: {ensemble_weights['svm_weight']:.4f}")
            else:
                ensemble_weights = {"lstm_weight": 1.0, "svm_weight": 0.0}
                logger.info("SVM worse than LSTM — using LSTM only (no ensemble)")

            svm_path = str(self.model_manager.model_dir / f"{ticker_upper}_svm.pkl")
            svm_model.save_model(svm_path)
            self.model_manager.save_svm_model(ticker_upper, svm_path)

            result["old_metrics"] = old_metrics

            # Gate on test-set metrics (same eval method as stored old metrics)
            gating_metrics = {"rmse": new_metrics["rmse"], "mae": new_metrics["mae"], "mse": new_metrics.get("mse", new_metrics["rmse"] ** 2)}
            logger.info("Validating model improvement using test-set metrics...")
            is_better = self.model_manager.validate_model_improvement(
                old_metrics or {},
                gating_metrics
            )

            if is_better:
                if progress:
                    progress.emit_sync("train_step", {"step": "saving", "label": "Saving improved model...", "status": "running"})

                logger.info(f"Saving improved model for {ticker_upper}...")
                saved = self.model_manager.save_model(
                    model.model,
                    ticker_upper,
                    new_metrics,
                    close_scaler,
                    feature_scalers=feature_scalers,
                    ensemble_weights=ensemble_weights
                )

                result["model_saved"] = saved
                result["status"] = "success"
                logger.info(f"Model successfully retrained and saved for {ticker_upper}")

            else:
                result["status"] = "validation_failed"
                logger.warning(f"New model did not meet improvement criteria for {ticker_upper}")

            if progress:
                progress.emit_sync("train_complete", {
                    "rmse": round(float(gating_metrics.get("rmse", 0)), 2),
                    "mae": round(float(gating_metrics.get("mae", 0)), 2),
                    "mse": round(float(gating_metrics.get("mse", 0)), 2)
                })

            return result

        except Exception as e:
            result["error"] = str(e)
            result["status"] = "error"
            logger.error(f"Error retraining model for {ticker_upper}: {str(e)}", exc_info=True)
            return result

    def batch_retrain(
        self,
        tickers: Optional[List[str]] = None,
        period: str = "5y",
        epochs: int = 50,
        force_retrain: bool = False
    ) -> Dict:
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
        try:
            from .supabase_client import get_all_tickers
            tickers_data = get_all_tickers()
            return [t["symbol"] for t in tickers_data] if tickers_data else []
        except Exception as e:
            logger.warning(f"Cannot fetch tickers from DB: {e}")
            return []

    def get_retraining_status(self) -> Dict:
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
