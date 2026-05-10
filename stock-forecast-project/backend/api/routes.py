"""
API Routes - Defines FastAPI endpoints for forecasting
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import numpy as np
import logging
from datetime import datetime, timedelta

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
router = APIRouter(prefix="/api/v1", tags=["forecasting"])

# Placeholder - will be properly initialized in main.py
forecasting_service = None

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
        if not forecasting_service:
            raise HTTPException(status_code=503, detail="Forecasting service not initialized")
        
        result = forecasting_service.predict(
            ticker=request.ticker,
            days_ahead=request.days_ahead,
            period=request.period
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in forecast endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/forecast/{ticker}")
async def get_forecast_by_ticker(
    ticker: str = Query(..., description="Stock ticker symbol"),
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
        if not forecasting_service:
            raise HTTPException(status_code=503, detail="Forecasting service not initialized")
        
        request = PredictionRequest(ticker=ticker, days_ahead=days, period="1y")
        result = forecasting_service.predict(
            ticker=ticker,
            days_ahead=days,
            period="1y"
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_forecast_by_ticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/validate/{ticker}")
async def validate_ticker(ticker: str):
    """
    Validate if ticker exists and data is available
    
    Args:
        ticker: Stock ticker to validate
        
    Returns:
        Validation result
    """
    try:
        if not forecasting_service:
            raise HTTPException(status_code=503, detail="Forecasting service not initialized")
        
        is_valid = forecasting_service.validate_ticker(ticker)
        
        return {
            "ticker": ticker,
            "is_valid": is_valid,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error validating ticker: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/historical/{ticker}")
async def get_historical_data(
    ticker: str,
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
        if not forecasting_service:
            raise HTTPException(status_code=503, detail="Forecasting service not initialized")
        
        data = forecasting_service.get_historical(ticker, days)
        
        return {
            "ticker": ticker,
            "historical": data,
            "period_days": days,
            "timestamp": datetime.now().isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting historical data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/metrics/{ticker}")
async def get_model_metrics(ticker: str):
    """
    Get model performance metrics for a ticker
    
    Args:
        ticker: Stock ticker symbol
        
    Returns:
        Model evaluation metrics
    """
    try:
        if not forecasting_service:
            raise HTTPException(status_code=503, detail="Forecasting service not initialized")
        
        metrics = forecasting_service.get_metrics(ticker)
        
        return {
            "ticker": ticker,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
