"""
Model Manager - Handles model persistence, loading, saving, and versioning
"""

import logging
import os
import json
import pickle
from datetime import datetime
from pathlib import Path
import numpy as np
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class ModelManager:
    """Manages model lifecycle including loading, saving, and validation"""
    
    def __init__(self, model_dir: str = "saved_models", use_cloud_storage: bool = True):
        """
        Initialize model manager
        
        Args:
            model_dir: Directory to store models locally
            use_cloud_storage: Whether to upload to Supabase Storage
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.model_dir / "model_metadata.json"
        self.metadata = self._load_metadata()
        self.use_cloud_storage = use_cloud_storage
        
        # Initialize Supabase client if cloud storage is enabled
        self.supabase_client = None
        if self.use_cloud_storage:
            try:
                from core.supabase_client import SupabaseClient, insert_training_log
                self.supabase_client = SupabaseClient
                self.insert_training_log = insert_training_log
                logger.info("✅ Supabase client initialized for ModelManager")
            except Exception as e:
                logger.warning(f"⚠️  Supabase not configured, using local storage only: {str(e)}")
                self.use_cloud_storage = False
        
    def _load_metadata(self) -> Dict:
        """Load metadata about saved models"""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading metadata: {str(e)}")
                return {}
        return {}
    
    def _save_metadata(self) -> None:
        """Save metadata about models"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving metadata: {str(e)}")
    
    def get_model_path(self, ticker: str, version: str = "current") -> Path:
        """Get path for a model"""
        return self.model_dir / f"{ticker.upper()}_{version}.keras"
    
    def save_model(self, model, ticker: str, metrics: Dict) -> bool:
        """
        Save a model with metadata
        
        Args:
            model: TensorFlow model to save
            ticker: Stock ticker symbol
            metrics: Dictionary with model metrics (loss, rmse, mae, etc.)
            
        Returns:
            True if saved successfully
        """
        try:
            ticker = ticker.upper()
            model_path = self.get_model_path(ticker, "current")
            
            # Save model
            model.save(str(model_path))
            logger.info(f"Saved model for {ticker} to {model_path}")
            
            # Update metadata
            if ticker not in self.metadata:
                self.metadata[ticker] = {
                    "versions": []
                }
            
            # Create version info
            version_info = {
                "timestamp": datetime.now().isoformat(),
                "path": str(model_path),
                "metrics": metrics
            }
            
            self.metadata[ticker]["current"] = version_info
            self.metadata[ticker]["versions"].append(version_info)
            
            # Keep only last 5 versions
            if len(self.metadata[ticker]["versions"]) > 5:
                self.metadata[ticker]["versions"] = self.metadata[ticker]["versions"][-5:]
            
            self._save_metadata()
            
            # Upload to Supabase Cloud Storage if enabled
            if self.use_cloud_storage:
                self._upload_to_supabase(ticker, model_path, metrics)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving model for {ticker}: {str(e)}", exc_info=True)
            return False
    
    def _upload_to_supabase(self, ticker: str, model_path: Path, metrics: Dict) -> bool:
        """
        Upload model file to Supabase Storage and log training metadata
        
        Args:
            ticker: Stock ticker symbol
            model_path: Path to the model file
            metrics: Model metrics dictionary
            
        Returns:
            True if uploaded successfully
        """
        try:
            if not self.supabase_client:
                logger.warning("Supabase client not available, skipping cloud upload")
                return False
            
            storage = self.supabase_client.get_storage()
            
            # Upload model file
            with open(model_path, "rb") as f:
                path = f"{ticker}/model.keras"
                storage.from_("models").upload(path, f, {"content-type": "application/octet-stream"})
                logger.info(f"✅ Uploaded model to Supabase: {path}")
            
            # Insert training log into database
            self.insert_training_log(
                ticker=ticker,
                report_name=f"AI Training {ticker} - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                rmse=float(metrics.get("rmse", 0)),
                mae=float(metrics.get("mae", 0)),
                status="Completed"
            )
            logger.info(f"✅ Training log recorded in Supabase for {ticker}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error uploading to Supabase: {str(e)}")
            return False
    
    def load_model(self, ticker: str) -> Optional[object]:
        """
        Load a model if it exists
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Loaded model or None if not found
        """
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
        model_path = self.get_model_path(ticker, "current")
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
