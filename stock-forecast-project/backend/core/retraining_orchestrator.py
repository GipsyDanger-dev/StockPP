"""
Retraining Orchestrator - Manages the complete model retraining workflow
"""

import logging
from typing import Optional, List, Dict
from datetime import datetime
import numpy as np

from .model_manager import ModelManager
from .model import LSTMModel
from .data_engine import DataEngine

logger = logging.getLogger(__name__)


class RetrainingOrchestrator:
    """Orchestrates the complete model retraining workflow"""
    
    def __init__(self, model_manager: Optional[ModelManager] = None):
        """
        Initialize retraining orchestrator
        
        Args:
            model_manager: ModelManager instance for persistence
        """
        self.model_manager = model_manager or ModelManager()
        self.data_engine = DataEngine()
        
    def retrain_model(
        self,
        ticker: str,
        period: str = "1y",
        epochs: int = 10,
        batch_size: int = 32,
        force_retrain: bool = False
    ) -> Dict:
        """
        Retrain a model with validation
        
        Args:
            ticker: Stock ticker symbol
            period: Historical period to fetch data
            epochs: Number of training epochs
            batch_size: Training batch size
            force_retrain: Force retraining even if recent model exists
            
        Returns:
            Dictionary with retraining results and status
        """
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
            # Check if retraining is needed
            if not force_retrain and not self.model_manager.should_retrain(ticker_upper):
                logger.info(f"Model for {ticker_upper} is recent. Skipping retrain.")
                result["status"] = "skipped"
                result["reason"] = "Model is recent"
                return result
            
            logger.info(f"Starting retraining for {ticker_upper}")
            
            # Fetch new data
            logger.info(f"Fetching data for {ticker_upper}...")
            df = self.data_engine.fetch_data(ticker_upper, period=period)
            
            if df is None or len(df) < 70:
                result["error"] = f"Insufficient data. Got {len(df) if df is not None else 0} points"
                logger.error(result["error"])
                return result
            
            # Prepare data
            logger.info("Preparing data...")
            scaled_data, scaler = self.data_engine.prepare_data(df)
            
            # Create sequences
            X, y = self.data_engine.create_sequences(scaled_data)
            
            if len(X) < 20:
                result["error"] = f"Insufficient sequences. Got {len(X)}"
                logger.error(result["error"])
                return result
            
            # Split data
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            logger.info(f"Data split - Train: {len(X_train)}, Test: {len(X_test)}")
            
            # Build model
            logger.info("Building new model...")
            model = LSTMModel(window_size=60)
            model.build_model()
            
            # Train model
            logger.info(f"Training model ({epochs} epochs)...")
            model.train(X_train, y_train, epochs=epochs, batch_size=batch_size)
            
            # Evaluate model
            logger.info("Evaluating model...")
            new_metrics = model.evaluate(X_test, y_test)
            result["new_metrics"] = new_metrics
            
            # Get old model metrics for comparison
            old_metrics = self.model_manager.get_model_metrics(ticker_upper)
            result["old_metrics"] = old_metrics
            
            # Validate improvement
            logger.info("Validating model improvement...")
            is_better = self.model_manager.validate_model_improvement(
                old_metrics or {},
                new_metrics
            )
            
            if is_better:
                # Save model
                logger.info(f"Saving improved model for {ticker_upper}...")
                saved = self.model_manager.save_model(
                    model.model,
                    ticker_upper,
                    new_metrics
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
        """
        Retrain multiple models in batch
        
        Args:
            tickers: List of ticker symbols. If None, retrain all.
            period: Historical period
            epochs: Training epochs
            force_retrain: Force retraining
            
        Returns:
            Dictionary with batch results
        """
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
        
        # If no tickers specified, use available models or default list
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
        """Get default list of tickers to retrain"""
        # Common stocks to retrain if none specified
        return ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"]
    
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
