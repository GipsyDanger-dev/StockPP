import logging
import os
import json
import pickle  
from datetime import datetime
from pathlib import Path
import numpy as np
from typing import Dict, Optional, Tuple, Any

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self, model_dir: str = "saved_models"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.model_dir / "model_metadata.json"
        self.metadata = self._load_metadata()
        
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
    
    def get_paths(self, ticker: str, version: str = "current") -> Tuple[Path, Path]:
        """Mendapatkan path untuk file Model dan Scaler"""
        ticker = ticker.upper()
        model_path = self.model_dir / f"{ticker}_{version}.keras"
        scaler_path = self.model_dir / f"{ticker}_{version}_scaler.pkl"
        return model_path, scaler_path
    
    def save_model(self, model, ticker: str, metrics: Dict, scaler: Any) -> bool:
        """Menyimpan model DAN scaler"""
        try:
            ticker = ticker.upper()
            model_path, scaler_path = self.get_paths(ticker, "current")
            
            # 1. Simpan Model TensorFlow
            model.save(str(model_path))
            
            # 2. Simpan Scaler menggunakan Pickle
            with open(scaler_path, 'wb') as f:
                pickle.dump(scaler, f)
                
            logger.info(f"Saved model & scaler for {ticker}")
            
            # Update metadata (Sama seperti kode Anda sebelumnya)
            if ticker not in self.metadata:
                self.metadata[ticker] = {"versions": []}
            
            version_info = {
                "timestamp": datetime.now().isoformat(),
                "model_path": str(model_path),
                "scaler_path": str(scaler_path),
                "metrics": metrics
            }
            
            self.metadata[ticker]["current"] = version_info
            self.metadata[ticker]["versions"].append(version_info)
            if len(self.metadata[ticker]["versions"]) > 5:
                self.metadata[ticker]["versions"] = self.metadata[ticker]["versions"][-5:]
            
            self._save_metadata()
            return True
        except Exception as e:
            logger.error(f"Error saving model for {ticker}: {str(e)}")
            return False
    
    def load_model_and_scaler(self, ticker: str) -> Tuple[Optional[Any], Optional[Any]]:
        """Memuat model dan scaler sekaligus"""
        try:
            try:
                from tensorflow import keras
            except Exception:
                # Try standalone keras as a fallback (some environments use keras package)
                try:
                    import keras
                    keras = keras
                except Exception as ie:
                    logger.error(f"TensorFlow/Keras not available: {ie}")
                    return None, None
            ticker = ticker.upper()
            model_path, scaler_path = self.get_paths(ticker, "current")
            
            if not model_path.exists() or not scaler_path.exists():
                return None, None
            
            model = keras.models.load_model(str(model_path))
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
                
            return model, scaler
        except Exception as e:
            logger.error(f"Error loading model/scaler for {ticker}: {str(e)}")
            return None, None
    
    def get_model_metrics(self, ticker: str) -> Optional[Dict]:
        """
        Get metrics for current model
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with metrics or None if not available
        """
        ticker = ticker.upper()
        
        if ticker in self.metadata and "current" in self.metadata[ticker]:
            return self.metadata[ticker]["current"].get("metrics", {})
        
        return None
    
    def get_model_age(self, ticker: str) -> Optional[float]:
        """
        Get age of model in hours
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Age in hours or None if not available
        """
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
        """
        Check if model should be retrained
        
        Args:
            ticker: Stock ticker symbol
            max_age_hours: Maximum age before retraining needed
            
        Returns:
            True if model is too old or doesn't exist
        """
        ticker = ticker.upper()
        
        # No model exists, need to train
        if ticker not in self.metadata or "current" not in self.metadata[ticker]:
            return True
        
        # Check age
        age = self.get_model_age(ticker)
        if age is None:
            return True
        
        return age > max_age_hours
    
    def validate_model_improvement(
        self, 
        old_metrics: Dict, 
        new_metrics: Dict
    ) -> bool:
        """
        Compare old and new model metrics
        
        Args:
            old_metrics: Previous model metrics
            new_metrics: New model metrics
            
        Returns:
            True if new model is better or equal
        """
        if not old_metrics:
            return True  # No old model, new is better
        
        # Compare RMSE (primary metric, lower is better)
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
        """Check if model exists for ticker"""
        ticker = ticker.upper()
        model_path = self.get_path(ticker, "current")
        return model_path.exists()
    
    def get_all_model_info(self) -> Dict:
        """Get information about all saved models"""
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
