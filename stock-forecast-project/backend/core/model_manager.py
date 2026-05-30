import logging
import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

from .data_engine import NUM_FEATURES

logger = logging.getLogger(__name__)


class ModelManager:
    """Manages model lifecycle including loading, saving, and validation"""

    def __init__(self, model_dir: str = "saved_models", use_cloud_storage: bool = True):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.model_dir / "model_metadata.json"
        self.scaler_dir = self.model_dir / "scalers"
        self.scaler_dir.mkdir(parents=True, exist_ok=True)
        self.metadata = self._load_metadata()
        self.use_cloud_storage = use_cloud_storage

        self.supabase_client = None
        if self.use_cloud_storage:
            try:
                from core.supabase_client import SupabaseClient, insert_training_log
                self.supabase_client = SupabaseClient
                self.insert_training_log = insert_training_log
                logger.info("Supabase client initialized for ModelManager")
            except Exception as e:
                logger.warning(f"Supabase not configured, using local storage only: {str(e)}")
                self.use_cloud_storage = False

    def _load_metadata(self) -> Dict:
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading metadata: {str(e)}")
                return {}
        return {}

    def _save_metadata(self) -> None:
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving metadata: {str(e)}")

    def get_model_path(self, ticker: str, version: str = "current") -> Path:
        return self.model_dir / f"{ticker.upper()}_{version}.keras"

    def save_model(self, model, ticker: str, metrics: Dict, scaler: Any = None,
                   feature_scaler: Any = None, feature_scalers: list = None) -> bool:
        """Save a model with metadata and optional scalers"""
        try:
            ticker = ticker.upper()
            model_path = self.get_model_path(ticker, "current")

            model.save(str(model_path))
            logger.info(f"Saved model for {ticker} to {model_path}")

            scaler_path = None
            if scaler is not None:
                scaler_path = self._save_scaler(scaler, ticker)
                logger.info(f"Saved close scaler for {ticker} to {scaler_path}")

            feature_scaler_path = None
            if feature_scalers is not None:
                feature_scaler_path = self._save_feature_scalers(feature_scalers, ticker)
                logger.info(f"Saved {len(feature_scalers)} feature scalers for {ticker}")
            elif feature_scaler is not None:
                feature_scaler_path = self._save_scaler(feature_scaler, ticker, suffix="_feature_scaler")
                logger.info(f"Saved feature scaler for {ticker} to {feature_scaler_path}")

            if ticker not in self.metadata:
                self.metadata[ticker] = {
                    "versions": []
                }

            version_info = {
                "timestamp": datetime.now().isoformat(),
                "model_path": str(model_path),
                "metrics": metrics
            }
            if scaler_path:
                version_info["scaler_path"] = str(scaler_path)
            if feature_scaler_path:
                version_info["feature_scaler_path"] = str(feature_scaler_path)

            self.metadata[ticker]["current"] = version_info
            self.metadata[ticker]["versions"].append(version_info)

            if len(self.metadata[ticker]["versions"]) > 5:
                self.metadata[ticker]["versions"] = self.metadata[ticker]["versions"][-5:]

            self._save_metadata()

            if self.use_cloud_storage:
                self._upload_to_supabase(ticker, model_path, metrics, scaler_path, feature_scaler_path)

            return True

        except Exception as e:
            logger.error(f"Error saving model for {ticker}: {str(e)}", exc_info=True)
            return False

    def _upload_to_supabase(self, ticker: str, model_path: Path, metrics: Dict,
                             scaler_path: Path = None, feature_scaler_path: Path = None) -> bool:
        """Upload model and scaler files to Supabase Storage, log training metadata"""
        try:
            if not self.supabase_client:
                logger.warning("Supabase client not available, skipping cloud upload")
                return False

            storage = self.supabase_client.get_storage()
            bucket = storage.from_("models")

            for file_name in ["model.keras", "close_scaler.pkl", "feature_scalers.pkl"]:
                try:
                    bucket.remove([f"{ticker}/{file_name}"])
                except Exception:
                    pass

            with open(model_path, "rb") as f:
                path = f"{ticker}/model.keras"
                bucket.upload(path, f, {"content-type": "application/octet-stream"})
                logger.info(f"Uploaded model to Supabase: {path}")

            if scaler_path and scaler_path.exists():
                with open(scaler_path, "rb") as f:
                    bucket.upload(f"{ticker}/{scaler_path.name}", f, {"content-type": "application/octet-stream"})
                    logger.info(f"Uploaded price scaler to Supabase: {ticker}/{scaler_path.name}")

            if feature_scaler_path and feature_scaler_path.exists():
                with open(feature_scaler_path, "rb") as f:
                    bucket.upload(f"{ticker}/{feature_scaler_path.name}", f, {"content-type": "application/octet-stream"})
                    logger.info(f"Uploaded feature scaler to Supabase: {ticker}/{feature_scaler_path.name}")

            try:
                self.insert_training_log(
                    ticker=ticker,
                    report_name=f"AI Training {ticker} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                    rmse=float(metrics.get("rmse", 0)),
                    mae=float(metrics.get("mae", 0)),
                    status="Completed"
                )
                logger.info(f"Training log recorded for {ticker}")
            except Exception as log_err:
                logger.error(f"Failed to save training log for {ticker}: {str(log_err)}")

            return True

        except Exception as e:
            logger.error(f"Error uploading to Supabase: {str(e)}")
            return False

    def load_model(self, ticker: str) -> Optional[object]:
        try:
            from tensorflow import keras

            ticker = ticker.upper()
            model_path = self.get_model_path(ticker, "current")

            if not model_path.exists():
                logger.warning(f"Model not found for {ticker} at {model_path}")
                return None

            model = keras.models.load_model(str(model_path))
            logger.info(f"Loaded model for {ticker} from {model_path}")
            return model

        except Exception as e:
            logger.error(f"Error loading model for {ticker}: {str(e)}", exc_info=True)
            return None

    def load_model_and_scaler(self, ticker: str) -> Tuple[Optional[object], Optional[Any]]:
        """
        Load model and its associated scaler together.
        Critical: Both must be loaded in sync for correct predictions.
        """
        try:
            ticker = ticker.upper()
            model = self.load_model(ticker)
            scaler = self._load_scaler(ticker)

            if model is None:
                logger.warning(f"Model not found for {ticker}")
                return None, None

            if scaler is None:
                logger.warning(f"Scaler not found for {ticker}, model loaded without scaler")
                return model, None

            logger.info(f"Loaded model and scaler for {ticker}")
            return model, scaler

        except Exception as e:
            logger.error(f"Error loading model and scaler for {ticker}: {str(e)}", exc_info=True)
            return None, None

    def load_feature_scaler(self, ticker: str) -> Optional[Any]:
        """
        Load the feature scaler (6 features) used during training.
        Critical: Must use the same scaler for prediction as was used for training.
        """
        try:
            ticker = ticker.upper()

            if ticker in self.metadata and "current" in self.metadata[ticker]:
                path_str = self.metadata[ticker]["current"].get("feature_scaler_path")
                if path_str and Path(path_str).exists():
                    with open(path_str, 'rb') as f:
                        return pickle.load(f)

            scaler_path = self.scaler_dir / f"{ticker}_feature_scaler.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    return pickle.load(f)

            if self.use_cloud_storage and self.supabase_client:
                try:
                    storage = self.supabase_client.get_storage()
                    cloud_path = f"{ticker}/{ticker}_feature_scaler.pkl"
                    data = storage.from_("models").download(cloud_path)
                    if data:
                        scaler = pickle.loads(data)
                        # Save locally for future use
                        with open(scaler_path, 'wb') as f:
                            pickle.dump(scaler, f)
                        logger.info(f"Downloaded feature scaler from Supabase for {ticker}")
                        return scaler
                except Exception as cloud_err:
                    logger.debug(f"Feature scaler not found in Supabase for {ticker}: {cloud_err}")

            logger.warning(f"Feature scaler not found for {ticker}")
            return None

        except Exception as e:
            logger.error(f"Error loading feature scaler for {ticker}: {str(e)}")
            return None

    def load_feature_scalers(self, ticker: str) -> Optional[list]:
        """Load the per-feature scaler list (6 StandardScalers) used during training."""
        try:
            ticker = ticker.upper()

            if ticker in self.metadata and "current" in self.metadata[ticker]:
                path_str = self.metadata[ticker]["current"].get("feature_scaler_path")
                if path_str and Path(path_str).exists():
                    with open(path_str, 'rb') as f:
                        data = pickle.load(f)
                        if isinstance(data, list):
                            return data
                        # Backward compat: single scaler wrapped in list
                        return [data] * NUM_FEATURES

            scaler_path = self.scaler_dir / f"{ticker}_feature_scalers.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    data = pickle.load(f)
                    if isinstance(data, list):
                        return data
                    return [data] * NUM_FEATURES

            legacy_path = self.scaler_dir / f"{ticker}_feature_scaler.pkl"
            if legacy_path.exists():
                with open(legacy_path, 'rb') as f:
                    scaler = pickle.load(f)
                    logger.info(f"Loaded legacy single feature scaler for {ticker}, wrapping as list")
                    return [scaler] * NUM_FEATURES

            if self.use_cloud_storage and self.supabase_client:
                try:
                    storage = self.supabase_client.get_storage()
                    for cloud_name in [f"{ticker}/{ticker}_feature_scalers.pkl",
                                       f"{ticker}/{ticker}_feature_scaler.pkl"]:
                        try:
                            data = storage.from_("models").download(cloud_name)
                            if data:
                                loaded = pickle.loads(data)
                                if isinstance(loaded, list):
                                    result = loaded
                                else:
                                    result = [loaded] * NUM_FEATURES
                                with open(scaler_path, 'wb') as f:
                                    pickle.dump(result, f)
                                logger.info(f"Downloaded feature scalers from Supabase for {ticker}")
                                return result
                        except Exception:
                            continue
                except Exception as cloud_err:
                    logger.debug(f"Feature scalers not found in Supabase for {ticker}: {cloud_err}")

            logger.warning(f"Feature scalers not found for {ticker}")
            return None

        except Exception as e:
            logger.error(f"Error loading feature scalers for {ticker}: {str(e)}")
            return None

    def get_model_metrics(self, ticker: str) -> Optional[Dict]:
        ticker = ticker.upper()

        if ticker in self.metadata and "current" in self.metadata[ticker]:
            return self.metadata[ticker]["current"].get("metrics", {})

        return None

    def get_model_age(self, ticker: str) -> Optional[float]:
        try:
            ticker = ticker.upper()
            if ticker in self.metadata and "current" in self.metadata[ticker]:
                timestamp_str = self.metadata[ticker]["current"]["timestamp"]
                timestamp = datetime.fromisoformat(timestamp_str)
                age_hours = (datetime.now() - timestamp).total_seconds() / 3600
                return age_hours
            return None
        except Exception as e:
            logger.error(f"Error getting model age for {ticker}: {str(e)}")
            return None

    def should_retrain(self, ticker: str, max_age_hours: float = 24) -> bool:
        ticker = ticker.upper()

        if ticker not in self.metadata or "current" not in self.metadata[ticker]:
            return True

        age = self.get_model_age(ticker)
        if age is None:
            return True

        return age > max_age_hours

    def validate_model_improvement(
        self,
        old_metrics: Dict,
        new_metrics: Dict
    ) -> bool:
        """Compare old and new model metrics. Returns True if new model is better or equal."""
        if not old_metrics:
            return True  # No old model, new is better

        old_rmse = old_metrics.get("rmse", float('inf'))
        new_rmse = new_metrics.get("rmse", float('inf'))

        logger.info(f"Model comparison - Old RMSE: {old_rmse:.4f}, New RMSE: {new_rmse:.4f}")

        # Allow 2% tolerance for similar models
        tolerance = old_rmse * 0.02

        if new_rmse <= (old_rmse + tolerance):
            logger.info(f"New model is better or equivalent (within {tolerance:.4f} tolerance)")
            return True

        logger.warning(f"New model is worse. Not saving.")
        return False

    def model_exists(self, ticker: str) -> bool:
        ticker = ticker.upper()
        model_path = self.get_model_path(ticker, "current")
        return model_path.exists()

    def get_all_model_info(self) -> Dict:
        info = {}
        for ticker, data in self.metadata.items():
            if "current" in data:
                metrics = data["current"].get("metrics", {})
                age = self.get_model_age(ticker)
                info[ticker] = {
                    "metrics": metrics,
                    "age_hours": age,
                    "last_updated": data["current"]["timestamp"]
                }
        return info

    def _save_scaler(self, scaler: Any, ticker: str, suffix: str = "_scaler") -> Path:
        ticker = ticker.upper()
        scaler_path = self.scaler_dir / f"{ticker}{suffix}.pkl"

        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)

        return scaler_path

    def _save_feature_scalers(self, scalers: list, ticker: str) -> Path:
        ticker = ticker.upper()
        scaler_path = self.scaler_dir / f"{ticker}_feature_scalers.pkl"

        with open(scaler_path, 'wb') as f:
            pickle.dump(scalers, f)

        return scaler_path

    def _load_scaler(self, ticker: str) -> Optional[Any]:
        try:
            ticker = ticker.upper()

            if ticker in self.metadata and "current" in self.metadata[ticker]:
                scaler_path_str = self.metadata[ticker]["current"].get("scaler_path")
                if scaler_path_str and Path(scaler_path_str).exists():
                    with open(scaler_path_str, 'rb') as f:
                        return pickle.load(f)

            scaler_path = self.scaler_dir / f"{ticker}_scaler.pkl"
            if scaler_path.exists():
                with open(scaler_path, 'rb') as f:
                    return pickle.load(f)

            if self.use_cloud_storage and self.supabase_client:
                try:
                    storage = self.supabase_client.get_storage()
                    cloud_path = f"{ticker}/{ticker}_scaler.pkl"
                    data = storage.from_("models").download(cloud_path)
                    if data:
                        scaler = pickle.loads(data)
                        with open(scaler_path, 'wb') as f:
                            pickle.dump(scaler, f)
                        logger.info(f"Downloaded price scaler from Supabase for {ticker}")
                        return scaler
                except Exception as cloud_err:
                    logger.debug(f"Price scaler not found in Supabase for {ticker}: {cloud_err}")

            logger.warning(f"Scaler not found for {ticker}")
            return None

        except Exception as e:
            logger.error(f"Error loading scaler for {ticker}: {str(e)}")
            return None
