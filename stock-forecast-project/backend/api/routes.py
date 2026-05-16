"""
API Routes - Defines FastAPI endpoints for forecasting
"""

from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
from pydantic import BaseModel
import numpy as np
import logging
from datetime import datetime, timedelta
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from core.forecasting_service import ForecastingService

logger = logging.getLogger(__name__)

# Pydantic models for request/response validation
class PredictionRequest(BaseModel):
    """Request model for stock prediction"""
    ticker: str
    days_ahead: int = 1
    period: str = "1y"
    
    class Config:
        json_schema_extra = {
            "example": {
                "ticker": "AAPL",
                "days_ahead": 5,
                "period": "1y"
            }
        }

class PricePoint(BaseModel):
    """Single price data point"""
    date: str
    price: float

class ForecastResponse(BaseModel):
    """API response for forecast"""
    ticker: str
    historical: List[PricePoint]
    forecast: List[PricePoint]
    metrics: dict
    trend: str
    timestamp: str

# Initialize router
router = APIRouter(tags=["forecasting"])

# Global forecasting service instance
_forecasting_service = None

def get_forecasting_service():
    """Get or create the forecasting service instance (lazy initialization)"""
    global _forecasting_service
    if _forecasting_service is None:
        try:
            logger.info("Initializing forecasting service...")
            _forecasting_service = ForecastingService()
            logger.info("Forecasting service initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing forecasting service: {str(e)}", exc_info=True)
            raise
    return _forecasting_service

def initialize_forecasting_service():
    """Initialize the forecasting service"""
    try:
        svc = get_forecasting_service()
        logger.info("Forecasting service ready")
    except Exception as e:
        logger.error(f"Error initializing forecasting service: {str(e)}", exc_info=True)
        raise

@router.post("/forecast")
async def forecast_stock(request: PredictionRequest):
    """
    Get stock price forecast
    
    Args:
        request: PredictionRequest with ticker, days_ahead, period
        
    Returns:
        ForecastResponse with historical, forecast, and metrics
    """
    try:
        service = get_forecasting_service()
        
        result = service.predict(
            ticker=request.ticker,
            days_ahead=request.days_ahead,
            period=request.period
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/forecast/{ticker}")
async def get_forecast_by_ticker(
    ticker: str = Path(..., description="Stock ticker symbol"),
    days: int = Query(1, ge=1, le=30, description="Days to forecast")
):
    """
    Get forecast for a specific ticker (simplified endpoint)
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days to forecast (1-30)
        
    Returns:
        Forecast data
    """
    try:
        service = get_forecasting_service()
        
        request = PredictionRequest(ticker=ticker, days_ahead=days, period="1y")
        result = service.predict(
            ticker=ticker,
            days_ahead=days,
            period="1y"
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_forecast_by_ticker: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Validate if ticker exists and data is available
    
    Args:
        ticker: Stock ticker to validate
        
    Returns:
        Validation result
    """
    try:
        service = get_forecasting_service()
        
        validation_result = service.validate_ticker(ticker)
        
        return {
            "ticker": ticker,
            "is_valid": validation_result["valid"], 
            "message": validation_result["message"], 
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error validating ticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/historical/{ticker}")
async def get_historical_data(
    ticker: str = Path(..., description="Stock ticker symbol"),
    days: int = Query(365, ge=30, le=3650, description="Number of days of history")
):
    """
    Get historical price data for a ticker
    
    Args:
        ticker: Stock ticker symbol
        days: Number of days of historical data
        
    Returns:
        Historical price data
    """
    try:
        service = get_forecasting_service()
        
        # Get data by making a prediction and returning just the historical data
        result = service.predict(ticker=ticker, days_ahead=1, period="1y")
        
        return {
            "ticker": ticker,
            "historical": result["historical"],
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting historical data: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/metrics/{ticker}")
async def get_model_metrics(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Get model performance metrics for a ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Model evaluation metrics
    """
    try:
        service = get_forecasting_service()
        
        metrics = service.get_metrics(ticker)
        
        return {
            "ticker": ticker,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ============== Model Management Endpoints ==============

@router.post("/retrain/{ticker}")
async def trigger_retrain(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Manually trigger model retraining for a specific ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Retraining job status
    """
    try:
        service = get_forecasting_service()
        
        # Get retraining orchestrator
        from core.retraining_orchestrator import RetrainingOrchestrator
        orchestrator = RetrainingOrchestrator(service.model_manager)
        
        # Start retraining
        result = orchestrator.retrain_model(
            ticker=ticker,
            force_retrain=True,
            epochs=10
        )
        
        return {
            "ticker": ticker,
            "job_started": True,
            "status": result.get("status"),
            "timestamp": datetime.now().isoformat(),
            "details": result
        }
        
    except Exception as e:
        logger.error(f"Error triggering retrain for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/retrain/status/{ticker}")
async def get_retrain_status(ticker: str = Path(..., description="Stock ticker symbol")):
    """
    Get retraining status and model info for a ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Model status and metadata
    """
    try:
        service = get_forecasting_service()
        
        ticker_upper = ticker.upper()
        metrics = service.model_manager.get_model_metrics(ticker_upper)
        age = service.model_manager.get_model_age(ticker_upper)
        should_retrain = service.model_manager.should_retrain(ticker_upper)
        
        return {
            "ticker": ticker_upper,
            "model_exists": service.model_manager.model_exists(ticker_upper),
            "metrics": metrics,
            "age_hours": age,
            "should_retrain": should_retrain,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting retrain status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/models/status")
async def get_all_models_status():
    """
    Get status of all models
    
    Returns:
        Information about all models
    """
    try:
        service = get_forecasting_service()
        
        if not service.model_manager:
            return {
                "models": {},
                "total_models": 0,
                "timestamp": datetime.now().isoformat()
            }
        
        model_info = service.model_manager.get_all_model_info()
        
        return {
            "models": model_info,
            "total_models": len(model_info),
            "models_needing_retrain": sum(
                1 for info in model_info.values()
                if info.get("age_hours", 0) > 24
            ),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting models status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/batch-retrain")
async def trigger_batch_retrain(
    tickers: Optional[List[str]] = None,
    force: bool = False
):
    """
    Trigger batch retraining for multiple tickers
    
    Args:
        tickers: List of tickers to retrain (optional)
        force: Force retraining even if models are recent
        
    Returns:
        Batch retraining job status
    """
    try:
        service = get_forecasting_service()
        
        from core.retraining_orchestrator import RetrainingOrchestrator
        orchestrator = RetrainingOrchestrator(service.model_manager)
        
        result = orchestrator.batch_retrain(
            tickers=tickers,
            force_retrain=force,
            epochs=10
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error in batch retrain: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

