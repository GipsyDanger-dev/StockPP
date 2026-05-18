"""
Insight Engine - Generates AI-driven market insights from model data and market trends
Uses Supabase data + model metrics to generate meaningful insights
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)


class InsightEngine:
    """Generates market insights based on trained models and market data"""
    
    def __init__(self, model_manager=None):
        self.model_manager = model_manager
        
    def get_all_insights(self) -> Dict:
        """
        Generate comprehensive insights from all available data
        Returns featured article + list of insight cards
        """
        insights = {
            "featured": self._generate_featured_insight(),
            "insights": self._generate_insight_cards(),
            "summary": self._generate_market_summary(),
            "timestamp": datetime.now().isoformat()
        }
        return insights
    
    def _generate_featured_insight(self) -> Dict:
        """Generate featured article based on model performance and market trends"""
        # Get all model info if available
        model_info = {}
        if self.model_manager:
            try:
                model_info = self.model_manager.get_all_model_info()
            except Exception:
                pass
        
        # Determine best performing model
        best_ticker = None
        best_rmse = float('inf')
        
        for ticker, info in model_info.items():
            metrics = info.get("metrics", {})
            rmse = metrics.get("rmse", float('inf'))
            if rmse < best_rmse:
                best_rmse = rmse
                best_ticker = ticker
        
        # Count models
        total_models = len(model_info)
        
        # Generate dynamic content
        if total_models > 0 and best_ticker:
            title = f"AI Model Performance: {best_ticker} Leads with RMSE {best_rmse:.4f}"
            summary = (
                f"Our LSTM deep learning models are actively tracking {total_models} stock(s). "
                f"The {best_ticker} model shows the strongest predictive accuracy with "
                f"RMSE of {best_rmse:.4f} on normalized data. "
                f"Models are retrained periodically to adapt to changing market conditions."
            )
            category = "AI Insights"
        else:
            title = "Getting Started: Train Your First Model"
            summary = (
                "No trained models detected yet. Search for a stock ticker on the Dashboard "
                "to automatically train a 70-epoch LSTM model. Once trained, real AI-powered "
                "predictions and insights will appear here."
            )
            category = "Getting Started"
        
        return {
            "title": title,
            "summary": summary,
            "category": category,
            "date": datetime.now().strftime("%b %d, %Y"),
            "read_time": "3 min read"
        }
    
    def _generate_insight_cards(self) -> List[Dict]:
        """Generate insight cards from ticker data and model metrics"""
        cards = []
        
        # Get model info
        model_info = {}
        if self.model_manager:
            try:
                model_info = self.model_manager.get_all_model_info()
            except Exception:
                pass
        
        # Get tickers from Supabase
        tickers_data = []
        try:
            from core.supabase_client import get_all_tickers
            tickers_data = get_all_tickers()
        except Exception as e:
            logger.warning(f"Cannot fetch tickers from Supabase: {e}")
        
        # Card 1: Model Overview
        total_models = len(model_info)
        models_needing_retrain = sum(
            1 for info in model_info.values()
            if info.get("age_hours", 0) > 24
        )
        cards.append({
            "id": "model-overview",
            "title": "Model Training Status",
            "category": "AI Metrics",
            "content": (
                f"{total_models} model(s) trained. "
                f"{models_needing_retrain} model(s) need retraining (>24h old). "
                "Auto-retraining can be scheduled via ModelScheduler."
            ),
            "icon": "activity",
            "date": datetime.now().strftime("%b %d, %Y")
        })
        
        # Card 2: Market Coverage
        total_tickers = len(tickers_data)
        sectors = {}
        for t in tickers_data:
            sector = t.get("sector", "Unknown")
            sectors[sector] = sectors.get(sector, 0) + 1
        
        sector_info = ", ".join([f"{s}: {c}" for s, c in sectors.items()])
        cards.append({
            "id": "market-coverage",
            "title": "Market Coverage",
            "category": "Market Data",
            "content": (
                f"Tracking {total_tickers} tickers across {len(sectors)} sectors. "
                f"Sectors: {sector_info}. "
                "Add more tickers to expand market coverage."
            ),
            "icon": "bar-chart",
            "date": datetime.now().strftime("%b %d, %Y")
        })
        
        # Card 3: Best Model Highlight
        best_ticker = None
        best_rmse = float('inf')
        for ticker, info in model_info.items():
            metrics = info.get("metrics", {})
            rmse = metrics.get("rmse", float('inf'))
            if rmse < best_rmse:
                best_rmse = rmse
                best_ticker = ticker
        
        if best_ticker:
            cards.append({
                "id": "best-model",
                "title": f"Top Performer: {best_ticker}",
                "category": "AI Performance",
                "content": (
                    f"The {best_ticker} LSTM model achieved the lowest RMSE ({best_rmse:.4f}) "
                    f"among all trained models. This indicates strong predictive capability "
                    f"for {best_ticker} price movements."
                ),
                "icon": "trending-up",
                "date": datetime.now().strftime("%b %d, %Y")
            })
        else:
            cards.append({
                "id": "no-model",
                "title": "No Models Trained Yet",
                "category": "Getting Started",
                "content": (
                    "Train your first model by searching for a stock ticker on the Dashboard. "
                    "The system will automatically train a 70-epoch LSTM model."
                ),
                "icon": "activity",
                "date": datetime.now().strftime("%b %d, %Y")
            })
        
        # Card 4: Retraining Recommendation
        if models_needing_retrain > 0:
            cards.append({
                "id": "retrain-recommendation",
                "title": "Models Need Retraining",
                "category": "Maintenance",
                "content": (
                    f"{models_needing_retrain} model(s) are older than 24 hours. "
                    "Use batch retrain endpoint to update all models with fresh market data."
                ),
                "icon": "refresh",
                "date": datetime.now().strftime("%b %d, %Y")
            })
        else:
            cards.append({
                "id": "system-health",
                "title": "System Healthy",
                "category": "System Status",
                "content": (
                    "All models are up to date. "
                    "The system is operating normally with no retraining needed."
                ),
                "icon": "check-circle",
                "date": datetime.now().strftime("%b %d, %Y")
            })
        
        return cards
    
    def _generate_market_summary(self) -> Dict:
        """Generate market summary statistics"""
        model_info = {}
        if self.model_manager:
            try:
                model_info = self.model_manager.get_all_model_info()
            except Exception:
                pass
        
        total_models = len(model_info)
        models_needing_retrain = sum(
            1 for info in model_info.values()
            if info.get("age_hours", 0) > 24
        )
        
        avg_rmse = 0
        if total_models > 0:
            rmses = [info.get("metrics", {}).get("rmse", 0) for info in model_info.values()]
            avg_rmse = sum(rmses) / len(rmses) if rmses else 0
        
        return {
            "total_models": total_models,
            "models_needing_retrain": models_needing_retrain,
            "avg_rmse": round(avg_rmse, 4),
            "recommendation": "All systems operational" if models_needing_retrain == 0 else f"{models_needing_retrain} model(s) need retraining"
        }